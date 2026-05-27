"use client";

import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/context/auth-context";

export function AuthNavbar() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <Navbar />;
  }

  return (
    <Navbar
      userName={user ? `${user.firstName} ${user.lastName}`.trim() : undefined}
      onLogout={user ? () => void logout() : undefined}
      dashboardHref={
        user
          ? user.role === "STUDENT"
            ? "/dashboard/student"
            : user.role === "TEACHER"
              ? "/dashboard/teacher"
              : "/dashboard/admin"
          : undefined
      }
    />
  );
}
