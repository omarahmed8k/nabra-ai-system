"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState("");

  // All hooks must be called before any conditional returns
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created!", {
        description: "You can now sign in with your credentials.",
      });
      router.push("/auth/login?registered=true");
    },
    onError: (err) => {
      setError(err.message);
      toast.error("Registration Failed", {
        description: err.message,
      });
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Redirect based on user role
      if (session.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else if (session.user.role === "PROVIDER") {
        router.push("/provider");
      } else {
        router.push("/client");
      }
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render register form if already authenticated
  if (status === "authenticated") {
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Validation Error", {
        description: "Passwords do not match",
      });
      return;
    }

    registerMutation.mutate({ name, email, password });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Link href="/" className="flex items-center space-x-2">
              <motion.div whileHover={{ scale: 1.1 }}>
                <Image
                  src="/images/favicon.svg"
                  alt="Nabra"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </motion.div>
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                minLength={2}
                maxLength={100}
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">2-100 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">Valid email address required</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                maxLength={100}
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters required</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                maxLength={100}
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">Must match password above</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <motion.div className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
