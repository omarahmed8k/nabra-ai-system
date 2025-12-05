"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { trpc } from "@/lib/trpc/client";
import { showError } from "@/lib/error-handler";
import { ArrowLeft } from "lucide-react";

export default function NewRequestPage() {
  const router = useRouter();
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const { data: serviceTypes } =
    trpc.request.getServiceTypes.useQuery();
  const { data: subscription } = trpc.subscription.getActive.useQuery();

  const createRequest = trpc.request.create.useMutation({
    onSuccess: (data) => {
      toast.success("Request Created!", {
        description: "Your request has been submitted successfully.",
      });
      router.push(`/client/requests/${data.request.id}`);
    },
    onError: (err: unknown) => {
      showError(err, "Failed to create request");
    },
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = Number.parseInt(formData.get("priority") as string) || 2;

    if (!selectedServiceType) {
      toast.error("Validation Error", {
        description: "Please select a service type",
      });
      return;
    }

    if (title.length < 5) {
      toast.error("Validation Error", {
        description: "Title must be at least 5 characters",
      });
      return;
    }

    if (description.length < 20) {
      toast.error("Validation Error", {
        description: "Description must be at least 20 characters",
      });
      return;
    }

    createRequest.mutate({
      title,
      description,
      serviceTypeId: selectedServiceType,
      priority,
      attachments: attachments.map((f) => f.url),
    });
  }

  const hasCredits = subscription && subscription.remainingCredits > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/client/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Request</h1>
          <p className="text-muted-foreground">
            Describe what you need and we&apos;ll match you with a provider
          </p>
        </div>
      </div>

      {!hasCredits && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Insufficient Credits</CardTitle>
            <CardDescription className="text-orange-700">
              You need at least 1 credit to create a request. Please subscribe to a plan
              or purchase more credits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/subscription">
              <Button>View Plans</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Creating a request will cost 1 credit. You have{" "}
            {subscription?.remainingCredits || 0} credits available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select
                value={selectedServiceType}
                onValueChange={setSelectedServiceType}
                disabled={!hasCredits}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes?.map((type: { id: string; name: string; icon: string | null }) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="E.g., Company Website Redesign"
                required
                minLength={5}
                disabled={!hasCredits || createRequest.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your project in detail. Include any specific requirements, preferences, or references..."
                required
                minLength={20}
                rows={6}
                disabled={!hasCredits || createRequest.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="2" disabled={!hasCredits}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <FileUpload
                onFilesChange={setAttachments}
                maxFiles={5}
                maxSizeMB={10}
                disabled={!hasCredits || createRequest.isPending}
              />
            </div>

            <div className="flex gap-4">
              <Link href="/client/requests">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={!hasCredits || createRequest.isPending}
              >
                {createRequest.isPending ? "Creating..." : "Create Request (1 Credit)"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
