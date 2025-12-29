"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { WhatsAppSupport } from "@/components/ui/whatsapp-support";
import { NabarawyAssistant } from "@/components/ui/nabarawy-assistant";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ImageCarousel } from "@/components/landing/image-carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  Zap,
  Shield,
  Clock,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

type FeatureKey = "credit" | "quality" | "speed" | "revisions" | "experts";

type StepKey = "subscribe" | "create" | "results";

interface Package {
  id: string;
  name: string;
  nameI18n?: Record<string, string>;
  price: number;
  credits: number;
  durationDays: number;
  description?: string;
  descriptionI18n?: Record<string, string>;
  features: string[];
  featuresI18n?: Record<string, string[]>;
  sortOrder: number;
  services: Array<{
    serviceType: {
      id: string;
      name: string;
      nameI18n?: Record<string, string>;
      icon: string;
    };
  }>;
}

const featureItems: Array<{ icon: ComponentType<{ className?: string }>; key: FeatureKey }> = [
  { icon: Zap, key: "credit" },
  { icon: Shield, key: "quality" },
  { icon: Clock, key: "speed" },
  { icon: Star, key: "revisions" },
  { icon: Users, key: "experts" },
];

const howSteps: Array<{ step: number; key: StepKey }> = [
  { step: 1, key: "subscribe" },
  { step: 2, key: "create" },
  { step: 3, key: "results" },
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export default function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Fetch packages and services from API
  const { data: packagesData } = trpc.admin.getPublicPackages.useQuery(undefined, {
    enabled: true,
  });

  useEffect(() => {
    if (packagesData) {
      setPackages(packagesData);
      setLoadingPackages(false);
    }
  }, [packagesData]);

  const getLocalizedText = (
    text: string | undefined,
    i18nObj: Record<string, string> | undefined
  ) => {
    if (!i18nObj) return text || "";
    return i18nObj[locale] || text || "";
  };

  const getPackageFeatures = (pkg: Package) => {
    if (pkg.featuresI18n?.[locale]) {
      return pkg.featuresI18n[locale];
    }
    return pkg.features || [];
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background/50 to-background overflow-hidden">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/30"
      >
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 relative z-10">
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
              <Image
                src="/images/logo.svg"
                alt="Nabra Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
            </motion.div>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            {[
              { href: "#features", label: t("nav.features") },
              { href: "#pricing", label: t("nav.pricing") },
              { href: "#how-it-works", label: t("nav.how") },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.span
                  className="text-sm font-medium hover:text-primary transition-colors cursor-pointer"
                  whileHover={{ y: -2 }}
                >
                  {item.label}
                </motion.span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-2 relative z-10">
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button variant="ghost" className="hover:bg-white/5">
                {tCommon("buttons.signIn")}
              </Button>
            </Link>
            <Link href="/auth/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90">
                  {tCommon("buttons.getStarted")}
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container py-32 md:py-48 relative">
          {/* Hero Background Glow */}
          <motion.div
            className="absolute inset-0 -z-10 mx-auto w-[90%] h-[80%] bg-gradient-to-b from-primary/20 via-purple-500/10 to-transparent rounded-3xl blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            {/* Nabarawy AI Character */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex justify-center lg:justify-end order-2 lg:order-1"
            >
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/images/nabarawy.png"
                  alt="Nabarawy AI Assistant"
                  width={300}
                  height={300}
                  className="w-64 h-64 md:w-80 md:h-80 object-contain bg-transparent"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Hero Text Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-start gap-6 lg:text-left text-center order-1 lg:order-2"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 rounded-full backdrop-blur-xl"
              >
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-sm font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Creative Solutions Platform
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black leading-none"
              >
                <span className="block mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {t("hero.title")}
                </span>
                <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                  {t("hero.accent")}
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-[750px] text-xl text-muted-foreground leading-relaxed"
              >
                {t("hero.subtitle")}
              </motion.p>

              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap items-center lg:justify-start justify-center gap-4 pt-6 w-full"
              >
                <Link href="/auth/register">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      className="h-13 px-8 bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90 font-semibold"
                    >
                      {tCommon("buttons.startFreeTrial")} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="#how-it-works">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-13 px-8 border-white/20 hover:bg-white/5"
                    >
                      {tCommon("buttons.learnMore")}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-sm text-muted-foreground italic"
              >
                {t("hero.note")}
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <motion.div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 rounded-full backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Key Features</span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t("features.heading")}
              </span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("features.subheading")}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
          >
            {featureItems.map((feature) => (
              <motion.div
                key={feature.key}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="relative border border-white/10 bg-background/50 backdrop-blur-xl hover:border-primary/30 transition-all h-full">
                  <CardHeader>
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 border border-primary/20"
                    >
                      <feature.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <CardTitle className="text-2xl font-bold">
                      {t(`features.items.${feature.key}.title`)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {t(`features.items.${feature.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Image Carousel Section */}
        <ImageCarousel />

        {/* Pricing Section */}
        <section id="pricing" className="container py-24 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <motion.div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 rounded-full backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Flexible Pricing</span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t("pricing.heading")}
              </span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("pricing.subheading")}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
          >
            {loadingPackages && (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!loadingPackages && packages.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {t("pricing.noPackages")}
              </div>
            )}
            {!loadingPackages &&
              packages.length > 0 &&
              packages.map((pkg, idx) => {
                const isPopular = idx === Math.floor(packages.length / 2);
                return (
                  <motion.div
                    key={pkg.id}
                    variants={scaleIn}
                    whileHover={{
                      y: -12,
                      transition: { duration: 0.3 },
                    }}
                    className={`relative group ${isPopular ? "md:scale-105" : ""}`}
                  >
                    {/* Card Glow */}
                    <div
                      className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all ${
                        isPopular
                          ? "bg-gradient-to-br from-primary/40 via-purple-500/40 to-pink-500/40"
                          : "bg-gradient-to-br from-primary/20 to-purple-500/20"
                      }`}
                    />

                    <Card
                      className={`relative border backdrop-blur-xl bg-background/50 transition-all h-full ${
                        isPopular
                          ? "border-primary/50 shadow-2xl shadow-primary/20"
                          : "border-white/10 group-hover:border-primary/30"
                      }`}
                    >
                      {isPopular && (
                        <motion.div
                          initial={{ scale: 0, y: -20 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                          className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-lg"
                        >
                          🌟 {t("pricing.mostPopular")}
                        </motion.div>
                      )}

                      <CardHeader className="text-center pt-8">
                        <CardTitle className="text-3xl font-black">
                          {getLocalizedText(pkg.name, pkg.nameI18n)}
                        </CardTitle>
                        <CardDescription className="mt-4">
                          <span className="text-5xl font-black bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            ${pkg.price}
                          </span>
                          <span className="text-muted-foreground block mt-1">
                            {t("pricing.perMonth")}
                          </span>
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        {pkg.description && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {getLocalizedText(pkg.description, pkg.descriptionI18n)}
                          </p>
                        )}
                        <ul className="space-y-4">
                          {getPackageFeatures(pkg).map((feature, featureIndex) => (
                            <motion.li
                              key={`${pkg.id}-${feature}`}
                              className="flex items-start gap-3"
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: featureIndex * 0.08 }}
                            >
                              <motion.div
                                className="mt-1 flex-shrink-0"
                                whileHover={{ scale: 1.2 }}
                              >
                                <Check className="h-5 w-5 text-green-400 font-bold" />
                              </motion.div>
                              <span className="text-sm leading-relaxed">{feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                        {pkg.services && pkg.services.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-white/10">
                            <p className="text-xs font-semibold text-muted-foreground mb-3">
                              {locale === "ar" ? "الخدمات المتضمنة" : "Included Services"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {pkg.services.map((service) => (
                                <div
                                  key={service.serviceType.id}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium border border-primary/20"
                                >
                                  <span>{service.serviceType.icon}</span>
                                  <span>
                                    {getLocalizedText(
                                      service.serviceType.name,
                                      service.serviceType.nameI18n
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter>
                        <Link href="/auth/register" className="w-full">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              className={`w-full font-semibold h-12 ${
                                isPopular
                                  ? "bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90"
                                  : "border border-white/20 hover:bg-white/5"
                              }`}
                              variant={isPopular ? "default" : "outline"}
                            >
                              {tCommon("buttons.getStarted")}{" "}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </motion.div>
                        </Link>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container py-24 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <motion.div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 rounded-full backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Simple Process</span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t("how.heading")}
              </span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("how.subheading")}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto"
          >
            {howSteps.map((item, idx) => (
              <motion.div
                key={item.key}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="relative text-center group"
              >
                {/* Connection Line */}
                {idx < howSteps.length - 1 && (
                  <motion.div
                    className="hidden md:block absolute top-24 left-[60%] w-[80%] h-1 bg-gradient-to-r from-primary via-purple-500 to-transparent"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                )}

                <motion.div
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 border border-primary/30 text-4xl font-black bg-clip-text text-transparent group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all"
                >
                  {item.step}
                </motion.div>

                <h3 className="mb-4 text-2xl font-bold">{t(`how.steps.${item.key}.title`)}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {t(`how.steps.${item.key}.description`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="container py-32 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="relative mx-auto max-w-2xl text-center"
          >
            {/* CTA Background Glow */}
            <motion.div
              className="absolute inset-0 -z-10 mx-auto w-[100%] h-[150%] bg-gradient-to-b from-primary/30 via-purple-500/20 to-transparent rounded-3xl blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {t("cta.heading")}
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-10">
                {t("cta.subheading")}
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/auth/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90 shadow-lg shadow-primary/20"
                  >
                    {t("cta.button")} <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#features">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-10 text-lg border-white/20 hover:bg-white/5"
                  >
                    {tCommon("buttons.learnMore")}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-white/10 py-12 relative z-10 mt-12"
      >
        <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/logo.svg"
              alt="Nabra Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="font-bold hidden sm:inline">Nabra</span>
          </div>
          <p className="text-sm text-muted-foreground">{tCommon("footer.copyright")}</p>
          <div className="flex items-center space-x-6">
            {[
              { label: tCommon("footer.privacy"), href: "#" },
              { label: tCommon("footer.terms"), href: "#" },
              { label: tCommon("footer.contact"), href: "#" },
            ].map((link) => (
              <Link key={link.label} href={link.href}>
                <motion.span
                  className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  whileHover={{ y: -2 }}
                >
                  {link.label}
                </motion.span>
              </Link>
            ))}
          </div>
        </div>
      </motion.footer>

      {/* Nabarawy AI Assistant */}
      <NabarawyAssistant autoShow={true} showDelay={5000} />

      {/* WhatsApp Floating Button */}
      <WhatsAppSupport />
    </div>
  );
}
