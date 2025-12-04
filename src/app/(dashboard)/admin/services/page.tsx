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

export default function AdminServicesPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: services, isLoading } = trpc.request.getServiceTypes.useQuery();
  const utils = trpc.useUtils();

  const createService = trpc.admin.createServiceType.useMutation({
    onSuccess: () => {
      utils.request.getServiceTypes.invalidate();
      setShowCreate(false);
    },
  });

  const updateService = trpc.admin.updateServiceType.useMutation({
    onSuccess: () => {
      utils.request.getServiceTypes.invalidate();
      setEditingId(null);
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
    createService.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateService.mutate({
      id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
    });
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
                  <Label htmlFor="icon">Icon (emoji)</Label>
                  <Input id="icon" name="icon" placeholder="🎨" required />
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
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
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
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : services?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No service types yet
            </div>
          ) : (
            <div className="space-y-4">
              {services?.map((service) =>
                editingId === service.id ? (
                  <form
                    key={service.id}
                    onSubmit={(e) => handleUpdate(e, service.id)}
                    className="p-4 rounded-lg border space-y-4"
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input name="icon" defaultValue={service.icon || ""} />
                      <Input name="name" defaultValue={service.name} />
                      <Input
                        name="description"
                        defaultValue={service.description || ""}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
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
                      <span className="text-2xl">{service.icon}</span>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(service.id)}
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
