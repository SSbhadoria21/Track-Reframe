import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#050505]" />}>
      <AuthCard initialView="login" />
    </Suspense>
  );
}
