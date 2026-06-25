"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
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
import { CreditCard, History, Wallet } from "lucide-react";

type WalletLedgerEntry = {
  id: string;
  totalCredits: number;
  providerCredits: number;
  creditPriceEgp: number;
  totalAmountEgp: number;
  providerAmountEgp: number;
  status: "AVAILABLE" | "PAID" | "VOIDED";
  settledAt: string | Date;
  request: {
    title: string;
  };
  serviceType: {
    icon?: string | null;
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

export default function ProviderWalletPage() {
  const t = useTranslations("provider.walletPage");
  const locale = useLocale();
  const { data, isLoading } = trpc.provider.getEarnings.useQuery();
  const ledger = (data?.ledger ?? []) as WalletLedgerEntry[];

  const summaryCards = [
    {
      title: t("summary.balance"),
      value: formatEgp(data?.balanceEgp ?? 0),
      description: t("summary.balanceDesc"),
      detail: t("summary.creditDetail", { credits: data?.balanceCredits ?? 0 }),
      icon: Wallet,
    },
    {
      title: t("summary.periodEarnings"),
      value: formatEgp(data?.totalEarningsEgp ?? 0),
      description: t("summary.periodEarningsDesc"),
      detail: t("summary.creditDetail", { credits: data?.totalEarnings ?? 0 }),
      icon: CreditCard,
    },
    {
      title: t("summary.completed"),
      value: formatCredits(data?.completedCount ?? 0),
      description: t("summary.completedDesc"),
      detail: null,
      icon: History,
    },
  ];

  const renderLedgerContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (ledger.length === 0) {
      return (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {t("ledger.empty")}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
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
          {ledger.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.request.title}</TableCell>
              <TableCell>
                {entry.serviceType.icon}{" "}
                {resolveLocalizedText(entry.serviceType.nameI18n, locale, entry.serviceType.name)}
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
    );
  };

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
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{card.description}</p>
              {card.detail && <p className="text-xs text-muted-foreground">{card.detail}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("ledger.title")}</CardTitle>
          <CardDescription>{t("ledger.description")}</CardDescription>
        </CardHeader>
        <CardContent>{renderLedgerContent()}</CardContent>
      </Card>
    </div>
  );
}
