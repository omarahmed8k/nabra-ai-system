"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Users,
  FileText,
  CreditCard,
  CheckCircle,
  Star,
  Settings,
  Eye,
  EyeOff,
  Trash,
} from "lucide-react";

type UserRole = "CLIENT" | "PROVIDER" | "SUPER_ADMIN";

type ServiceType = { id: string; name: string };

type UserData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: Date;
  averageRating?: number | null;
  providerProfile: {
    id: string;
    supportedServices: ServiceType[];
  } | null;
  _count: {
    clientRequests: number;
    providerRequests: number;
    clientSubscriptions: number;
    receivedRatings: number;
  };
};

// Helper components to reduce nesting
function ServiceCheckboxItem({
  service,
  checked,
  onChange,
  idPrefix,
}: {
  service: ServiceType;
  checked: boolean;
  onChange: (checked: boolean) => void;
  idPrefix: string;
}): JSX.Element {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`${idPrefix}-${service.id}`}
        checked={checked}
        onCheckedChange={(c) => onChange(c === true)}
      />
      <label
        htmlFor={`${idPrefix}-${service.id}`}
        className="text-sm cursor-pointer flex-1"
      >
        {service.name}
      </label>
    </div>
  );
}

function ProviderServiceBadges({ services }: { services: ServiceType[] }): JSX.Element {
  if (services.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        No services assigned
      </span>
    );
  }
  return (
    <>
      {services.map((service) => (
        <Badge key={service.id} variant="outline" className="text-xs">
          {service.name}
        </Badge>
      ))}
    </>
  );
}

function UserStatsClient({ count }: { count: UserData["_count"] }): JSX.Element {
  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium">{count.clientRequests}</p>
          <p className="text-xs text-muted-foreground">Requests</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium">{count.clientSubscriptions}</p>
          <p className="text-xs text-muted-foreground">Subscriptions</p>
        </div>
      </div>
    </>
  );
}

function UserStatsProvider({
  count,
  averageRating,
  onEditServices,
}: {
  count: UserData["_count"];
  averageRating?: number | null;
  onEditServices: () => void;
}): JSX.Element {
  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium">{count.providerRequests}</p>
          <p className="text-xs text-muted-foreground">Jobs</p>
        </div>
      </div>
      {averageRating !== null && averageRating !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <div>
            <p className="font-medium">{averageRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">
              {count.receivedRatings} {count.receivedRatings === 1 ? 'rating' : 'ratings'}
            </p>
          </div>
        </div>
      )}
      <Button variant="outline" size="sm" onClick={onEditServices}>
        <Settings className="h-4 w-4 mr-1" />
        Services
      </Button>
    </>
  );
}

function UserListItem({
  user,
  getRoleColor,
  onEditServices,
  onDelete,
  onRestore,
  isDeleted,
}: {
  user: UserData;
  getRoleColor: (role: string) => string;
  onEditServices: () => void;
  onDelete: (userId: string) => void;
  onRestore?: (userId: string) => void;
  isDeleted?: boolean;
}): JSX.Element {
  const providerServices = user.providerProfile?.supportedServices || [];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.image || ""} />
          <AvatarFallback className="text-lg">
            {getInitials(user.name || user.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-lg">{user.name || "No name"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(user.createdAt)}
            </span>
          </div>
          {user.role === "PROVIDER" && (
            <div className="flex flex-wrap gap-1 mt-2">
              <ProviderServiceBadges services={providerServices} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {user.role === "CLIENT" && <UserStatsClient count={user._count} />}
        {user.role === "PROVIDER" && (
          <UserStatsProvider 
            count={user._count} 
            averageRating={user.averageRating}
            onEditServices={onEditServices} 
          />
        )}
        {isDeleted ? (
          user.role !== "SUPER_ADMIN" && onRestore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(`Restore user ${user.email}?`)) {
                  onRestore(user.id);
                }
              }}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Restore
            </Button>
          )
        ) : (
          user.role !== "SUPER_ADMIN" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(`Delete user ${user.email}? This action cannot be undone.`)) {
                  onDelete(user.id);
                }
              }}
            >
              <Trash className="mr-1 h-4 w-4" />
              Delete
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProviderServices, setSelectedProviderServices] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // Form state for creating user
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT" as UserRole,
    supportedServiceIds: [] as string[],
  });

  const { data: users, isLoading } = trpc.admin.getUsers.useQuery({
    search: search || undefined,
    role: roleFilter === "all" ? undefined : (roleFilter as UserRole),
    showDeleted: activeTab === "deleted",
  });

  const { data: serviceTypes } = trpc.admin.getServiceTypes.useQuery();

  const utils = trpc.useUtils();

  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      setIsCreateOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "CLIENT",
        supportedServiceIds: [],
      });
      toast.success("User created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateProviderServices = trpc.admin.updateProviderServices.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      setIsServicesOpen(false);
      setSelectedUserId(null);
      toast.success("Provider services updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: (data) => {
      utils.admin.getUsers.invalidate();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const restoreUser = trpc.admin.restoreUser.useMutation({
    onSuccess: (data) => {
      utils.admin.getUsers.invalidate();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    createUser.mutate(newUser);
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setNewUser((prev) => ({
      ...prev,
      supportedServiceIds: checked
        ? [...prev.supportedServiceIds, serviceId]
        : prev.supportedServiceIds.filter((id) => id !== serviceId),
    }));
  };

  const handleEditServiceToggle = (serviceId: string, checked: boolean) => {
    setSelectedProviderServices((prev) =>
      checked ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
    );
  };

  const handleSaveProviderServices = () => {
    if (selectedUserId) {
      updateProviderServices.mutate({
        userId: selectedUserId,
        serviceIds: selectedProviderServices,
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800";
      case "PROVIDER":
        return "bg-blue-100 text-blue-800";
      case "CLIENT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate stats
  const allUsers = (users?.users || []) as unknown as UserData[];
  const stats = {
    total: users?.total || 0,
    clients: allUsers.filter((u) => u.role === "CLIENT").length,
    providers: allUsers.filter((u) => u.role === "PROVIDER").length,
    admins: allUsers.filter((u) => u.role === "SUPER_ADMIN").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage platform users</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the platform. For providers, you can assign supported services.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: UserRole) =>
                    setNewUser((prev) => ({ ...prev, role: value, supportedServiceIds: [] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="PROVIDER">Provider</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newUser.role === "PROVIDER" && serviceTypes && (
                <div className="space-y-2">
                  <Label>Supported Services</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select the services this provider can handle
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                    {serviceTypes.map((service: ServiceType) => (
                      <ServiceCheckboxItem
                        key={service.id}
                        service={service}
                        checked={newUser.supportedServiceIds.includes(service.id)}
                        onChange={(checked) => handleServiceToggle(service.id, checked)}
                        idPrefix="service"
                      />
                    ))}
                    {serviceTypes.length === 0 && (
                      <p className="text-sm text-muted-foreground">No services available</p>
                    )}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreateUser}
                disabled={createUser.isPending}
              >
                {createUser.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <Star className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.providers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <CheckCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CLIENT">Clients</SelectItem>
                <SelectItem value="PROVIDER">Providers</SelectItem>
                <SelectItem value="SUPER_ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>
            {users?.total || 0} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "deleted")}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active Users</TabsTrigger>
              <TabsTrigger value="deleted">Deleted Users</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              )}
              {!isLoading && users?.users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active users found
                </div>
              )}
              {!isLoading && (users?.users.length ?? 0) > 0 && (
                <div className="space-y-4">
                  {(users?.users as unknown as UserData[]).map((user) => (
                    <UserListItem
                      key={user.id}
                      user={user}
                      getRoleColor={getRoleColor}
                      onEditServices={() => {
                        setSelectedUserId(user.id);
                        const serviceIds = user.providerProfile?.supportedServices?.map((s) => s.id) || [];
                        setSelectedProviderServices(serviceIds);
                        setIsServicesOpen(true);
                      }}
                      onDelete={(userId) => {
                        deleteUser.mutate({ userId });
                      }}
                      isDeleted={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deleted" className="space-y-4">
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              )}
              {!isLoading && users?.users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No deleted users found
                </div>
              )}
              {!isLoading && (users?.users.length ?? 0) > 0 && (
                <div className="space-y-4">
                  {(users?.users as unknown as UserData[]).map((user) => (
                    <UserListItem
                      key={user.id}
                      user={user}
                      getRoleColor={getRoleColor}
                      onEditServices={() => {
                        setSelectedUserId(user.id);
                        const serviceIds = user.providerProfile?.supportedServices?.map((s) => s.id) || [];
                        setSelectedProviderServices(serviceIds);
                        setIsServicesOpen(true);
                      }}
                      onDelete={(userId) => {
                        deleteUser.mutate({ userId });
                      }}
                      onRestore={(userId) => {
                        restoreUser.mutate({ userId });
                      }}
                      isDeleted={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Provider Services Dialog */}
      <Dialog open={isServicesOpen} onOpenChange={setIsServicesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Supported Services</DialogTitle>
            <DialogDescription>
              Select the services this provider can handle. Only requests matching these services will be assignable to this provider.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-3">
              {serviceTypes?.map((service: ServiceType) => (
                <ServiceCheckboxItem
                  key={service.id}
                  service={service}
                  checked={selectedProviderServices.includes(service.id)}
                  onChange={(checked) => handleEditServiceToggle(service.id, checked)}
                  idPrefix="edit-service"
                />
              ))}
              {(!serviceTypes || serviceTypes.length === 0) && (
                <p className="text-sm text-muted-foreground">No services available</p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsServicesOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveProviderServices}
                disabled={updateProviderServices.isPending}
              >
                {updateProviderServices.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
