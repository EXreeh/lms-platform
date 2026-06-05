import { Prisma } from "@lms/database";

export function isPrismaKnownError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    "clientVersion" in error
  );
}

export function logPrismaRouteError(route: string, error: unknown, context?: string): void {
  const label = context ? `${route} (${context})` : route;
  if (isPrismaKnownError(error)) {
    console.error(
      `[API] ${label} Prisma code=${error.code} meta=${JSON.stringify(error.meta ?? {})} message=${error.message}`,
    );
    return;
  }
  if (error instanceof Error) {
    console.error(`[API] ${label} error=${error.message}`);
    return;
  }
  console.error(`[API] ${label} unknown error`, error);
}

export async function safePrismaQuery<T>(
  route: string,
  context: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logPrismaRouteError(route, error, context);
    return fallback;
  }
}
