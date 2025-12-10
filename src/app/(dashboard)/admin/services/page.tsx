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
import { trpc } from "@/lib/trpc/client";
import { Plus, Edit, Trash } from "lucide-react";
import { AttributesManager } from "@/components/admin/attributes-manager";
import type { ServiceAttribute } from "@/types/service-attributes";

const EMOJI_LIST = [
  "🎨", "🔧", "💻", "📸", "✍️", "🎬", "🎵", "🎯", "🎓",
  "💼", "📊", "🏗️", "🌐", "📱", "🎪", "🎭", "🎬", "📝",
  "🖼️", "🎸", "🎹", "🎤", "🎧", "📹", "📷", "🖌️", "🖍️",
  "✨", "🌟", "⭐", "💫", "🔆", "🎁", "🏆", "🥇", "🏅",
  "💎", "👑", "🎀", "💝", "🌹", "🌺", "🌸", "🌼", "🌻",
];

export default function AdminServicesPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIconField, setSelectedIconField] = useState<"create" | "edit" | null>(null);
  const [createAttributes, setCreateAttributes] = useState<ServiceAttribute[]>([]);
  const [editAttributes, setEditAttributes] = useState<ServiceAttribute[]>([]);

  const { data: services, isLoading } = trpc.request.getServiceTypes.useQuery();
  const utils = trpc.useUtils();

  const createService = trpc.admin.createServiceType.useMutation({
    onSuccess: () => {
      utils.request.getServiceTypes.invalidate();
      setShowCreate(false);
      setSelectedIconField(null);
      setCreateAttributes([]);
    },
  });

  const updateService = trpc.admin.updateServiceType.useMutation({
    onSuccess: () => {
      utils.request.getServiceTypes.invalidate();
      setEditingId(null);
      setSelectedIconField(null);
      setEditAttributes([]);
    },
  });

  const deleteService = trpc.admin.deleteServiceType.useMutation({
    onSuccess: () => {
      utils.request.getServiceTypes.invalidate();
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const iconValue = formData.get("icon") as string;
    const creditCostValue = formData.get("creditCost") as string;
    createService.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: iconValue || undefined,
      creditCost: creditCostValue ? Number.parseInt(creditCostValue, 10) : 1,
      attributes: createAttributes.length > 0 ? createAttributes : undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const iconValue = formData.get("icon") as string;
    const creditCostValue = formData.get("creditCost") as string;
    updateService.mutate({
      id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: iconValue || undefined,
      creditCost: creditCostValue ? Number.parseInt(creditCostValue, 10) : undefined,
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
          <p className="text-muted-foreground">
            Manage available service categories
          </p>
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
                  <Label htmlFor="create-icon">Icon (emoji) <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
                      onClick={() => setSelectedIconField(selectedIconField === "create" ? null : "create")}
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
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditCost">Credit Cost</Label>
                <Input 
                  id="creditCost" 
                  name="creditCost" 
                  type="number" 
                  min="1" 
                  defaultValue="1" 
                  required 
                />
                <p className="text-xs text-muted-foreground">Number of credits required to create a request for this service</p>
              </div>

              {/* Attributes Manager */}
              <AttributesManager
                attributes={createAttributes}
                onChange={setCreateAttributes}
              />
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
          <CardDescription>
            {services?.length || 0} service types available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}
          {!isLoading && services?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No service types yet
            </div>
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
                        <Label>Icon (emoji) <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
                            onClick={() => setSelectedIconField(selectedIconField === "edit" ? null : "edit")}
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
                        <Input
                          name="description"
                          defaultValue={service.description || ""}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Cost</Label>
                      <Input
                        name="creditCost"
                        type="number"
                        min="1"
                        defaultValue={service.creditCost || 1}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Number of credits required to create a request for this service</p>
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
                      <Button
                        type="submit"
                        size="sm"
                        disabled={updateService.isPending}
                      >
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
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                        <div className="flex gap-3 mt-1">
                          {service.attributes && service.attributes.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              📋 {service.attributes.length} question{service.attributes.length === 1 ? '' : 's'}
                            </p>
                          )}
                          <p className="text-xs font-medium text-primary">
                            💳 {service.creditCost || 1} credit{(service.creditCost || 1) === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
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
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
