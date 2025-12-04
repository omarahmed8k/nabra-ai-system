"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Zap, Shield, Clock, Star, Users } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Credit-Based System",
    description:
      "Purchase credits and use them for any service. No per-project negotiations.",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description:
      "All providers are vetted professionals. Satisfaction guaranteed on every request.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description:
      "Most requests completed within 48-72 hours. Rush options available.",
  },
  {
    icon: Star,
    title: "Smart Revisions",
    description:
      "Free revisions included with every package. Additional revisions at a fair rate.",
  },
  {
    icon: Users,
    title: "Expert Team",
    description:
      "Access designers, developers, and content creators all in one platform.",
  },
];

const packages = [
  {
    name: "Starter",
    price: 49,
    credits: 5,
    revisions: 2,
    popular: false,
    features: [
      "5 request credits",
      "2 free revisions per request",
      "Email support",
      "48-hour response time",
    ],
  },
  {
    name: "Professional",
    price: 149,
    credits: 20,
    revisions: 3,
    popular: true,
    features: [
      "20 request credits",
      "3 free revisions per request",
      "Priority support",
      "24-hour response time",
      "Dedicated account manager",
    ],
  },
  {
    name: "Enterprise",
    price: 299,
    credits: 50,
    revisions: 5,
    popular: false,
    features: [
      "50 request credits",
      "5 free revisions per request",
      "24/7 priority support",
      "12-hour response time",
      "Dedicated account manager",
      "Custom integrations",
      "API access",
    ],
  },
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
    transition: { duration: 0.5 }
  },
};

export default function LandingPage() {
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
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"
            >
              <span className="text-lg font-bold text-primary-foreground">N</span>
            </motion.div>
            <span className="text-xl font-bold">Nabra</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button>Get Started</Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

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
            Digital Services,{" "}
            <motion.span 
              className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Simplified
            </motion.span>
          </motion.h1>
          <motion.p 
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-[750px] text-lg text-muted-foreground sm:text-xl"
          >
            Connect with expert designers, developers, and content creators through our
            credit-based platform. No negotiations, no surprises – just quality work delivered
            fast.
          </motion.p>
          <motion.div 
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Link href="/auth/register">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="h-12 px-8">
                  Start Free Trial
                </Button>
              </motion.div>
            </Link>
            <Link href="#how-it-works">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="h-12 px-8">
                  Learn More
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          <motion.p 
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            No credit card required • Cancel anytime
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
              Everything you need to get work done
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One platform for all your digital service needs
            </p>
          </motion.div>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
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
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

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
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </motion.div>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {packages.map((pkg) => (
              <motion.div
                key={pkg.name}
                variants={scaleIn}
                whileHover={{ 
                  y: -10, 
                  boxShadow: "0 20px 40px -20px rgba(0,0,0,0.2)",
                  transition: { duration: 0.3 }
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
                      Most Popular
                    </motion.div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <CardDescription>
                      <span className="text-4xl font-bold text-foreground">
                        ${pkg.price}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {pkg.features.map((feature, featureIndex) => (
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
                        <Button
                          className="w-full"
                          variant={pkg.popular ? "default" : "outline"}
                        >
                          Get Started
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
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in just 3 simple steps
            </p>
          </motion.div>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {[
              {
                step: 1,
                title: "Subscribe",
                description: "Choose a plan that fits your needs and get your credits instantly.",
              },
              {
                step: 2,
                title: "Create Request",
                description: "Describe what you need. Our providers will pick up your request.",
              },
              {
                step: 3,
                title: "Get Results",
                description: "Review deliverables, request revisions if needed, and approve when satisfied.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
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
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of businesses already using Nabra to streamline their digital
            services.
          </p>
          <motion.div 
            className="mt-8"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/auth/register">
              <Button size="lg" className="h-12 px-8">
                Start Your Free Trial
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

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
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-xl font-bold">Nabra</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Nabra AI System. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
