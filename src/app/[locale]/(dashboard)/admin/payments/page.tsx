"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/error-handler";
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  Users,
  AlertTriangle,
} from "lucide-react";

type PaymentProof = {
  id: string;
  transferImage: string;
  senderName: string;
  senderBank: string;
  senderCountry: string;
  amount: number;
  currency: string;
  transferDate: Date;
  referenceNumber: string | null;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  subscription: {
    id: string;
    package: {
      id: string;
      name: string;
      price: number;
      credits: number;
    };
  };
  reviewer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

function getStatusBadgeVariant(status: string) {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

function StatusIcon({ status }: { readonly status: string }) {
  if (status === "PENDING") return <Clock className="h-3 w-3 mr-1" />;
  if (status === "APPROVED") return <CheckCircle2 className="h-3 w-3 mr-1" />;
  return <XCircle className="h-3 w-3 mr-1" />;
}

export default function AdminPaymentsPage() {
  const utils = trpc.useUtils();
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: stats, isLoading: statsLoading } = trpc.payment.getStats.useQuery();
  const { data: pendingPayments, isLoading: pendingLoading } =
    trpc.payment.getPendingPayments.useQuery();
  const { data: allPaymentsData, isLoading: allLoading } = trpc.payment.getAllPayments.useQuery({});

  const approveMutation = trpc.payment.approvePayment.useMutation({
    onSuccess: () => {
      showSuccess("Payment approved and subscription activated!");
      utils.payment.getPendingPayments.invalidate();
      utils.payment.getAllPayments.invalidate();
      utils.payment.getStats.invalidate();
      setSelectedPayment(null);
    },
    onError: (error) => {
      showError(error);
    },
  });

  const rejectMutation = trpc.payment.rejectPayment.useMutation({
    onSuccess: () => {
      showSuccess("Payment rejected and user notified.");
      utils.payment.getPendingPayments.invalidate();
      utils.payment.getAllPayments.invalidate();
      utils.payment.getStats.invalidate();
      setSelectedPayment(null);
      setShowRejectDialog(false);
      setRejectReason("");
    },
    onError: (error) => {
      showError(error);
    },
  });

  const handleApprove = (paymentId: string) => {
    if (confirm("Are you sure you want to approve this payment?")) {
      approveMutation.mutate({ paymentId });
    }
  };

  const handleReject = () => {
    if (!selectedPayment) return;
    if (rejectReason.length < 10) {
      showError("Please provide a detailed reason (at least 10 characters)");
      return;
    }
    rejectMutation.mutate({
      paymentId: selectedPayment.id,
      reason: rejectReason,
    });
  };

  const renderPaymentRow = (payment: PaymentProof) => {
    const badgeVariant = getStatusBadgeVariant(payment.status);
    return (
      <TableRow key={payment.id}>
        <TableCell>
          <div>
            <p className="font-medium">{payment.user.name ?? "Pending name"}</p>
            <p className="text-sm text-muted-foreground">{payment.user.email}</p>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{payment.subscription.package.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(payment.subscription.package.price)}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{formatCurrency(payment.amount)}</p>
            <p className="text-sm text-muted-foreground">{payment.senderBank}</p>
          </div>
        </TableCell>
        <TableCell>{formatDate(payment.transferDate)}</TableCell>
        <TableCell>
          <Badge variant={badgeVariant}>
            <StatusIcon status={payment.status} />
            {payment.status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedPayment(payment)}>
              <Eye className="h-4 w-4" />
            </Button>
            {payment.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(payment.id)}
                  disabled={approveMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowRejectDialog(true);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment Verification</h1>
        <p className="text-muted-foreground">Review and verify client payment proofs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statsLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-orange-600">{stats?.pending || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-3xl font-bold text-green-600">{stats?.approved || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-3xl font-bold text-red-600">{stats?.rejected || 0}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">{stats?.total || 0}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pending ({stats?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>Review and approve or reject pending payment proofs</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading && <Skeleton className="h-48" />}
              {!pendingLoading && !pendingPayments?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending payments to review!</p>
                </div>
              )}
              {!pendingLoading && pendingPayments && pendingPayments.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment: PaymentProof) => renderPaymentRow(payment))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Payments</CardTitle>
              <CardDescription>Complete history of payment verifications</CardDescription>
            </CardHeader>
            <CardContent>
              {allLoading && <Skeleton className="h-48" />}
              {!allLoading && !allPaymentsData?.payments?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payment records found.</p>
                </div>
              )}
              {!allLoading && allPaymentsData?.payments && allPaymentsData.payments.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPaymentsData.payments.map((payment: PaymentProof) =>
                      renderPaymentRow(payment)
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Payment Details Dialog */}
      <Dialog
        open={!!selectedPayment && !showRejectDialog}
        onOpenChange={() => setSelectedPayment(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Review the payment proof submitted by the client</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              {/* Transfer Receipt Image */}
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={selectedPayment.transferImage}
                  alt="Transfer receipt"
                  className="w-full max-h-64 object-contain bg-muted"
                />
              </div>

              {/* Details Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="font-medium">{selectedPayment.user.name ?? "Pending name"}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Package</Label>
                  <p className="font-medium">{selectedPayment.subscription.package.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedPayment.subscription.package.price)} -{" "}
                    {selectedPayment.subscription.package.credits} credits
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Amount Sent</Label>
                  <p className="font-medium text-lg">
                    {formatCurrency(selectedPayment.amount)} {selectedPayment.currency}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Transfer Date</Label>
                  <p className="font-medium">{formatDate(selectedPayment.transferDate)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Sender Name</Label>
                  <p className="font-medium">{selectedPayment.senderName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Sender Bank</Label>
                  <p className="font-medium">{selectedPayment.senderBank}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium">{selectedPayment.senderCountry}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Reference Number</Label>
                  <p className="font-medium">
                    {selectedPayment.referenceNumber || "Awaiting reference number"}
                  </p>
                </div>
              </div>

              {selectedPayment.notes && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="p-2 bg-muted rounded">{selectedPayment.notes}</p>
                </div>
              )}

              {selectedPayment.status === "REJECTED" && selectedPayment.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Rejection Reason:</p>
                  <p className="text-red-800">{selectedPayment.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedPayment?.status === "PENDING" && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedPayment.id)}
                  disabled={approveMutation.isPending}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The client will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Rejection Reason *</Label>
              <Textarea
                id="rejectReason"
                placeholder="e.g., Amount doesn't match the package price, Unable to verify transfer receipt..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Minimum 10 characters required</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || rejectReason.length < 10}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
