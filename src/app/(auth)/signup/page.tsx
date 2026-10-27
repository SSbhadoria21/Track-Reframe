import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#050505]" />}>
      <AuthCard initialView="signup" />
    </Suspense>
  );
}
