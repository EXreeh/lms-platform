"use client";

import { Navbar } from "@/components/layout/navbar";

/** @deprecated Use Navbar directly — it reads auth state internally */
export function AuthNavbar() {
  return <Navbar />;
}
