"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { WhatsAppSupport } from "@/components/ui/whatsapp-support";
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
import { Check, Zap, Shield, Clock, Star, Users } from "lucide-react";

type FeatureKey = "credit" | "quality" | "speed" | "revisions" | "experts";

type PackageKey = "starter" | "professional" | "enterprise";

type StepKey = "subscribe" | "create" | "results";

const featureItems: Array<{ icon: ComponentType<{ className?: string }>; key: FeatureKey }> = [
  { icon: Zap, key: "credit" },
  { icon: Shield, key: "quality" },
  { icon: Clock, key: "speed" },
  { icon: Star, key: "revisions" },
  { icon: Users, key: "experts" },
];

const packageItems: Array<{
  key: PackageKey;
  price: number;
  popular: boolean;
}> = [
  { key: "starter", price: 49, popular: false },
  { key: "professional", price: 149, popular: true },
  { key: "enterprise", price: 299, popular: false },
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

  const packageFeatures = (pkgKey: PackageKey) =>
    (t.raw(`pricing.packages.${pkgKey}.features`) as string[]) || [];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
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
            <Link
              href="#features"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t("nav.features")}
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t("nav.pricing")}
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t("nav.how")}
            </Link>
          </nav>
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button variant="ghost">{tCommon("buttons.signIn")}</Button>
            </Link>
            <Link href="/auth/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button>{tCommon("buttons.getStarted")}</Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      <main>
        {/* Hero Section */}
        <section className="container py-24 md:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center"
          >
            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]"
            >
              {t("hero.title")}{" "}
              <motion.span
                className="bg-gradient-to-r from-white to-[#f900fe] bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                {t("hero.accent")}
              </motion.span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-[750px] text-lg text-muted-foreground sm:text-xl"
            >
              {t("hero.subtitle")}
            </motion.p>
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-4"
            >
              <Link href="/auth/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-12 px-8">
                    {tCommon("buttons.startFreeTrial")}
                  </Button>
                </motion.div>
              </Link>
              <Link href="#how-it-works">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="outline" className="h-12 px-8">
                    {tCommon("buttons.learnMore")}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              {t("hero.note")}
            </motion.p>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24 bg-muted/50">
          <div className="mx-auto max-w-[980px]">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("features.heading")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("features.subheading")}</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {featureItems.map((feature) => (
                <motion.div
                  key={feature.key}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="border-0 bg-background h-full">
                    <CardHeader>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
                      >
                        <feature.icon className="h-6 w-6 text-primary" />
                      </motion.div>
                      <CardTitle className="text-xl">
                        {t(`features.items.${feature.key}.title`)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {t(`features.items.${feature.key}.description`)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Image Carousel Section */}
        <ImageCarousel />

        {/* Pricing Section */}
        <section id="pricing" className="container py-24">
          <div className="mx-auto max-w-[1200px]">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("pricing.heading")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("pricing.subheading")}</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-8 md:grid-cols-3"
            >
              {packageItems.map((pkg) => (
                <motion.div
                  key={pkg.key}
                  variants={scaleIn}
                  whileHover={{
                    y: -10,
                    boxShadow: "0 20px 40px -20px rgba(0,0,0,0.2)",
                    transition: { duration: 0.3 },
                  }}
                >
                  <Card
                    className={`relative h-full ${
                      pkg.popular ? "border-primary shadow-lg scale-105" : ""
                    }`}
                  >
                    {pkg.popular && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      >
                        {t("pricing.mostPopular")}
                      </motion.div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">
                        {t(`pricing.packages.${pkg.key}.name`)}
                      </CardTitle>
                      <CardDescription>
                        <span className="text-4xl font-bold text-foreground">${pkg.price}</span>
                        <span className="text-muted-foreground">{t("pricing.perMonth")}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {packageFeatures(pkg.key).map((feature, featureIndex) => (
                          <motion.li
                            key={feature}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: featureIndex * 0.1 }}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/auth/register" className="w-full">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className="w-full" variant={pkg.popular ? "default" : "outline"}>
                            {tCommon("buttons.getStarted")}
                          </Button>
                        </motion.div>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container py-24 bg-muted/50">
          <div className="mx-auto max-w-[980px]">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("how.heading")}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("how.subheading")}</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-8 md:grid-cols-3"
            >
              {howSteps.map((item) => (
                <motion.div
                  key={item.key}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="mb-2 text-xl font-semibold">{t(`how.steps.${item.key}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`how.steps.${item.key}.description`)}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="mx-auto max-w-[600px] text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("cta.heading")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("cta.subheading")}</p>
            <motion.div className="mt-8" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/auth/register">
                <Button size="lg" className="h-12 px-8">
                  {t("cta.button")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="border-t py-12"
      >
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/logo.svg"
              alt="Nabra Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          <p className="text-sm text-muted-foreground">{tCommon("footer.copyright")}</p>
          <div className="flex items-center space-x-4">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {tCommon("footer.privacy")}
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {tCommon("footer.terms")}
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {tCommon("footer.contact")}
            </Link>
          </div>
        </div>
      </motion.footer>

      {/* WhatsApp Floating Button */}
      <WhatsAppSupport />
    </div>
  );
}
