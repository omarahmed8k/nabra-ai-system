"use client";

import { useState, useEffect } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

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

  // Don't render login form if already authenticated
  if (status === "authenticated") {
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Login Failed", {
          description: "Invalid email or password. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      // Get the updated session to determine user role
      const session = await getSession();
      
      toast.success("Welcome back!", {
        description: "You have been successfully logged in.",
      });
      
      // Redirect based on user role
      if (session?.user?.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else if (session?.user?.role === "PROVIDER") {
        router.push("/provider");
      } else {
        router.push("/client");
      }
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Error", {
        description: "An error occurred. Please try again.",
      });
      setIsLoading(false);
    }
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
              <motion.div 
                whileHover={{ scale: 1.1 }}
              >
                <Image src="/images/favicon.svg" alt="Nabra" width={48} height={48} className="w-12 h-12" />
              </motion.div>
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to sign in to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <motion.div className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
