"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { useEffect, useState, useRef } from "react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { WhatsAppSupport } from "@/components/ui/whatsapp-support";
import { NabarawyAssistant } from "@/components/ui/nabarawy-assistant";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

type FeatureKey = "credit" | "quality" | "speed" | "revisions" | "experts";

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

// Video Background Component
const VideoBackground = ({ src }: { src: string }) => (
  <div className="absolute inset-0 -z-20 overflow-hidden">
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 h-full w-full object-cover opacity-40"
    >
      <source src={src} type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
  </div>
);

// Carousel Navigation Component
const CarouselNav = ({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) => (
  <div className="flex gap-3 justify-center mt-8">
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onPrev}
      className="p-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 hover:border-cyan-500/60 transition-colors"
    >
      <ChevronLeft className="w-5 h-5 text-cyan-400" />
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="p-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 hover:border-cyan-500/60 transition-colors"
    >
      <ChevronRight className="w-5 h-5 text-cyan-400" />
    </motion.button>
  </div>
);

export default function LandingPage() {
  const locale = useLocale();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.querySelector("[data-carousel-item]")?.clientWidth || 0;
      const scrollAmount = itemWidth + 24;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-cyan-500/20"
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
            <span className="font-bold text-white hidden sm:inline">Nabra</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {[
              { href: "#features", label: "Features" },
              { href: "#portfolio", label: "Portfolio" },
              { href: "#pricing", label: "Pricing" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.span
                  className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors cursor-pointer"
                  whileHover={{ y: -2 }}
                >
                  {item.label}
                </motion.span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3 relative z-10">
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/5 text-sm"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:opacity-90 text-white font-semibold text-sm">
                  Get Started
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* 1. HERO SECTION */}
        <section className="relative w-full min-h-screen pt-24 flex items-center justify-center overflow-hidden">
          <VideoBackground src="/images/landing/hero-section.mp4" />

          <div className="container relative z-10 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
              {/* Left: Character */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex justify-center lg:justify-start order-2 lg:order-1"
              >
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/images/nabarawy.png"
                    alt="Nabarawy Character"
                    width={500}
                    height={500}
                    className="w-80 h-80 md:w-[450px] md:h-[450px] object-contain drop-shadow-2xl filter saturate-110"
                  />
                </motion.div>
              </motion.div>

              {/* Right: Content */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-col items-start gap-8 order-1 lg:order-2"
              >
                <motion.div variants={fadeInUp} className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-400">Welcome to Nabra</span>
                  </div>
                  <h1 className="text-6xl md:text-7xl font-black leading-tight">
                    <span className="text-white">Nabrawy</span>
                  </h1>
                  <p className="text-xl text-gray-400 max-w-lg">
                    Create stunning digital content with AI-powered creative solutions. One platform
                    for all your digital service needs.
                  </p>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 pt-4">
                  <Link href="/auth/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:opacity-90 text-white font-bold px-8 py-3">
                        Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="#features">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3"
                      >
                        Learn More
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. FEATURES SECTION */}
        <section id="features" className="relative w-full py-24 md:py-32">
          <VideoBackground src="/images/landing/videos-section.mp4" />

          <div className="container relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-20 text-center"
            >
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                Everything you need to get work done
              </h2>
              <p className="text-lg text-gray-300">
                One platform for all your digital service needs
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-5 md:grid-cols-5 max-w-6xl mx-auto"
            >
              {featureItems.map((feature, idx) => {
                const Icon = feature.icon;
                const colors = [
                  "border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 hover:from-cyan-500/15 hover:to-cyan-500/10",
                  "border-pink-500/50 bg-gradient-to-br from-pink-500/10 to-pink-500/5 hover:from-pink-500/15 hover:to-pink-500/10",
                  "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:from-purple-500/15 hover:to-purple-500/10",
                  "border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/15 hover:to-blue-500/10",
                  "border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:from-orange-500/15 hover:to-orange-500/10",
                ];
                const colorClass = colors[idx % colors.length];

                return (
                  <motion.div
                    key={feature.key}
                    variants={scaleIn}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className={`group p-6 rounded-2xl border transition-all ${colorClass}`}
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-pink-500/20">
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white capitalize mb-2">{feature.key}</h3>
                    <p className="text-xs text-gray-400">
                      Everything you need to create stunning content
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* 3. PORTFOLIO/IMAGES CAROUSEL */}
        <section id="portfolio" className="relative w-full py-24 md:py-32">
          <VideoBackground src="/images/landing/videos-images-section.mp4" />

          <div className="container relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-12"
            >
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                Stunning Creations
              </h2>
              <p className="text-lg text-gray-400">
                Discover amazing projects crafted by our team of creative professionals
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
              >
                {Array.from({ length: 12 }).map((_, idx) => (
                  <motion.div
                    key={`portfolio-${idx}`}
                    data-carousel-item
                    className="flex-shrink-0 w-80 h-64 rounded-2xl overflow-hidden border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer group"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Image
                      src={`/images/landing/${(idx % 31) + 1}.jpg`}
                      alt={`Portfolio ${idx + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </motion.div>
                ))}
              </div>

              <CarouselNav
                onPrev={() => scrollCarousel("left")}
                onNext={() => scrollCarousel("right")}
              />
            </motion.div>
          </div>
        </section>

        {/* 4. VIDEO CAROUSEL */}
        <section className="relative w-full py-24 md:py-32">
          <VideoBackground src="/images/landing/videos-images-section.mp4" />

          <div className="container relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-12"
            >
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">Featured Works</h2>
              <p className="text-lg text-gray-400">Watch our latest creative projects in action</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <motion.div
                    key={idx}
                    data-carousel-item
                    className="flex-shrink-0 w-96 h-64 rounded-2xl overflow-hidden bg-black border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <iframe
                      title={`Video ${idx}`}
                      src={`https://player.vimeo.com/video/906977043?h=1234567890&badge=0&autopause=0&player_id=0&app_id=58479&controls=1`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </motion.div>
                ))}
              </div>

              <CarouselNav
                onPrev={() => scrollCarousel("left")}
                onNext={() => scrollCarousel("right")}
              />
            </motion.div>
          </div>
        </section>

        {/* 5. STATS SECTION */}
        <section className="relative w-full py-24 md:py-32">
          <div className="container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Character with GIF */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex justify-center"
              >
                <Image
                  src="/images/nabarawy.gif"
                  alt="Nabarawy Animation"
                  width={400}
                  height={400}
                  unoptimized
                  className="w-96 h-96 object-contain drop-shadow-2xl filter saturate-110"
                />
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <h2 className="text-5xl md:text-6xl font-black text-white mb-12">By The Numbers</h2>

                <div className="grid grid-cols-2 gap-6">
                  {[
                    { num: "4.9", label: "Happy Clients", color: "from-cyan-500 to-blue-500" },
                    { num: "+500", label: "Expert Creators", color: "from-pink-500 to-purple-500" },
                    { num: "100%", label: "Quality Score", color: "from-cyan-400 to-pink-400" },
                    {
                      num: "+31",
                      label: "Portfolio Items",
                      color: "from-purple-400 to-orange-400",
                    },
                  ].map((stat, idx) => (
                    <motion.div
                      key={`stat-${idx}`}
                      variants={fadeInUp}
                      className="p-6 rounded-2xl border border-gray-700/50 bg-black/50 hover:border-cyan-500/30 hover:bg-black/70 transition-all"
                    >
                      <div
                        className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                      >
                        {stat.num}
                      </div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 6. PRICING SECTION */}
        <section id="pricing" className="relative w-full py-24 md:py-32">
          <VideoBackground src="/images/landing/videos-section.mp4" />

          <div className="container relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-16 text-center"
            >
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-gray-400">Choose the perfect plan for your needs</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto"
            >
              {loadingPackages && (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
              )}
              {!loadingPackages &&
                packages.length > 0 &&
                packages.map((pkg, idx) => {
                  const gradients = [
                    "from-cyan-500 to-blue-500",
                    "from-pink-500 to-purple-500",
                    "from-cyan-400 to-pink-400",
                    "from-purple-400 to-orange-400",
                  ];
                  const gradient = gradients[idx % gradients.length];

                  return (
                    <motion.div
                      key={pkg.id}
                      variants={scaleIn}
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className="group relative"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative bg-black border border-gray-700/60 hover:border-cyan-500/60 rounded-2xl p-8 transition-all h-full flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {getLocalizedText(pkg.name, pkg.nameI18n)}
                        </h3>
                        <p className="text-sm text-gray-400 mb-6 flex-grow">
                          {pkg.credits} Credits
                        </p>

                        <div
                          className={`w-full h-1 bg-gradient-to-r ${gradient} rounded-full mb-6`}
                        />

                        <div className="mb-6">
                          <div
                            className={`text-4xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-1`}
                          >
                            ${pkg.price}
                          </div>
                          <p className="text-xs text-gray-500">per month</p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-grow">
                          {getPackageFeatures(pkg)
                            .slice(0, 4)
                            .map((feature, featureIdx) => (
                              <li
                                key={`${pkg.id}-${featureIdx}`}
                                className="flex items-start gap-2 text-sm text-gray-400"
                              >
                                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                        </ul>

                        <Link href="/auth/register" className="w-full">
                          <Button
                            className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-bold`}
                          >
                            Get Started
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
            </motion.div>
          </div>
        </section>

        {/* 7. CTA SECTION */}
        <section className="relative w-full py-24 md:py-32">
          <div className="container relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                Ready to get started?
              </h2>
              <p className="text-lg text-gray-400 mb-10">
                Join thousands of creators using Nabrawy to bring their ideas to life
              </p>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:opacity-90 text-white font-bold px-10 py-3">
                    Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-10 py-3"
                  >
                    View Plans
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-cyan-500/20 py-8 relative z-10 bg-black/50 backdrop-blur-sm mt-12"
      >
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Image src="/images/logo.svg" alt="Nabra Logo" width={24} height={24} />
            <span className="font-bold text-white">Nabra</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Contact
            </Link>
          </div>

          <p>© 2025 Nabra. All rights reserved.</p>
        </div>
      </motion.footer>

      {/* Floating Elements */}
      <NabarawyAssistant autoShow={true} showDelay={5000} />
      <WhatsAppSupport />
    </div>
  );
}
