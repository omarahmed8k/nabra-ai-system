"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const t = useTranslations("client.newRequest");
  const router = useRouter();
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [priority, setPriority] = useState("1");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [attributeResponses, setAttributeResponses] = useState<AttributeResponse[]>([]);

  const { data: serviceTypes } = trpc.request.getServiceTypes.useQuery();
  const { data: subscription } = trpc.subscription.getActive.useQuery();

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
      toast.success(t("toast.created"), {
        description: t("toast.createdDesc"),
      });
      router.push(`/client/requests/${data.request.id}`);
    },
    onError: (err: unknown) => {
      showError(err, "Failed to create request");
    },
  });

  const hasCredits = subscription && subscription.remainingCredits > 0;
  const baseCreditCost = (selectedService as { creditCost?: number })?.creditCost || 1;

  // Priority costs from the selected service type
  const lowCost = (selectedService as { priorityCostLow?: number })?.priorityCostLow ?? 0;
  const mediumCost = (selectedService as { priorityCostMedium?: number })?.priorityCostMedium ?? 1;
  const highCost = (selectedService as { priorityCostHigh?: number })?.priorityCostHigh ?? 2;

  const priorityCostsMap: Record<string, number> = { "1": lowCost, "2": mediumCost, "3": highCost };
  const priorityCost = priorityCostsMap[priority] ?? lowCost;
  const totalCreditCost = baseCreditCost + priorityCost;

  const canAffordService = subscription && subscription.remainingCredits >= totalCreditCost;

  let buttonText = t("actions.create", { cost: 1 });
  if (createRequest.isPending) {
    buttonText = t("actions.creating");
  } else if (totalCreditCost !== 1) {
    buttonText = t("actions.createCredits", { cost: totalCreditCost });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const formPriority = Number.parseInt(formData.get("priority") as string) || 1;

    if (!selectedServiceType) {
      toast.error(t("toast.validationError"), {
        description: t("validation.selectService"),
      });
      return;
    }

    if (title.length < 5) {
      toast.error(t("toast.validationError"), {
        description: t("validation.titleTooShort"),
      });
      return;
    }

    if (description.length < 20) {
      toast.error(t("toast.validationError"), {
        description: t("validation.descriptionTooShort"),
      });
      return;
    }

    // Validate required service attributes
    if (selectedService && (selectedService as any).attributes) {
      const attributes = (selectedService as any).attributes as any[];
      const requiredAttributes = attributes.filter((attr: any) => attr.required);

      for (const reqAttr of requiredAttributes) {
        const response = attributeResponses.find((r) => r.question === reqAttr.question);
        if (
          !response ||
          !response.answer ||
          (typeof response.answer === "string" && response.answer.trim() === "") ||
          (Array.isArray(response.answer) && response.answer.length === 0)
        ) {
          toast.error(t("toast.validationError"), {
            description: t("validation.requiredAttribute", { field: reqAttr.question }),
          });
          return;
        }
      }
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
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {selectedServiceType && !canAffordService && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">{t("insufficientCredits.title")}</CardTitle>
            <CardDescription className="text-orange-700">
              {t("insufficientCredits.description", {
                required: totalCreditCost,
                credit: totalCreditCost === 1 ? t("credit") : t("credits"),
                baseCost: baseCreditCost,
                priorityCost,
                available: subscription?.remainingCredits || 0,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/subscription">
              <Button>{t("insufficientCredits.viewPlans")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!subscription && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">{t("noSubscription.title")}</CardTitle>
            <CardDescription className="text-yellow-700">
              {t("noSubscription.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/subscription">
              <Button>{t("noSubscription.viewPackages")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {subscription && serviceTypes?.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">{t("noServices.title")}</CardTitle>
            <CardDescription className="text-blue-700">
              {t("noServices.description", { name: subscription.package?.name })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/subscription">
              <Button>{t("noServices.upgradePackage")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("requestDetails")}</CardTitle>
          <CardDescription>
            {selectedServiceType
              ? t("costInfo", {
                  baseCost: baseCreditCost,
                  credit: baseCreditCost === 1 ? t("credit") : t("credits"),
                  priorityCost,
                  totalCost: totalCreditCost,
                  available: subscription?.remainingCredits || 0,
                })
              : t("costInfoNoService", { available: subscription?.remainingCredits || 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serviceType">{t("fields.serviceType")}</Label>
              <Select
                value={selectedServiceType}
                onValueChange={setSelectedServiceType}
                disabled={!hasCredits}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("fields.serviceTypePlaceholder")} />
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
              <Label htmlFor="title">{t("fields.title")}</Label>
              <Input
                id="title"
                name="title"
                placeholder={t("fields.titlePlaceholder")}
                required
                minLength={5}
                maxLength={200}
                disabled={!hasCredits || createRequest.isPending}
              />
              <p className="text-xs text-muted-foreground">{t("fields.titleHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("fields.description")}</Label>
              <Textarea
                id="description"
                name="description"
                placeholder={t("fields.descriptionPlaceholder")}
                required
                minLength={20}
                maxLength={5000}
                rows={6}
                disabled={!hasCredits || createRequest.isPending}
              />
              <p className="text-xs text-muted-foreground">{t("fields.descriptionHint")}</p>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="priority">{t("fields.priority")}</Label>
              <Select
                name="priority"
                value={priority}
                onValueChange={setPriority}
                disabled={!hasCredits}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("fields.priorityLow", { cost: lowCost })}</SelectItem>
                  <SelectItem value="2">
                    {t("fields.priorityMedium", {
                      cost: mediumCost,
                      credit: mediumCost === 1 ? t("credit") : t("credits"),
                    })}
                  </SelectItem>
                  <SelectItem value="3">{t("fields.priorityHigh", { cost: highCost })}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("fields.priorityHint", { low: lowCost, medium: mediumCost, high: highCost })}
              </p>
            </div> */}

            <div className="space-y-2">
              <Label>{t("fields.attachments")}</Label>
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
                  {t("actions.cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={!canAffordService || createRequest.isPending}>
                {buttonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
