"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchAccountProfile,
  updateAccountProfile,
  changeAccountPassword,
} from "@/lib/auth-api";
import { formatApiError } from "@/lib/format-api-error";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import type { Role } from "@/types/auth";
import { brand } from "@/lib/design-tokens";

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  ADMIN: "Administrator",
};

function statEntries(role: Role, stats: Record<string, number>): { label: string; value: number | string; icon: string }[] {
  if (role === "STUDENT") {
    return [
      { label: "Enrolled courses", value: stats.enrolledCourses ?? 0, icon: "📚" },
      { label: "Completed courses", value: stats.completedCourses ?? 0, icon: "✓" },
      { label: "Certificates", value: stats.certificates ?? 0, icon: "🏆" },
      { label: "Quiz attempts", value: stats.quizAttempts ?? 0, icon: "?" },
    ];
  }
  if (role === "TEACHER") {
    return [
      { label: "Courses", value: stats.courses ?? 0, icon: "📚" },
      { label: "Total enrollments", value: stats.totalEnrollments ?? 0, icon: "👥" },
      { label: "Resources uploaded", value: stats.resources ?? 0, icon: "📎" },
      { label: "Quizzes", value: stats.quizzes ?? 0, icon: "?" },
    ];
  }
  return [
    { label: "Students", value: stats.students ?? 0, icon: "🎓" },
    { label: "Teachers", value: stats.teachers ?? 0, icon: "👨‍🏫" },
    { label: "Courses", value: stats.courses ?? 0, icon: "📚" },
    { label: "Enrollments", value: stats.enrollments ?? 0, icon: "📋" },
  ];
}

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchAccountProfile>>["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchAccountProfile();
        setProfile(res.data);
        setFirstName(res.data.user.firstName);
        setLastName(res.data.user.lastName);
      } catch (err) {
        toastError(formatApiError(err, "Could not load your profile."));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [toastError]);

  const role = profile?.user.role ?? authUser?.role ?? "STUDENT";

  function handleCancelEdit() {
    if (profile) {
      setFirstName(profile.user.firstName);
      setLastName(profile.user.lastName);
    }
    setIsEditing(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toastError("Please complete all required fields.");
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await updateAccountProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setProfile((prev) => (prev ? { ...prev, user: res.data.user } : prev));
      setIsEditing(false);
      await refreshUser();
      toastSuccess("Profile updated successfully.");
    } catch (err) {
      toastError(formatApiError(err, "Could not save profile."));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toastError("Please complete all required fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("New passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await changeAccountPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      toastSuccess(res.message || "Password changed successfully.");
    } catch (err) {
      toastError(formatApiError(err, "Could not change password."));
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <DashboardShell
      title="My Profile"
      description={`Your ${brand.name} account details and activity summary.`}
      badge={ROLE_LABELS[role]}
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role={role} />
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : profile ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <section className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-lg font-bold">Account information</h2>
                  {!isEditing && (
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                      Edit profile
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                      <Input
                        label="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" variant="gold" disabled={isSavingProfile}>
                        {isSavingProfile ? <Spinner size="sm" /> : "Save changes"}
                      </Button>
                      <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={isSavingProfile}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">First name</dt>
                      <dd className="mt-1 font-medium">{profile.user.firstName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last name</dt>
                      <dd className="mt-1 font-medium">{profile.user.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
                      <dd className="mt-1 font-medium">{profile.user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</dt>
                      <dd className="mt-1 font-medium">{ROLE_LABELS[profile.user.role]}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Member since</dt>
                      <dd className="mt-1 font-medium">
                        {new Date(profile.user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email verified</dt>
                      <dd className="mt-1 font-medium">{profile.user.emailVerified ? "Yes" : "No"}</dd>
                    </div>
                  </dl>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-lg font-bold">Change password</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Minimum 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  </div>
                  {!showPasswordForm && (
                    <Button variant="secondary" size="sm" onClick={() => setShowPasswordForm(true)}>
                      Change password
                    </Button>
                  )}
                </div>
                {showPasswordForm && (
                  <form onSubmit={handleChangePassword} className="mt-6 max-w-md space-y-4">
                    <Input
                      label="Current password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <Input
                      label="New password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <Input
                      label="Confirm new password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" variant="gold" disabled={isChangingPassword}>
                        {isChangingPassword ? <Spinner size="sm" /> : "Update password"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </section>

              <section>
                <h2 className="font-serif text-lg font-bold">Your stats</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {statEntries(profile.user.role, profile.stats).map((stat) => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} accent="green" />
                  ))}
                </div>
              </section>
            </motion.div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
