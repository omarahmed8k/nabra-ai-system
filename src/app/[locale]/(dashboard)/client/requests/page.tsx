"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestCard } from "@/components/requests/request-card";
import { EmptyRequestsState } from "@/components/requests/empty-requests-state";
import { trpc } from "@/lib/trpc/client";
import { Plus } from "lucide-react";

export default function RequestsPage() {
  const t = useTranslations("client.requests");
  const { data: requestsData, isLoading } = trpc.request.getAll.useQuery({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/client/requests/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("newRequest")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("allRequests")}</CardTitle>
          <CardDescription>
            {t("totalRequests", { count: requestsData?.requests.length || 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}
          {!isLoading && requestsData?.requests.length === 0 && (
            <EmptyRequestsState
              title={t("noRequests")}
              description={t("noRequestsDesc")}
              actionLabel={t("createRequest")}
              actionHref="/client/requests/new"
            />
          )}
          {!isLoading && (requestsData?.requests.length ?? 0) > 0 && (
            <div className="space-y-4">
              {requestsData?.requests.map((request: any) => (
                <RequestCard
                  key={request.id}
                  id={request.id}
                  title={request.title}
                  status={request.status}
                  creditCost={request.creditCost || 0}
                  createdAt={request.createdAt}
                  serviceType={request.serviceType}
                  provider={request.provider}
                  commentCount={request._count.comments}
                  href={`/client/requests/${request.id}`}
                  variant="compact"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
