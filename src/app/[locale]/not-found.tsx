"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppLink } from "@/components/ui/whatsapp-support";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardContent className="p-8 sm:p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-20 bg-primary rounded-full" />
              <FileQuestion className="h-24 w-24 text-primary relative" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been
              moved, deleted, or never existed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" size="lg" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Link href="/">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Need help? <WhatsAppLink />
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
