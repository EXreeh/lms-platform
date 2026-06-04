import type { MessageType, Prisma, Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";

const messageInclude = {
  sender: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  batch: { select: { id: true, name: true } },
  recipients: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
    },
  },
} satisfies Prisma.MessageInclude;

function mapMessage(
  msg: Prisma.MessageGetPayload<{ include: typeof messageInclude }>,
  viewerId: string,
) {
  const myRecipient = msg.recipients.find((r) => r.userId === viewerId);
  return {
    id: msg.id,
    subject: msg.subject,
    content: msg.content,
    type: msg.type,
    batchId: msg.batchId,
    batchName: msg.batch?.name,
    feePlanId: msg.feePlanId,
    createdAt: msg.createdAt.toISOString(),
    readAt: myRecipient?.readAt?.toISOString() ?? null,
    isRead: Boolean(myRecipient?.readAt),
    sender: {
      id: msg.sender.id,
      name: `${msg.sender.firstName} ${msg.sender.lastName}`.trim(),
      email: msg.sender.email,
      role: msg.sender.role,
    },
    recipientCount: msg.recipients.length,
    recipients: msg.recipients.map((r) => ({
      id: r.user.id,
      name: `${r.user.firstName} ${r.user.lastName}`.trim(),
      email: r.user.email,
      role: r.user.role,
      readAt: r.readAt?.toISOString() ?? null,
    })),
  };
}

async function resolveRecipientIds(input: {
  senderId: string;
  senderRole: Role;
  recipientIds?: string[];
  batchId?: string;
  broadcastAllStudents?: boolean;
}): Promise<string[]> {
  const ids = new Set<string>();

  if (input.recipientIds?.length) {
    for (const id of input.recipientIds) {
      if (id !== input.senderId) ids.add(id);
    }
  }

  if (input.batchId) {
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId },
      include: { students: true, teacher: true },
    });
    if (!batch) throw ApiError.notFound("Batch not found");

    if (input.senderRole === "TEACHER" && batch.teacherId !== input.senderId) {
      throw ApiError.forbidden("You are not assigned to this batch");
    }

    if (input.senderRole === "STUDENT") {
      const member = batch.students.some((s) => s.studentId === input.senderId);
      if (!member) throw ApiError.forbidden("You are not in this batch");
    }

    for (const s of batch.students) {
      if (s.studentId !== input.senderId) ids.add(s.studentId);
    }
    if (batch.teacherId && batch.teacherId !== input.senderId) {
      ids.add(batch.teacherId);
    }
  }

  if (input.broadcastAllStudents) {
    if (input.senderRole !== "ADMIN") {
      throw ApiError.forbidden("Only admins can message all students");
    }
    const students = await prisma.user.findMany({
      where: { role: "STUDENT", suspended: false },
      select: { id: true },
    });
    for (const s of students) ids.add(s.id);
  }

  return [...ids];
}

async function assertCanMessageRecipients(
  senderId: string,
  senderRole: Role,
  recipientIds: string[],
) {
  if (senderRole === "ADMIN") return;

  if (senderRole === "STUDENT") {
    const recipients = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, role: true },
    });
    for (const r of recipients) {
      if (r.role === "ADMIN") continue;
      if (r.role === "TEACHER") {
        const batch = await prisma.batch.findFirst({
          where: {
            teacherId: r.id,
            students: { some: { studentId: senderId } },
          },
        });
        if (!batch) throw ApiError.forbidden("You can only message your assigned teacher or admin");
        continue;
      }
      throw ApiError.forbidden("Students cannot message other students directly");
    }
    return;
  }

  if (senderRole === "TEACHER") {
    const batches = await prisma.batch.findMany({
      where: { teacherId: senderId },
      include: { students: true },
    });
    const allowedStudentIds = new Set(
      batches.flatMap((b) => b.students.map((s) => s.studentId)),
    );

    const recipients = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, role: true },
    });

    for (const r of recipients) {
      if (r.role === "ADMIN") continue;
      if (r.role === "STUDENT" && !allowedStudentIds.has(r.id)) {
        throw ApiError.forbidden("You can only message students in your assigned batches");
      }
      if (r.role === "TEACHER") {
        throw ApiError.forbidden("Teachers cannot message other teachers");
      }
    }
  }
}

export async function sendMessage(input: {
  senderId: string;
  senderRole: Role;
  recipientIds?: string[];
  batchId?: string;
  broadcastAllStudents?: boolean;
  subject: string;
  content: string;
  type?: MessageType;
  feePlanId?: string;
}) {
  const recipientIds = await resolveRecipientIds({
    senderId: input.senderId,
    senderRole: input.senderRole,
    recipientIds: input.recipientIds,
    batchId: input.batchId,
    broadcastAllStudents: input.broadcastAllStudents,
  });

  if (recipientIds.length === 0) {
    throw ApiError.badRequest("No recipients for this message");
  }

  await assertCanMessageRecipients(input.senderId, input.senderRole, recipientIds);

  const message = await prisma.message.create({
    data: {
      senderId: input.senderId,
      batchId: input.batchId ?? null,
      feePlanId: input.feePlanId ?? null,
      subject: input.subject,
      content: input.content,
      type: input.type ?? "GENERAL",
      recipients: {
        create: recipientIds.map((userId) => ({ userId })),
      },
    },
    include: messageInclude,
  });

  return mapMessage(message, input.senderId);
}

export async function getInbox(userId: string, filters?: { unreadOnly?: boolean }) {
  const where: Prisma.MessageRecipientWhereInput = { userId };
  if (filters?.unreadOnly) where.readAt = null;

  const rows = await prisma.messageRecipient.findMany({
    where,
    include: { message: { include: messageInclude } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((r) => ({
    ...mapMessage(r.message, userId),
    recipientId: r.id,
  }));
}

export async function getSent(userId: string) {
  const messages = await prisma.message.findMany({
    where: { senderId: userId },
    include: messageInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return messages.map((m) => mapMessage(m, userId));
}

export async function getUnreadCount(userId: string) {
  return prisma.messageRecipient.count({
    where: { userId, readAt: null },
  });
}

export async function markRead(messageId: string, userId: string) {
  const recipient = await prisma.messageRecipient.findUnique({
    where: { messageId_userId: { messageId, userId } },
  });
  if (!recipient) throw ApiError.notFound("Message not found");

  await prisma.messageRecipient.update({
    where: { id: recipient.id },
    data: { readAt: recipient.readAt ?? new Date() },
  });

  if (recipient.readAt === null) {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      select: { feePlanId: true, type: true },
    });
    if (msg?.type === "FEE_REMINDER" && msg.feePlanId) {
      await prisma.feeReminder.updateMany({
        where: { feePlanId: msg.feePlanId, studentId: userId, status: "SENT" },
        data: { status: "READ" },
      });
    }
  }

  return { success: true };
}

export async function getComposeTargets(userId: string, role: Role) {
  if (role === "ADMIN") {
    const [students, teachers] = await Promise.all([
      prisma.user.findMany({
        where: { role: "STUDENT", suspended: false },
        select: { id: true, firstName: true, lastName: true, role: true },
        take: 200,
        orderBy: { lastName: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "TEACHER", suspended: false },
        select: { id: true, firstName: true, lastName: true, role: true },
        take: 100,
      }),
    ]);
    const batches = await prisma.batch.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return {
      recipients: [...students, ...teachers].map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        role: u.role,
      })),
      batches: batches.map((b) => ({ id: b.id, name: b.name })),
      canBroadcastAllStudents: true,
    };
  }

  if (role === "TEACHER") {
    const batches = await prisma.batch.findMany({
      where: { teacherId: userId },
      include: {
        students: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
    });
    const recipients = batches.flatMap((b) =>
      b.students.map((s) => ({
        id: s.student.id,
        name: `${s.student.firstName} ${s.student.lastName}`.trim(),
        role: s.student.role,
        batchName: b.name,
      })),
    );
    return {
      recipients,
      batches: batches.map((b) => ({ id: b.id, name: b.name })),
      canBroadcastAllStudents: false,
    };
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", suspended: false },
    select: { id: true, firstName: true, lastName: true, role: true },
  });
  const batchLinks = await prisma.batchStudent.findMany({
    where: { studentId: userId },
    include: { batch: { include: { teacher: true } } },
  });
  const teachers = batchLinks
    .map((l) => l.batch.teacher)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const recipients = [
    ...admins.map((a) => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`.trim(),
      role: a.role,
    })),
    ...teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`.trim(),
      role: t.role,
    })),
  ];

  const unique = new Map(recipients.map((r) => [r.id, r]));

  return {
    recipients: [...unique.values()],
    batches: [],
    canBroadcastAllStudents: false,
  };
}

export async function getMessageById(messageId: string, userId: string) {
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    include: messageInclude,
  });
  if (!msg) throw ApiError.notFound("Message not found");

  const isSender = msg.senderId === userId;
  const isRecipient = msg.recipients.some((r) => r.userId === userId);
  if (!isSender && !isRecipient) throw ApiError.forbidden("Access denied");

  return mapMessage(msg, userId);
}
