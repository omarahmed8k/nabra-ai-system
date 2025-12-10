"use client";

import { useState, useCallback } from "react";
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
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Trash, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { showError } from "@/lib/error-handler";

export default function AdminPackagesPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const { data: packages, isLoading } = trpc.package.getAll.useQuery();
  const { data: allServices } = trpc.admin.getServiceTypes.useQuery();
  const utils = trpc.useUtils();

  const createPackage = trpc.admin.createPackage.useMutation({
    onSuccess: () => {
      utils.package.getAll.invalidate();
      setShowCreate(false);
      setSelectedServiceIds([]);
      toast.success("Package created successfully");
    },
    onError: (error) => {
      showError(error, "Failed to create package");
    },
  });

  const updatePackage = trpc.admin.updatePackage.useMutation({
    onSuccess: () => {
      utils.package.getAll.invalidate();
      setEditingId(null);
      setSelectedServiceIds([]);
      toast.success("Package updated successfully");
    },
    onError: (error) => {
      showError(error, "Failed to update package");
    },
  });

  const deletePackage = trpc.admin.deletePackage.useMutation({
    onSuccess: () => {
      utils.package.getAll.invalidate();
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPackage.mutate({
      name: formData.get("name") as string,
      price: Number.parseFloat(formData.get("price") as string),
      credits: Number.parseInt(formData.get("credits") as string),
      maxFreeRevisions: Number.parseInt(formData.get("maxFreeRevisions") as string),
      durationDays: Number.parseInt(formData.get("durationDays") as string),
      features: (formData.get("features") as string).split("\n").filter(Boolean),
      serviceIds: selectedServiceIds,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updatePackage.mutate({
      id,
      name: formData.get("name") as string,
      price: Number.parseFloat(formData.get("price") as string),
      credits: Number.parseInt(formData.get("credits") as string),
      maxFreeRevisions: Number.parseInt(formData.get("maxFreeRevisions") as string),
      features: (formData.get("features") as string).split("\n").filter(Boolean),
      serviceIds: selectedServiceIds,
    });
  };

  const toggleService = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) => 
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }, []);

  const handleCancelCreate = useCallback(() => {
    setShowCreate(false);
    setSelectedServiceIds([]);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setSelectedServiceIds([]);
  }, []);

  const handleEditPackage = useCallback((pkg: any) => {
    setEditingId(pkg.id);
    setSelectedServiceIds(pkg.services?.map((s: any) => s.serviceType.id) || []);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Packages</h1>
          <p className="text-muted-foreground">
            Manage subscription packages
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <form onSubmit={handleCreate}>
            <CardHeader>
              <CardTitle>Create New Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input id="credits" name="credits" type="number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFreeRevisions">Free Revisions</Label>
                  <Input
                    id="maxFreeRevisions"
                    name="maxFreeRevisions"
                    type="number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationDays">Duration (days)</Label>
                  <Input
                    id="durationDays"
                    name="durationDays"
                    type="number"
                    defaultValue="30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Features (one per line)</Label>
                  <textarea
                    id="features"
                    name="features"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    placeholder="Feature 1\nFeature 2\nFeature 3"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Included Services</Label>
                <div className="grid gap-3 md:grid-cols-2 border rounded-lg p-4">
                  {allServices?.map((service: { id: string; name: string; icon: string | null }) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServiceIds.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="cursor-pointer font-normal">
                        {service.icon} {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancelCreate}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPackage.isPending}>
                {createPackage.isPending ? "Creating..." : "Create Package"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Packages List */}
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
        {!isLoading && (!packages || packages.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No packages yet</p>
            <p className="text-sm">Create your first package to get started</p>
          </div>
        )}
        {!isLoading && packages && packages.length > 0 && packages.map((pkg: { 
          id: string; 
          name: string; 
          price: number; 
          credits: number; 
          maxFreeRevisions: number; 
          durationDays: number; 
          features: string[];
          services?: Array<{ serviceType: { id: string; name: string; icon: string | null } }>;
        }) =>
              editingId === pkg.id ? (
                <Card key={pkg.id}>
                  <form onSubmit={(e) => handleUpdate(e, pkg.id)}>
                    <CardHeader>
                      <Input name="name" defaultValue={pkg.name} />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          name="price"
                          type="number"
                          step="0.01"
                          defaultValue={pkg.price}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Credits</Label>
                        <Input
                          name="credits"
                          type="number"
                          defaultValue={pkg.credits}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Free Revisions</Label>
                        <Input
                          name="maxFreeRevisions"
                          type="number"
                          defaultValue={pkg.maxFreeRevisions}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Features</Label>
                        <textarea
                          name="features"
                          className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                          defaultValue={pkg.features.join("\n")}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Included Services</Label>
                        <div className="grid gap-3 md:grid-cols-2 border rounded-lg p-4">
                          {allServices?.map((service: { id: string; name: string; icon: string | null }) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-service-${service.id}`}
                                checked={selectedServiceIds.includes(service.id)}
                                onCheckedChange={() => toggleService(service.id)}
                              />
                              <Label htmlFor={`edit-service-${service.id}`} className="cursor-pointer font-normal">
                                {service.icon} {service.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={updatePackage.isPending}
                      >
                        Save
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              ) : (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{pkg.name}</CardTitle>
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription>
                      <span className="text-2xl font-bold text-foreground">
                        {formatCurrency(pkg.price)}
                      </span>{" "}
                      /month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>{pkg.credits} credits</li>
                      <li>{pkg.maxFreeRevisions} free revisions/request</li>
                      <li>{pkg.durationDays} day duration</li>
                      {pkg.features.map((feature: string, i: number) => (
                        <li key={feature} className="text-muted-foreground">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {pkg.services && pkg.services.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Included Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {pkg.services.map((ps) => (
                            <Badge key={ps.serviceType.id} variant="secondary" className="text-xs">
                              {ps.serviceType.icon} {ps.serviceType.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(!pkg.services || pkg.services.length === 0) && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground italic">No services configured</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPackage(pkg)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this package?")) {
                          deletePackage.mutate({ id: pkg.id });
                        }
                      }}
                    >
                      <Trash className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              )
            )}
      </div>
    </div>
  );
}
