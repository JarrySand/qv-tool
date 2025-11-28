"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  callbackUrl?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
  children?: React.ReactNode;
}

export function SignOutButton({
  callbackUrl,
  variant = "destructive",
  className,
  children,
}: SignOutButtonProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: callbackUrl || "/auth/signin" });
  };

  return (
    <Button variant={variant} className={className} onClick={handleSignOut}>
      {children || "ログアウト"}
    </Button>
  );
}
