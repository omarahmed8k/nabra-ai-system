"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUpload } from "@/components/ui/file-upload";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/error-handler";
import {
  Upload,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";

// Explicit types for the data
interface PaymentProof {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  senderName: string;
  senderBank: string;
  senderCountry: string;
  amount: number;
  transferDate: Date;
  createdAt: Date;
  rejectionReason?: string | null;
}

interface Package {
  id: string;
  name: string;
  price: number;
  credits: number;
}

interface PendingSubscription {
  id: string;
  package: Package;
  paymentProof: PaymentProof | null;
}

interface PaymentInfo {
  bankName: string;
  accountName: string;
  iban: string;
  swiftCode: string;
  currency: string;
  note: string;
}

interface FormData {
  senderName: string;
  senderBank: string;
  senderCountry: string;
  transferDate: string;
  referenceNumber: string;
  notes: string;
  transferImageUrl: string;
}

function getStatusBadgeVariant(status: string) {
  if (status === "APPROVED") return "default" as const;
  if (status === "REJECTED") return "destructive" as const;
  return "secondary" as const;
}

// Component for when there's no pending payment
function NoPendingPayment() {
  const router = useRouter();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment</h1>
        <p className="text-muted-foreground">Submit payment proof for your subscription</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Payment</h3>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have any pending subscriptions that require payment.
          </p>
          <Button onClick={() => router.push("/client/subscription")}>
            View Subscriptions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for payment status display (when proof already submitted)
function PaymentStatus({ subscription }: { subscription: PendingSubscription }) {
  const router = useRouter();
  const proof = subscription.paymentProof!;
  const badgeVariant = getStatusBadgeVariant(proof.status);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment Status</h1>
        <p className="text-muted-foreground">Track your payment verification</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{subscription.package.name} Plan</CardTitle>
              <CardDescription>
                {formatCurrency(subscription.package.price)}
              </CardDescription>
            </div>
            <Badge variant={badgeVariant}>
              {proof.status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
              {proof.status === "APPROVED" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {proof.status === "REJECTED" && <XCircle className="h-3 w-3 mr-1" />}
              {proof.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {proof.status === "PENDING" && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Verification in Progress</AlertTitle>
              <AlertDescription>
                We&apos;re reviewing your payment. This usually takes 1-2 business days.
              </AlertDescription>
            </Alert>
          )}

          {proof.status === "REJECTED" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Payment Rejected</AlertTitle>
              <AlertDescription>
                {proof.rejectionReason ?? "Your payment could not be verified. Please contact support."}
              </AlertDescription>
            </Alert>
          )}

          {proof.status === "APPROVED" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Payment Approved!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your subscription is now active. You can start creating requests.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-xl font-bold">{formatCurrency(proof.amount)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Transfer Date</p>
              <p className="text-xl font-bold">{formatDate(proof.transferDate)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Sender</p>
              <p className="font-medium">{proof.senderName}</p>
              <p className="text-sm text-muted-foreground">
                {proof.senderBank}, {proof.senderCountry}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="font-medium">{formatDate(proof.createdAt)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push("/client/subscription")}>
            Back to Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Copy button component
function CopyButton({
  field,
  value,
  copied,
  onCopy,
}: {
  field: string;
  value: string;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <Button size="sm" variant="ghost" onClick={() => onCopy(value, field)}>
      {copied === field ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

// Component for bank details card
function BankDetailsCard({
  subscription,
  paymentInfo,
  copied,
  onCopy,
}: {
  subscription: PendingSubscription;
  paymentInfo: PaymentInfo;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
}) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Bank Transfer Details
        </CardTitle>
        <CardDescription>
          Send payment to the following account via international bank transfer (IBAN)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Package Info */}
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{subscription.package.name}</span>
            <Badge>{subscription.package.credits} Credits</Badge>
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(subscription.package.price)}
          </p>
        </div>

        {/* Bank Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Bank Name</p>
              <p className="font-medium">{paymentInfo.bankName}</p>
            </div>
            <CopyButton field="bankName" value={paymentInfo.bankName} copied={copied} onCopy={onCopy} />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Account Name</p>
              <p className="font-medium">{paymentInfo.accountName}</p>
            </div>
            <CopyButton field="accountName" value={paymentInfo.accountName} copied={copied} onCopy={onCopy} />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">IBAN</p>
              <p className="font-mono font-medium">{paymentInfo.iban}</p>
            </div>
            <CopyButton field="iban" value={paymentInfo.iban} copied={copied} onCopy={onCopy} />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">SWIFT/BIC</p>
              <p className="font-mono font-medium">{paymentInfo.swiftCode}</p>
            </div>
            <CopyButton field="swiftCode" value={paymentInfo.swiftCode} copied={copied} onCopy={onCopy} />
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{paymentInfo.note}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Component for payment proof form
function PaymentProofForm({
  subscriptionId,
  packagePrice,
  onSuccess,
}: {
  subscriptionId: string;
  packagePrice: number;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<FormData>({
    senderName: "",
    senderBank: "",
    senderCountry: "",
    transferDate: "",
    referenceNumber: "",
    notes: "",
    transferImageUrl: "",
  });

  const submitProofMutation = trpc.payment.submitProof.useMutation({
    onSuccess: () => {
      showSuccess("Payment proof submitted successfully! We'll verify it soon.");
      onSuccess();
    },
    onError: (error) => {
      showError(error);
    },
  });

  const handleFilesChange = (files: any[]) => {
    if (files.length > 0) {
      setFormData((prev) => ({ ...prev, transferImageUrl: files[0].url }));
    } else {
      setFormData((prev) => ({ ...prev, transferImageUrl: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.transferImageUrl) {
      showError("Please upload the transfer receipt image");
      return;
    }

    if (!formData.transferDate) {
      showError("Please select the transfer date");
      return;
    }

    submitProofMutation.mutate({
      subscriptionId,
      transferImage: formData.transferImageUrl,
      senderName: formData.senderName,
      senderBank: formData.senderBank,
      senderCountry: formData.senderCountry,
      amount: packagePrice,
      currency: "USD",
      transferDate: new Date(formData.transferDate),
      referenceNumber: formData.referenceNumber || undefined,
      notes: formData.notes || undefined,
    });
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Payment Proof
        </CardTitle>
        <CardDescription>
          After making the transfer, fill in the details and upload the receipt
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Transfer Receipt *</Label>
            <FileUpload
              onFilesChange={handleFilesChange}
              maxFiles={1}
              maxSizeMB={10}
              accept="image/*"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name *</Label>
              <Input
                id="senderName"
                placeholder="Name on bank account"
                required
                value={formData.senderName}
                onChange={(e) => updateField("senderName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderBank">Bank Name *</Label>
              <Input
                id="senderBank"
                placeholder="e.g., Chase, HSBC"
                required
                value={formData.senderBank}
                onChange={(e) => updateField("senderBank", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="senderCountry">Country *</Label>
              <Input
                id="senderCountry"
                placeholder="e.g., United States"
                required
                value={formData.senderCountry}
                onChange={(e) => updateField("senderCountry", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferDate">Transfer Date *</Label>
              <div className="relative">
                <Input
                  id="transferDate"
                  type="date"
                  required
                  value={formData.transferDate}
                  onChange={(e) => updateField("transferDate", e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-sm">
                  📅
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
            <Input
              id="referenceNumber"
              placeholder="Bank reference or transaction ID"
              value={formData.referenceNumber}
              onChange={(e) => updateField("referenceNumber", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={submitProofMutation.isPending}
          >
            {submitProofMutation.isPending ? "Submitting..." : "Submit Payment Proof"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Main page component
export default function PaymentPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: pendingSubscriptionData, isLoading: subLoading } =
    trpc.subscription.getPending.useQuery(undefined, {
      refetchOnMount: "always",
      staleTime: 0,
    });
  const { data: paymentInfoData, isLoading: infoLoading } =
    trpc.payment.getPaymentInfo.useQuery();

  const cancelMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      utils.subscription.getPending.invalidate();
      utils.subscription.getActive.invalidate();
      showSuccess("Subscription cancelled.");
      router.push("/client/subscription");
    },
    onError: (error) => {
      showError(error);
    },
  });

  // Cast to our explicit types
  const pendingSubscription = pendingSubscriptionData as PendingSubscription | null | undefined;
  const paymentInfo = paymentInfoData as PaymentInfo | undefined;

  const isLoading = subLoading || infoLoading;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Complete Payment</h1>
          <p className="text-muted-foreground">
            Transfer payment and upload proof to activate your subscription
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // No pending subscription
  if (!pendingSubscription) {
    return <NoPendingPayment />;
  }

  // Payment already submitted
  if (pendingSubscription.paymentProof) {
    return <PaymentStatus subscription={pendingSubscription} />;
  }

  const handleCancelSubscription = () => {
    if (confirm("Are you sure you want to cancel this subscription? You will need to subscribe again.")) {
      cancelMutation.mutate({ subscriptionId: pendingSubscription.id });
    }
  };

  // Show payment form
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complete Payment</h1>
          <p className="text-muted-foreground">
            Transfer payment and upload proof to activate your subscription
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleCancelSubscription}
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {paymentInfo && (
          <BankDetailsCard
            subscription={pendingSubscription}
            paymentInfo={paymentInfo}
            copied={copied}
            onCopy={copyToClipboard}
          />
        )}
        <PaymentProofForm
          subscriptionId={pendingSubscription.id}
          packagePrice={pendingSubscription.package.price}
          onSuccess={() => utils.subscription.getPending.invalidate()}
        />
      </div>
    </div>
  );
}
