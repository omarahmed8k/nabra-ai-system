"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, Users, Briefcase, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Request {
  id: string;
  title: string;
  status: string;
  serviceType: {
    id: string;
    name: string;
  };
  provider: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface Provider {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  skills: string[];
  supportedServices: { id: string; name: string }[];
  activeRequests: number;
}

interface AssignProviderDialogProps {
  readonly request: Request;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onAssigned: () => void;
}

// Helper component to render provider selector
function ProviderSelector({
  providers,
  loadingProviders,
  selectedProviderId,
  onSelectProvider,
  currentProviderId,
  serviceName,
  allProvidersCount,
  t,
}: {
  readonly providers: Provider[] | undefined;
  readonly loadingProviders: boolean;
  readonly selectedProviderId: string;
  readonly onSelectProvider: (id: string) => void;
  readonly currentProviderId: string | undefined;
  readonly serviceName?: string;
  readonly allProvidersCount?: number;
  readonly t: any;
}) {
  if (loadingProviders) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="font-medium">{t("assignDialog.noProviders")}</p>
        {serviceName && (
          <p className="text-xs mt-1">
            {t("assignDialog.noProviders")} &quot;{serviceName}&quot;
          </p>
        )}
        {allProvidersCount !== undefined && allProvidersCount > 0 && (
          <p className="text-xs mt-1">
            ({allProvidersCount} total providers exist, but none support this service)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {serviceName && (
        <p className="text-xs text-muted-foreground">
          {t("assignDialog.search")} &quot;{serviceName}&quot;
        </p>
      )}
      <Select value={selectedProviderId} onValueChange={onSelectProvider}>
        <SelectTrigger>
          <SelectValue placeholder={t("assignDialog.search")} />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider: Provider) => (
            <SelectItem
              key={provider.id}
              value={provider.id}
              disabled={provider.id === currentProviderId}
            >
              <div className="flex items-center gap-2">
                <span>{provider.name}</span>
                <Badge variant="outline" className="text-xs">
                  {provider.activeRequests} {t("assignDialog.active")}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Helper component to render selected provider info
function SelectedProviderInfo({
  providers,
  selectedProviderId,
  t,
}: {
  readonly providers: Provider[] | undefined;
  readonly selectedProviderId: string;
  readonly t: any;
}) {
  const selected = providers?.find((p: Provider) => p.id === selectedProviderId);
  if (!selected) return null;

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium mb-2">{t("assignDialog.description")}:</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium">{selected.name}</p>
            <p className="text-xs text-muted-foreground">{selected.email}</p>
          </div>
        </div>
        {selected.bio && <p className="text-sm text-muted-foreground">{selected.bio}</p>}
        {selected.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selected.skills.slice(0, 5).map((skill: string) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {selected.skills.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{selected.skills.length - 5} {t("assignDialog.moreSkills")}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AssignProviderDialog({
  request,
  open,
  onOpenChange,
  onAssigned,
}: AssignProviderDialogProps) {
  const t = useTranslations("admin.requests");
  const [selectedProviderId, setSelectedProviderId] = useState<string>(request.provider?.id || "");

  // Fetch providers filtered by the request's service type
  const { data: providers, isLoading: loadingProviders } = trpc.admin.getProviders.useQuery(
    { serviceTypeId: request.serviceType.id },
    { enabled: open }
  );

  // Also get all providers to show a message if no matching ones
  const { data: allProviders } = trpc.admin.getProviders.useQuery(undefined, {
    enabled: open && (!providers || providers.length === 0),
  });

  const assignMutation = trpc.admin.assignRequest.useMutation({
    onSuccess: (data: { message: string }) => {
      toast.success(t("assignDialog.toast.assigned"));
      onOpenChange(false);
      onAssigned();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("assignDialog.toast.error"));
    },
  });

  const unassignMutation = trpc.admin.unassignRequest.useMutation({
    onSuccess: (data: { message: string }) => {
      toast.success(t("assignDialog.toast.assigned"));
      onOpenChange(false);
      onAssigned();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("assignDialog.toast.error"));
    },
  });

  const handleAssign = () => {
    if (!selectedProviderId) {
      toast.error(t("assignDialog.search"));
      return;
    }

    assignMutation.mutate({
      requestId: request.id,
      providerId: selectedProviderId,
    });
  };

  const handleUnassign = () => {
    unassignMutation.mutate({ requestId: request.id });
  };

  const isLoading = assignMutation.isPending || unassignMutation.isPending;
  const currentProvider = (providers as Provider[] | undefined)?.find(
    (p: Provider) => p.id === request.provider?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("assignDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("assignDialog.description")}: <strong>{request.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Assignment */}
          {request.provider && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm font-medium mb-2">{t("assignDialog.title")}:</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {currentProvider?.name || request.provider.name || request.provider.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentProvider?.activeRequests ?? 0} {t("assignDialog.active")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleUnassign}
                  disabled={isLoading}
                >
                  {unassignMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("actions.delete")
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {request.provider ? t("assignDialog.title") : t("assignDialog.description")}
            </label>
            <ProviderSelector
              providers={providers as Provider[] | undefined}
              loadingProviders={loadingProviders}
              selectedProviderId={selectedProviderId}
              onSelectProvider={setSelectedProviderId}
              currentProviderId={request.provider?.id}
              serviceName={request.serviceType.name}
              allProvidersCount={allProviders?.length}
              t={t}
            />
          </div>

          {/* Selected Provider Info */}
          {selectedProviderId && selectedProviderId !== request.provider?.id && (
            <SelectedProviderInfo
              providers={providers as Provider[] | undefined}
              selectedProviderId={selectedProviderId}
              t={t}
            />
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              {t("assignDialog.buttons.cancel")}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={
                isLoading || !selectedProviderId || selectedProviderId === request.provider?.id
              }
              className="flex items-center gap-2"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("assignDialog.buttons.assigning")}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {t("assignDialog.buttons.assign")}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
