"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveLocalizedText } from "@/lib/i18n";
import { trpc } from "@/lib/trpc/client";
import { CheckCircle, CreditCard, Wallet } from "lucide-react";

type LedgerEntry = {
  id: string;
  totalCredits: number;
  providerCredits: number;
  creditPriceEgp: number;
  totalAmountEgp: number;
  providerAmountEgp: number;
  status: "AVAILABLE" | "PAID" | "VOIDED";
  settledAt: string | Date;
  provider: { name: string | null; email: string };
  request: { title: string };
  serviceType: {
    icon: string | null;
    name: string;
    nameI18n?: Record<string, string> | null;
  };
};

function formatCredits(value: number) {
  return value.toLocaleString();
}

function formatEgp(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP`;
}

export default function AdminFinancePage() {
  const t = useTranslations("admin.finance");
  const locale = useLocale();
  const [selectedProviderId, setSelectedProviderId] = useState<string | undefined>();

  const { data: finance, isLoading: financeLoading } = trpc.admin.getFinanceOverview.useQuery();
  const { data: ledgerData, isLoading: ledgerLoading } =
    trpc.admin.getProviderFinanceLedger.useQuery({
      providerId: selectedProviderId,
      limit: 50,
    });

  const selectedProvider = useMemo(
    () =>
      finance?.providerWallets.find(
        (wallet: { provider: { id: string } }) => wallet.provider.id === selectedProviderId
      ),
    [finance?.providerWallets, selectedProviderId]
  );
  const ledgerEntries = (ledgerData?.ledger ?? []) as LedgerEntry[];

  const summaryCards = [
    {
      title: t("summary.providerAmount"),
      value: formatEgp(finance?.summary.totalProviderAmountEgp ?? 0),
      description: t("summary.providerCreditsDesc"),
      detail: t("summary.creditDetail", {
        credits: finance?.summary.totalProviderCredits ?? 0,
      }),
      icon: Wallet,
    },
    {
      title: t("summary.walletBalance"),
      value: formatEgp(finance?.summary.totalWalletBalanceEgp ?? 0),
      description: t("summary.walletBalanceDesc"),
      detail: t("summary.creditDetail", {
        credits: finance?.summary.totalWalletBalanceCredits ?? 0,
      }),
      icon: CreditCard,
    },
    {
      title: t("summary.settledRequests"),
      value: formatCredits(finance?.summary.totalSettledRequests ?? 0),
      description: t("summary.settledRequestsDesc"),
      detail: t("summary.creditDetail", {
        credits: finance?.summary.totalRequestCredits ?? 0,
      }),
      icon: CheckCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {financeLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{card.description}</p>
              <p className="text-xs text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("wallets.title")}</CardTitle>
          <CardDescription>{t("wallets.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {financeLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("wallets.provider")}</TableHead>
                  <TableHead>{t("wallets.balance")}</TableHead>
                  <TableHead>{t("wallets.balanceEgp")}</TableHead>
                  <TableHead>{t("wallets.paid")}</TableHead>
                  <TableHead>{t("wallets.paidEgp")}</TableHead>
                  <TableHead>{t("wallets.requests")}</TableHead>
                  <TableHead>{t("wallets.ledger")}</TableHead>
                  <TableHead>{t("wallets.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finance?.providerWallets.map(
                  (wallet: {
                    provider: { id: string; name: string | null; email: string };
                    balanceCredits: number;
                    paidCredits: number;
                    balanceEgp: number;
                    paidEgp: number;
                    requestCount: number;
                    ledgerCount: number;
                  }) => (
                    <TableRow key={wallet.provider.id}>
                      <TableCell>
                        <div className="font-medium">
                          {wallet.provider.name || wallet.provider.email}
                        </div>
                        <div className="text-xs text-muted-foreground">{wallet.provider.email}</div>
                      </TableCell>
                      <TableCell>{formatCredits(wallet.balanceCredits)}</TableCell>
                      <TableCell>{formatEgp(wallet.balanceEgp)}</TableCell>
                      <TableCell>{formatCredits(wallet.paidCredits)}</TableCell>
                      <TableCell>{formatEgp(wallet.paidEgp)}</TableCell>
                      <TableCell>{wallet.requestCount}</TableCell>
                      <TableCell>{wallet.ledgerCount}</TableCell>
                      <TableCell>
                        <Button
                          variant={
                            selectedProviderId === wallet.provider.id ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setSelectedProviderId(
                              selectedProviderId === wallet.provider.id
                                ? undefined
                                : wallet.provider.id
                            )
                          }
                        >
                          {selectedProviderId === wallet.provider.id
                            ? t("wallets.showAll")
                            : t("wallets.viewLedger")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("ledger.title")}</CardTitle>
              <CardDescription>
                {selectedProvider
                  ? t("ledger.filteredBy", {
                      provider: selectedProvider.provider.name || selectedProvider.provider.email,
                    })
                  : t("ledger.description")}
              </CardDescription>
            </div>
            {(finance?.summary.unsettledCompletedRequests ?? 0) > 0 && (
              <Badge variant="secondary">
                {t("ledger.unsettled", {
                  count: finance?.summary.unsettledCompletedRequests ?? 0,
                })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ledger.provider")}</TableHead>
                  <TableHead>{t("ledger.request")}</TableHead>
                  <TableHead>{t("ledger.service")}</TableHead>
                  <TableHead>{t("ledger.total")}</TableHead>
                  <TableHead>{t("ledger.creditPrice")}</TableHead>
                  <TableHead>{t("ledger.providerCredits")}</TableHead>
                  <TableHead>{t("ledger.providerAmount")}</TableHead>
                  <TableHead>{t("ledger.status")}</TableHead>
                  <TableHead>{t("ledger.settledAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.provider.name || entry.provider.email}</TableCell>
                    <TableCell>{entry.request.title}</TableCell>
                    <TableCell>
                      {entry.serviceType.icon}{" "}
                      {resolveLocalizedText(
                        entry.serviceType.nameI18n,
                        locale,
                        entry.serviceType.name
                      )}
                    </TableCell>
                    <TableCell>{formatCredits(entry.totalCredits)}</TableCell>
                    <TableCell>{formatEgp(entry.creditPriceEgp)}</TableCell>
                    <TableCell>{formatCredits(entry.providerCredits)}</TableCell>
                    <TableCell>{formatEgp(entry.providerAmountEgp)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`status.${entry.status}`)}</Badge>
                    </TableCell>
                    <TableCell>{new Date(entry.settledAt).toLocaleDateString(locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
