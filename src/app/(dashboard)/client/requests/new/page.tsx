"use client";

import { useState, useMemo, useEffect } from "react";
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
import { ServiceAttributesForm } from "@/components/client/service-attributes-form";
import { trpc } from "@/lib/trpc/client";
import { showError } from "@/lib/error-handler";
import { ArrowLeft } from "lucide-react";
import type { AttributeResponse } from "@/types/service-attributes";

export default function NewRequestPage() {
  const router = useRouter();
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [priority, setPriority] = useState("2");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [attributeResponses, setAttributeResponses] = useState<AttributeResponse[]>([]);

  const { data: serviceTypes } =
    trpc.request.getServiceTypes.useQuery();
  const { data: subscription } = trpc.subscription.getActive.useQuery();
  const { data: adminPriorityCosts } = trpc.admin.getPriorityCosts.useQuery();

  const selectedService = useMemo(
    () => serviceTypes?.find((s: { id: string }) => s.id === selectedServiceType),
    [serviceTypes, selectedServiceType]
  );

  // Reset attribute responses when service type changes
  useEffect(() => {
    setAttributeResponses([]);
  }, [selectedServiceType]);

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

  const hasCredits = subscription && subscription.remainingCredits > 0;
  const baseCreditCost = (selectedService as { creditCost?: number })?.creditCost || 1;
  
  // Priority cost from admin settings (defaults if not loaded)
  const lowCost = adminPriorityCosts?.low ?? 0;
  const mediumCost = adminPriorityCosts?.medium ?? 1;
  const highCost = adminPriorityCosts?.high ?? 2;
  
  const priorityCostsMap: Record<string, number> = { "1": lowCost, "2": mediumCost, "3": highCost };
  const priorityCost = priorityCostsMap[priority] || mediumCost;
  const totalCreditCost = baseCreditCost + priorityCost;
  
  const canAffordService = subscription && subscription.remainingCredits >= totalCreditCost;
  
  const priorityLabels: Record<string, string> = { 
    "1": `+${lowCost}`, 
    "2": `+${mediumCost}`, 
    "3": `+${highCost}` 
  };
  const priorityLabel = priorityLabels[priority] || `+${mediumCost}`;
  
  let buttonText = "Create Request (1 Credit)";
  if (createRequest.isPending) {
    buttonText = "Creating...";
  } else if (totalCreditCost !== 1) {
    buttonText = `Create Request (${totalCreditCost} Credits)`;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const formPriority = Number.parseInt(formData.get("priority") as string) || 2;

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
      priority: formPriority,
      attachments: attachments.map((f) => f.url),
      attributeResponses: attributeResponses.length > 0 ? attributeResponses : undefined,
    });
  }

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

      {selectedServiceType && !canAffordService && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Insufficient Credits</CardTitle>
            <CardDescription className="text-orange-700">
              This request requires {totalCreditCost} credit{totalCreditCost === 1 ? '' : 's'} ({baseCreditCost} base × {priorityLabel} priority) but you only have {subscription?.remainingCredits || 0}. Please subscribe to a plan
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

      {!subscription && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">No Active Subscription</CardTitle>
            <CardDescription className="text-yellow-700">
              You need an active subscription to create requests. Please subscribe to a package to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/subscription">
              <Button>View Packages</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {subscription && serviceTypes?.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">No Services Available</CardTitle>
            <CardDescription className="text-blue-700">
              Your current package ({subscription.package?.name}) does not include any services. Please upgrade to access services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/subscription">
              <Button>Upgrade Package</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            {selectedServiceType ? (
              <>Base cost: <strong>{baseCreditCost} credit{baseCreditCost === 1 ? '' : 's'}</strong> × Priority multiplier ({priorityLabel}) = <strong>{totalCreditCost} credit{totalCreditCost === 1 ? '' : 's'}</strong>. You have{" "}
              <strong>{subscription?.remainingCredits || 0} credits</strong> available.</>
            ) : (
              <>Select a service to see the credit cost. You have{" "}
              {subscription?.remainingCredits || 0} credits available.</>
            )}
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
              <Select name="priority" value={priority} onValueChange={setPriority} disabled={!hasCredits}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low (+{lowCost} credits)</SelectItem>
                  <SelectItem value="2">Medium (+{mediumCost} credit{mediumCost === 1 ? '' : 's'})</SelectItem>
                  <SelectItem value="3">High (+{highCost} credits)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Priority adds to base cost: Low=+{lowCost}, Medium=+{mediumCost}, High=+{highCost} credits
              </p>
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

            {/* Dynamic Q&A based on selected service */}
            {selectedService && (selectedService as any).attributes && (
              <ServiceAttributesForm
                attributes={(selectedService as any).attributes}
                responses={attributeResponses}
                onChange={setAttributeResponses}
                disabled={!hasCredits || createRequest.isPending}
              />
            )}

            <div className="flex gap-4">
              <Link href="/client/requests">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={!canAffordService || createRequest.isPending}
              >
                {buttonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
