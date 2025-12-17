"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { Plus, Edit, Trash, RotateCcw } from "lucide-react";
import { AttributesManager } from "@/components/admin/attributes-manager";
import type { ServiceAttribute } from "@/types/service-attributes";
import { toast } from "sonner";

const EMOJI_LIST = [
  "🎨",
  "🔧",
  "💻",
  "📸",
  "✍️",
  "🎬",
  "🎵",
  "🎯",
  "🎓",
  "💼",
  "📊",
  "🏗️",
  "🌐",
  "📱",
  "🎪",
  "🎭",
  "📚",
  "📝",
  "🖼️",
  "🎸",
  "🎹",
  "🎤",
  "🎧",
  "📹",
  "📷",
  "🖌️",
  "🖍️",
  "✨",
  "🌟",
  "⭐",
  "💫",
  "🔆",
  "🎁",
  "🏆",
  "🥇",
  "🏅",
  "💎",
  "👑",
  "🎀",
  "💝",
  "🌹",
  "🌺",
  "🌸",
  "🌼",
  "🌻",
];

export default function AdminServicesPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIconField, setSelectedIconField] = useState<"create" | "edit" | null>(null);
  const [createAttributes, setCreateAttributes] = useState<ServiceAttribute[]>([]);
  const [editAttributes, setEditAttributes] = useState<ServiceAttribute[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

  const { data: services, isLoading } = trpc.admin.getServiceTypes.useQuery({
    showDeleted: activeTab === "deleted",
  });
  const utils = trpc.useUtils();

  const createService = trpc.admin.createServiceType.useMutation({
    onSuccess: () => {
      utils.admin.getServiceTypes.invalidate();
      setShowCreate(false);
      setSelectedIconField(null);
      setCreateAttributes([]);
    },
  });

  const updateService = trpc.admin.updateServiceType.useMutation({
    onSuccess: () => {
      utils.admin.getServiceTypes.invalidate();
      setEditingId(null);
      setSelectedIconField(null);
      setEditAttributes([]);
    },
  });

  const deleteService = trpc.admin.deleteServiceType.useMutation({
    onSuccess: () => {
      utils.admin.getServiceTypes.invalidate();
      toast.success("Service deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete service");
    },
  });

  const restoreService = trpc.admin.restoreServiceType.useMutation({
    onSuccess: () => {
      utils.admin.getServiceTypes.invalidate();
      toast.success("Service restored successfully");
    },
    onError: () => {
      toast.error("Failed to restore service");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const iconValue = formData.get("icon") as string;
    const creditCostValue = formData.get("creditCost") as string;
    const maxFreeRevisionsValue = formData.get("maxFreeRevisions") as string;
    const paidRevisionCostValue = formData.get("paidRevisionCost") as string;
    const resetFreeRevisionsOnPaidValue = formData.get("resetFreeRevisionsOnPaid") === "on";
    const priorityCostLowValue = formData.get("priorityCostLow") as string;
    const priorityCostMediumValue = formData.get("priorityCostMedium") as string;
    const priorityCostHighValue = formData.get("priorityCostHigh") as string;
    createService.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: iconValue || undefined,
      creditCost: creditCostValue ? Number.parseInt(creditCostValue, 10) : 1,
      maxFreeRevisions: maxFreeRevisionsValue ? Number.parseInt(maxFreeRevisionsValue, 10) : 3,
      paidRevisionCost: paidRevisionCostValue ? Number.parseInt(paidRevisionCostValue, 10) : 1,
      resetFreeRevisionsOnPaid: resetFreeRevisionsOnPaidValue,
      priorityCostLow: priorityCostLowValue ? Number.parseInt(priorityCostLowValue, 10) : 0,
      priorityCostMedium: priorityCostMediumValue
        ? Number.parseInt(priorityCostMediumValue, 10)
        : 1,
      priorityCostHigh: priorityCostHighValue ? Number.parseInt(priorityCostHighValue, 10) : 2,
      attributes: createAttributes.length > 0 ? createAttributes : undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const iconValue = formData.get("icon") as string;
    const creditCostValue = formData.get("creditCost") as string;
    const maxFreeRevisionsValue = formData.get("maxFreeRevisions") as string;
    const paidRevisionCostValue = formData.get("paidRevisionCost") as string;
    const resetFreeRevisionsOnPaidValue = formData.get("resetFreeRevisionsOnPaid") === "on";
    const priorityCostLowValue = formData.get("priorityCostLow") as string;
    const priorityCostMediumValue = formData.get("priorityCostMedium") as string;
    const priorityCostHighValue = formData.get("priorityCostHigh") as string;
    updateService.mutate({
      id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: iconValue || undefined,
      creditCost: creditCostValue ? Number.parseInt(creditCostValue, 10) : undefined,
      maxFreeRevisions: maxFreeRevisionsValue
        ? Number.parseInt(maxFreeRevisionsValue, 10)
        : undefined,
      paidRevisionCost: paidRevisionCostValue
        ? Number.parseInt(paidRevisionCostValue, 10)
        : undefined,
      resetFreeRevisionsOnPaid: resetFreeRevisionsOnPaidValue,
      priorityCostLow: priorityCostLowValue ? Number.parseInt(priorityCostLowValue, 10) : undefined,
      priorityCostMedium: priorityCostMediumValue
        ? Number.parseInt(priorityCostMediumValue, 10)
        : undefined,
      priorityCostHigh: priorityCostHighValue
        ? Number.parseInt(priorityCostHighValue, 10)
        : undefined,
      attributes: editAttributes.length > 0 ? editAttributes : undefined,
    });
  };

  const handleSelectEmoji = (emoji: string) => {
    const iconInput = document.querySelector(
      selectedIconField === "create" ? "#create-icon" : "#edit-icon"
    ) as HTMLInputElement;
    if (iconInput) {
      iconInput.value = emoji;
      iconInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setSelectedIconField(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Types</h1>
          <p className="text-muted-foreground">Manage available service categories</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service Type
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <form onSubmit={handleCreate}>
            <CardHeader>
              <CardTitle>Create Service Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="create-icon">
                    Icon (emoji) <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="create-icon"
                      name="icon"
                      placeholder="🎨"
                      maxLength={4}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setSelectedIconField(selectedIconField === "create" ? null : "create")
                      }
                    >
                      {selectedIconField === "create" ? "Hide" : "Pick"}
                    </Button>
                  </div>
                  {selectedIconField === "create" && (
                    <div className="mt-2 p-3 border rounded-lg bg-muted">
                      <div className="grid grid-cols-6 gap-2">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="text-2xl hover:bg-background p-2 rounded transition-colors"
                            onClick={() => handleSelectEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required minLength={2} maxLength={100} />
                  <p className="text-xs text-muted-foreground">2-100 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    name="description"
                    required
                    minLength={10}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">10-500 characters</p>
                </div>
              </div>

              {/* Credit Cost */}
              <div className="space-y-2">
                <Label htmlFor="creditCost">Base Credit Cost *</Label>
                <Input
                  id="creditCost"
                  name="creditCost"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Number of credits required to create a request for this service
                </p>
              </div>

              {/* Priority Costs */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="priorityCostLow">Low Priority Cost</Label>
                  <Input
                    id="priorityCostLow"
                    name="priorityCostLow"
                    type="number"
                    min="0"
                    defaultValue="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional credits for low priority (+0)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priorityCostMedium">Medium Priority Cost</Label>
                  <Input
                    id="priorityCostMedium"
                    name="priorityCostMedium"
                    type="number"
                    min="0"
                    defaultValue="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional credits for medium priority (+1)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priorityCostHigh">High Priority Cost</Label>
                  <Input
                    id="priorityCostHigh"
                    name="priorityCostHigh"
                    type="number"
                    min="0"
                    defaultValue="2"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional credits for high priority (+2)
                  </p>
                </div>
              </div>

              {/* Revision Settings */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="maxFreeRevisions">Max Free Revisions</Label>
                  <Input
                    id="maxFreeRevisions"
                    name="maxFreeRevisions"
                    type="number"
                    min="0"
                    defaultValue="3"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Number of free revisions allowed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidRevisionCost">Paid Revision Cost (credits)</Label>
                  <Input
                    id="paidRevisionCost"
                    name="paidRevisionCost"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Credits charged for paid revisions
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      id="resetFreeRevisionsOnPaid"
                      name="resetFreeRevisionsOnPaid"
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="resetFreeRevisionsOnPaid">Reset free revisions on paid</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reset free revision count after a paid revision
                  </p>
                </div>
              </div>

              {/* Attributes Manager */}
              <AttributesManager attributes={createAttributes} onChange={setCreateAttributes} />
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setSelectedIconField(null);
                  setCreateAttributes([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? "Creating..." : "Create"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>All Service Types</CardTitle>
          <CardDescription>{services?.length || 0} service types</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "active" | "deleted")}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active Services</TabsTrigger>
              <TabsTrigger value="deleted">Deleted Services</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              )}
              {!isLoading && services?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No service types yet</div>
              )}
              {!isLoading && (services?.length ?? 0) > 0 && (
                <div className="space-y-4">
                  {services?.map((service: any) =>
                    editingId === service.id ? (
                      <form
                        key={service.id}
                        onSubmit={(e) => handleUpdate(e, service.id)}
                        className="p-4 rounded-lg border space-y-4"
                      >
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>
                              Icon (emoji){" "}
                              <span className="text-muted-foreground text-xs">(optional)</span>
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="edit-icon"
                                name="icon"
                                defaultValue={service.icon || ""}
                                maxLength={4}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedIconField(selectedIconField === "edit" ? null : "edit")
                                }
                              >
                                {selectedIconField === "edit" ? "Hide" : "Pick"}
                              </Button>
                            </div>
                            {selectedIconField === "edit" && (
                              <div className="mt-2 p-3 border rounded-lg bg-muted">
                                <div className="grid grid-cols-6 gap-2">
                                  {EMOJI_LIST.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      className="text-2xl hover:bg-background p-2 rounded transition-colors"
                                      onClick={() => handleSelectEmoji(emoji)}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input name="name" defaultValue={service.name} />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input name="description" defaultValue={service.description || ""} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Base Credit Cost</Label>
                          <Input
                            name="creditCost"
                            type="number"
                            min="1"
                            defaultValue={service.creditCost || 1}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Number of credits required to create a request for this service
                          </p>
                        </div>

                        {/* Priority Costs for Edit */}
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`priorityCostLow-${service.id}`}>
                              Low Priority Cost
                            </Label>
                            <Input
                              id={`priorityCostLow-${service.id}`}
                              name="priorityCostLow"
                              type="number"
                              min="0"
                              defaultValue={service.priorityCostLow ?? 0}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Additional credits for low priority
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`priorityCostMedium-${service.id}`}>
                              Medium Priority Cost
                            </Label>
                            <Input
                              id={`priorityCostMedium-${service.id}`}
                              name="priorityCostMedium"
                              type="number"
                              min="0"
                              defaultValue={service.priorityCostMedium ?? 1}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Additional credits for medium priority
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`priorityCostHigh-${service.id}`}>
                              High Priority Cost
                            </Label>
                            <Input
                              id={`priorityCostHigh-${service.id}`}
                              name="priorityCostHigh"
                              type="number"
                              min="0"
                              defaultValue={service.priorityCostHigh ?? 2}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Additional credits for high priority
                            </p>
                          </div>
                        </div>

                        {/* Revision Settings for Edit */}
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`maxFreeRevisions-${service.id}`}>
                              Max Free Revisions
                            </Label>
                            <Input
                              id={`maxFreeRevisions-${service.id}`}
                              name="maxFreeRevisions"
                              type="number"
                              min="0"
                              defaultValue={service.maxFreeRevisions ?? 3}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Number of free revisions allowed
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`paidRevisionCost-${service.id}`}>
                              Paid Revision Cost (credits)
                            </Label>
                            <Input
                              id={`paidRevisionCost-${service.id}`}
                              name="paidRevisionCost"
                              type="number"
                              min="1"
                              defaultValue={service.paidRevisionCost ?? 1}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Credits charged for paid revisions
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                id={`resetFreeRevisionsOnPaid-${service.id}`}
                                name="resetFreeRevisionsOnPaid"
                                type="checkbox"
                                defaultChecked={service.resetFreeRevisionsOnPaid ?? true}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`resetFreeRevisionsOnPaid-${service.id}`}>
                                Reset free revisions on paid
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Reset free revision count after a paid revision
                            </p>
                          </div>
                        </div>

                        {/* Attributes Manager for Edit */}
                        <AttributesManager
                          attributes={editAttributes}
                          onChange={setEditAttributes}
                        />

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setSelectedIconField(null);
                              setEditAttributes([]);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" disabled={updateService.isPending}>
                            Save
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          {service.icon && <span className="text-2xl">{service.icon}</span>}
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                            <div className="flex gap-3 mt-1">
                              {service.attributes && service.attributes.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  📋 {service.attributes.length} question
                                  {service.attributes.length === 1 ? "" : "s"}
                                </p>
                              )}
                              <p className="text-xs font-medium text-primary">
                                💳 {service.creditCost || 1} credit
                                {(service.creditCost || 1) === 1 ? "" : "s"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                🔄 {service.maxFreeRevisions ?? 3} free, then{" "}
                                {service.paidRevisionCost ?? 1} credit
                                {(service.paidRevisionCost || 1) === 1 ? "" : "s"}
                                /revision
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {service.resetFreeRevisionsOnPaid ? (
                                  <span className="text-xs text-green-600">♻️ Resets on paid</span>
                                ) : (
                                  <span className="text-xs text-red-600">❌ No reset on paid</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {activeTab === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingId(service.id);
                                setEditAttributes(service.attributes || []);
                              }}
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          )}
                          {activeTab === "active" ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm("Delete this service type?")) {
                                  deleteService.mutate({ id: service.id });
                                }
                              }}
                            >
                              <Trash className="mr-1 h-3 w-3" />
                              Delete
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                if (confirm("Restore this service type?")) {
                                  restoreService.mutate({ id: service.id });
                                }
                              }}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
