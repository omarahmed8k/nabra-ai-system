"use client";

import { useState, useEffect } from "react";
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
import { trpc } from "@/lib/trpc/client";
import { showError } from "@/lib/error-handler";
import { Loader2, Settings2 } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: priorityCosts, isLoading } = trpc.admin.getPriorityCosts.useQuery();
  const utils = trpc.useUtils();

  const [low, setLow] = useState<string>("");
  const [medium, setMedium] = useState<string>("");
  const [high, setHigh] = useState<string>("");

  // Set initial values when data loads
  useEffect(() => {
    if (priorityCosts) {
      setLow(priorityCosts.low.toString());
      setMedium(priorityCosts.medium.toString());
      setHigh(priorityCosts.high.toString());
    }
  }, [priorityCosts]);

  const updatePriorityCosts = trpc.admin.updatePriorityCosts.useMutation({
    onSuccess: () => {
      utils.admin.getPriorityCosts.invalidate();
      toast.success("Settings Updated", {
        description: "Priority cost settings have been updated successfully.",
      });
    },
    onError: (error) => {
      showError(error, "Failed to update settings");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const lowNum = Number.parseInt(low);
    const mediumNum = Number.parseInt(medium);
    const highNum = Number.parseInt(high);

    if (Number.isNaN(lowNum) || Number.isNaN(mediumNum) || Number.isNaN(highNum)) {
      toast.error("Validation Error", {
        description: "All values must be valid integers.",
      });
      return;
    }

    if (lowNum < 0 || mediumNum < 0 || highNum < 0) {
      toast.error("Validation Error", {
        description: "All values must be 0 or greater.",
      });
      return;
    }

    updatePriorityCosts.mutate({
      low: lowNum,
      medium: mediumNum,
      high: highNum,
    });
  }

  function handleReset() {
    if (priorityCosts) {
      setLow(priorityCosts.low.toString());
      setMedium(priorityCosts.medium.toString());
      setHigh(priorityCosts.high.toString());
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings2 className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and parameters
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Priority Cost Settings</CardTitle>
          <CardDescription>
            Configure the credit cost added to the base service cost for each priority level.
            These costs will be added (not multiplied) to the service's base credit cost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="low">Low Priority</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">+</span>
                  <Input
                    id="low"
                    type="number"
                    min="0"
                    step="1"
                    value={low}
                    onChange={(e) => setLow(e.target.value)}
                    placeholder="0"
                    disabled={updatePriorityCosts.isPending}
                  />
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current: +{priorityCosts?.low || 0} credits
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medium">Medium Priority</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">+</span>
                  <Input
                    id="medium"
                    type="number"
                    min="0"
                    step="1"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    placeholder="1"
                    disabled={updatePriorityCosts.isPending}
                  />
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current: +{priorityCosts?.medium || 1} credits
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="high">High Priority</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">+</span>
                  <Input
                    id="high"
                    type="number"
                    min="0"
                    step="1"
                    value={high}
                    onChange={(e) => setHigh(e.target.value)}
                    placeholder="2"
                    disabled={updatePriorityCosts.isPending}
                  />
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current: +{priorityCosts?.high || 2} credits
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Example Calculation</h4>
              <p className="text-sm text-muted-foreground">
                If a service has a base cost of <strong>5 credits</strong>:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Low Priority: 5 + {low || priorityCosts?.low || 0} = <strong>{5 + Number.parseInt(low || priorityCosts?.low.toString() || "0")} credits</strong></li>
                <li>• Medium Priority: 5 + {medium || priorityCosts?.medium || 1} = <strong>{5 + Number.parseInt(medium || priorityCosts?.medium.toString() || "1")} credits</strong></li>
                <li>• High Priority: 5 + {high || priorityCosts?.high || 2} = <strong>{5 + Number.parseInt(high || priorityCosts?.high.toString() || "2")} credits</strong></li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={updatePriorityCosts.isPending}
              >
                {updatePriorityCosts.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={updatePriorityCosts.isPending}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
