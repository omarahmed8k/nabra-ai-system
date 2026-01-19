"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import type { ComponentType } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

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
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// Font size and weight standardization constants
const FONT_SIZES = {
  // Hero
  hero: {
    title: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
    subtitle: "text-sm sm:text-base md:text-lg",
  },
  // Section headings
  sectionTitle: {
    primary: "text-3xl sm:text-4xl md:text-5xl lg:text-5xl",
    secondary: "text-2xl sm:text-3xl md:text-4xl",
  },
  // Feature/Card titles
  cardTitle: {
    main: "text-base sm:text-lg md:text-lg",
    small: "text-sm md:text-base",
  },
  // Body text
  body: {
    large: "text-base sm:text-lg",
    normal: "text-sm sm:text-base",
    small: "text-xs sm:text-sm",
  },
} as const;

const FONT_WEIGHTS = {
  bold: "font-bold",
  black: "font-black",
  semibold: "font-semibold",
  medium: "font-medium",
  normal: "font-normal",
  light: "font-light",
} as const;

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

interface FeatureItem {
  icon: ComponentType<{ className?: string }>;
  key: FeatureKey;
}

const featureItems: FeatureItem[] = [
  {
    icon: Zap,
    key: "credit",
  },
  {
    icon: Shield,
    key: "quality",
  },
  {
    icon: Clock,
    key: "speed",
  },
  {
    icon: Star,
    key: "revisions",
  },
  {
    icon: Users,
    key: "experts",
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
    transition: { duration: 0.5 },
  },
};

// Video Background Component
const VideoBackground = ({
  src,
  loop = true,
  topShadow = false,
  bottomShadow = false,
}: {
  src: string;
  loop?: boolean;
  topShadow?: boolean;
  bottomShadow?: boolean;
}) => {
  const getShadowGradient = () => {
    if (topShadow) return "from-black/90 via-transparent to-transparent";
    if (bottomShadow) return "from-transparent via-transparent to-black/90";
    return "from-transparent via-transparent to-transparent";
  };

  const shadowGradient = getShadowGradient();

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      <video
        autoPlay
        muted
        playsInline
        loop={loop}
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className={`absolute inset-0 bg-gradient-to-b ${shadowGradient}`} />
    </div>
  );
};

// Carousel Navigation Component
const CarouselNav = ({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) => (
  <div className="flex gap-3 justify-center mt-8">
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onPrev}
      className="p-3 rounded-full bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30 hover:border-pink-500/60 transition-colors"
    >
      <ChevronLeft className="w-5 h-5 text-cyan-400" />
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="p-3 rounded-full bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30 hover:border-pink-500/60 transition-colors"
    >
      <ChevronRight className="w-5 h-5 text-cyan-400" />
    </motion.button>
  </div>
);

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations();
  const isRTL = locale === "ar";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const videoCarouselRef = useRef<HTMLDivElement>(null);
  const videoSwiperRef = useRef<any>(null);

  const { data: packagesData } = trpc.admin.getPublicPackages.useQuery(undefined, {
    enabled: true,
  });

  useEffect(() => {
    if (packagesData) {
      setPackages(packagesData);
      setLoadingPackages(false);
    }
  }, [packagesData]);

  // Stop videos when scrolling to another section
  useEffect(() => {
    const handleScroll = () => {
      if (!videoCarouselRef.current) return;

      const rect = videoCarouselRef.current.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom > 0;

      // If video carousel is not in view, pause all videos
      if (!isInView) {
        const iframes = document.querySelectorAll(".swiper-3d-video iframe");
        iframes.forEach((iframe) => {
          try {
            const target = (iframe as HTMLIFrameElement).contentWindow;
            if (target) {
              // We intentionally use '*' for Vimeo cross-origin communication
              // eslint-disable-next-line no-restricted-globals
              target.postMessage(JSON.stringify({ method: "pause" }), "*");
            }
          } catch {
            // Cross-origin error expected, silently fail
          }
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Define video carousel data with stable IDs
  const videoCarouselData = [
    { id: "video-1", url: "https://player.vimeo.com/video/1146874831" },
    { id: "video-2", url: "https://player.vimeo.com/video/1146880306" },
    { id: "video-3", url: "https://player.vimeo.com/video/1146877824" },
    { id: "video-4", url: "https://player.vimeo.com/video/1146877120" },
    { id: "video-5", url: "https://player.vimeo.com/video/1146876337" },
    { id: "video-6", url: "https://player.vimeo.com/video/1146874831" },
    { id: "video-7", url: "https://player.vimeo.com/video/1146880306" },
    { id: "video-8", url: "https://player.vimeo.com/video/1146877824" },
    { id: "video-9", url: "https://player.vimeo.com/video/1146877120" },
    { id: "video-10", url: "https://player.vimeo.com/video/1146876337" },
    { id: "video-11", url: "https://player.vimeo.com/video/1146874831" },
    { id: "video-12", url: "https://player.vimeo.com/video/1146880306" },
    { id: "video-13", url: "https://player.vimeo.com/video/1146877824" },
    { id: "video-14", url: "https://player.vimeo.com/video/1146877120" },
    { id: "video-15", url: "https://player.vimeo.com/video/1146876337" },
    { id: "video-16", url: "https://player.vimeo.com/video/1146874831" },
    { id: "video-17", url: "https://player.vimeo.com/video/1146880306" },
    { id: "video-18", url: "https://player.vimeo.com/video/1146877824" },
    { id: "video-19", url: "https://player.vimeo.com/video/1146877120" },
    { id: "video-20", url: "https://player.vimeo.com/video/1146876337" },
  ];

  return (
    <div
      className={`flex min-h-screen flex-col bg-black overflow-hidden ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-4 sm:top-6 left-0 right-0 mx-auto w-[95%] max-w-7xl z-50 rounded-full backdrop-blur-3xl bg-transparent shadow px-4 sm:px-6"
      >
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 relative z-10">
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
              <Image
                src="/images/logo.svg"
                alt="Nabra Logo"
                width={32}
                height={32}
                className="h-7 sm:h-8 w-auto"
              />
            </motion.div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {[
              { href: "#features", label: t("landing.nav.features") },
              { href: "#gallery", label: t("landing.nav.gallery") },
              { href: "#pricing", label: t("landing.nav.pricing") },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.span
                  className={`${FONT_SIZES.body.small} ${FONT_WEIGHTS.medium} text-gray-300 hover:text-pink-400 transition-colors cursor-pointer`}
                  whileHover={{ y: -2 }}
                >
                  {item.label}
                </motion.span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3 relative z-10">
            <LanguageSwitcher />
            {/* Authentication is currently disabled - uncomment to enable */}
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className={`text-gray-300 hover:text-white hover:bg-white/5 ${FONT_SIZES.body.small}`}
              >
                {t("common.buttons.signIn")}
              </Button>
            </Link>
            <Link href="/auth/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  className={`rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 text-white font-semibold ${FONT_SIZES.body.small}`}
                >
                  {t("common.buttons.getStarted")}
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* 1. HERO SECTION */}
        <section className="relative w-full min-h-screen flex items-end justify-center overflow-hidden pb-12 sm:pb-16 md:pb-20">
          <VideoBackground src="/images/landing/hero-section.mp4" bottomShadow={true} />

          <div className="container relative z-10 px-4 sm:px-6">
            <div className="flex items-end justify-center">
              {/* Centered Content */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-col items-center gap-6 sm:gap-8 text-center max-w-4xl mx-auto"
              >
                <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-6">
                  <h1 className={`${FONT_SIZES.hero.title} ${FONT_WEIGHTS.black} leading-tight`}>
                    <span className="text-white">{t("landing.hero.title")}</span>
                  </h1>
                  <p
                    className={`${FONT_SIZES.hero.subtitle} ${FONT_WEIGHTS.light} text-gray-300 max-w-2xl mx-auto`}
                  >
                    {t("landing.hero.subtitle")}
                  </p>
                </motion.div>

                <motion.div
                  variants={fadeInUp}
                  className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center w-full sm:w-auto"
                >
                  {/* Registration is currently disabled - uncomment to enable */}
                  {/* <Link href="/auth/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 text-white font-bold px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                        {t("landing.hero.startFreeTrial")}{" "}
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                      </Button>
                    </motion.div>
                  </Link> */}
                  <Link href="#features">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        className="rounded-full bg-transparent border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                      >
                        {t("landing.hero.learnMore")}
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. FEATURES SECTION */}
        <section id="features" className="relative w-full py-16 sm:py-24 md:py-32">
          <div className="h-[500px] sm:h-[750px] md:h-[1000px] absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent" />
          <VideoBackground
            src="/images/landing/videos-section.mp4"
            topShadow={true}
            bottomShadow={true}
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/90" />

          <div className="container relative z-10 pb-24 sm:pb-48 md:pb-96 px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-12 sm:mb-16 md:mb-20 text-center"
            >
              <h2
                className={`${FONT_SIZES.sectionTitle.primary} ${FONT_WEIGHTS.black} text-white mb-4 sm:mb-6`}
              >
                {t("landing.features.heading")}
                <br className="hidden sm:block" />
                <span
                  className={`${FONT_WEIGHTS.light} mt-2 sm:mt-4 block ${FONT_SIZES.body.large}`}
                >
                  {t("landing.features.subheading")}
                </span>
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 max-w-6xl mx-auto"
            >
              {featureItems.map((feature, idx) => {
                const Icon = feature.icon;
                const title = t(`landing.features.${feature.key}.title`);
                const description = t(`landing.features.${feature.key}.description`);
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
                    className={`group p-3 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all flex-1 min-w-[170px] sm:min-w-[180px] md:min-w-[200px] max-w-[220px] ${colorClass}`}
                  >
                    <div className="mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/20 to-cyan-500/20">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                    </div>
                    <h3
                      className={`${FONT_SIZES.cardTitle.small} ${FONT_WEIGHTS.bold} text-white capitalize mb-2`}
                    >
                      {title}
                    </h3>
                    <p className={`${FONT_SIZES.body.small} text-gray-400`}>{description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* 3. VIDEO CAROUSEL 3D & 4. IMAGES CAROUSEL 3D */}
        <section id="gallery" className="relative w-full py-16 sm:py-24 md:py-32 overflow-hidden">
          <div className="h-[500px] sm:h-[750px] md:h-[1000px] absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent" />
          <VideoBackground
            src="/images/landing/videos-images-section.mp4"
            topShadow={true}
            bottomShadow={true}
          />
          <div className="absolute bottom-0 left-0 right-0 h-48 sm:h-72 md:h-96 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none z-20" />

          {/* VIDEO CAROUSEL 3D */}
          <div className="relative z-10 mb-20 sm:mb-24 md:mb-32">
            <div className="container px-4 sm:px-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="mb-8 sm:mb-12 text-center"
              >
                <h2
                  className={`${FONT_SIZES.sectionTitle.primary} ${FONT_WEIGHTS.black} text-white mb-4 sm:mb-6`}
                >
                  {t("landing.gallery.videos.heading")}
                </h2>
                <p className={`${FONT_SIZES.body.normal} text-gray-400`}>
                  {t("landing.gallery.videos.subheading")}
                </p>
              </motion.div>
            </div>

            <motion.div
              ref={videoCarouselRef}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="relative px-4 sm:px-6"
            >
              {/* Left Arrow */}
              <motion.button
                onClick={() => videoSwiperRef.current?.slidePrev()}
                className="absolute -left-2 sm:left-0 md:-left-5 top-[50%] -translate-y-1/2 z-30 p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-500/50 to-cyan-500/50 backdrop-blur-md border-2 border-pink-500/70 hover:border-cyan-500/90 transition-all opacity-70 hover:opacity-100 duration-300 shadow-[0_8px_32px_rgba(236,72,153,0.3)]"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]" />
              </motion.button>

              {/* Right Arrow */}
              <motion.button
                onClick={() => videoSwiperRef.current?.slideNext()}
                className="absolute -right-2 sm:right-0 md:-right-5 top-[50%] -translate-y-1/2 z-30 p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-500/50 to-cyan-500/50 backdrop-blur-md border-2 border-pink-500/70 hover:border-cyan-500/90 transition-all opacity-70 hover:opacity-100 duration-300 shadow-[0_8px_32px_rgba(236,72,153,0.3)]"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]" />
              </motion.button>

              <Swiper
                onSwiper={(swiper) => {
                  videoSwiperRef.current = swiper;
                  setActiveVideoIndex(swiper.realIndex);
                }}
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                slidesPerView="auto"
                loop={true}
                loopAdditionalSlides={3}
                touchEventsTarget="container"
                onSlideChange={(swiper) => {
                  setActiveVideoIndex(swiper.realIndex);
                  // Pause all videos when slide changes
                  const iframes = document.querySelectorAll(".swiper-3d-video iframe");
                  iframes.forEach((iframe) => {
                    try {
                      const target = (iframe as HTMLIFrameElement).contentWindow;
                      if (target) {
                        // We intentionally use '*' for Vimeo cross-origin communication
                        // eslint-disable-next-line no-restricted-globals
                        target.postMessage(JSON.stringify({ method: "pause" }), "*");
                      }
                    } catch {
                      // Cross-origin error expected, silently fail
                    }
                  });
                }}
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 100,
                  modifier: 2.5,
                  slideShadows: false,
                }}
                modules={[EffectCoverflow]}
                className="swiper-3d-video"
              >
                {videoCarouselData.map((video, idx) => (
                  <SwiperSlide key={video.id}>
                    <div className="w-[180px] h-[320px] sm:w-[230px] sm:h-[406px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-500/40 hover:border-cyan-500/60 transition-all shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative">
                      <iframe
                        title={`Video ${idx + 1}`}
                        src={`${video.url}?badge=0&autopause=1&background=0&controls=1`}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                        style={{ pointerEvents: activeVideoIndex === idx ? "auto" : "none" }}
                      />
                      {/* Overlay to block clicks on non-active videos */}
                      {activeVideoIndex !== idx && (
                        <div
                          className="absolute inset-0 bg-transparent cursor-grabbing"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>
          </div>

          {/* IMAGES CAROUSEL 3D */}
          <div className="relative z-10">
            <div className="container px-4 sm:px-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="mb-8 sm:mb-12 text-center"
              >
                <h2
                  className={`${FONT_SIZES.sectionTitle.primary} ${FONT_WEIGHTS.black} text-white mb-4 sm:mb-6`}
                >
                  {t("landing.gallery.images.heading")}
                </h2>
                <p className={`${FONT_SIZES.body.normal} text-gray-400`}>
                  {t("landing.gallery.images.subheading")}
                </p>
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Swiper
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                slidesPerView="auto"
                loop={true}
                loopAdditionalSlides={3}
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 100,
                  modifier: 2.5,
                  slideShadows: true,
                }}
                autoplay={{
                  delay: 3500,
                  disableOnInteraction: false,
                }}
                modules={[EffectCoverflow, Autoplay]}
                className="swiper-3d-images"
              >
                {Array.from({ length: 31 }).map((_, idx) => (
                  <SwiperSlide key={`portfolio-${idx + 1}`}>
                    <div className="w-[240px] h-[315px] sm:w-[320px] sm:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-pink-500/40 hover:border-cyan-500/60 transition-all shadow-[0_20px_60px_rgba(0,0,0,0.8)] cursor-pointer group">
                      <Image
                        src={`/images/landing/${idx + 1}.jpg`}
                        alt={`Portfolio ${idx + 1}`}
                        width={400}
                        height={520}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>
          </div>
        </section>

        {/* 5. STATS SECTION */}
        <section className="relative w-full py-16 sm:py-24 md:py-32">
          <div className="container relative z-10 px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
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
                  width={600}
                  height={600}
                  unoptimized
                  className="w-64 sm:w-80 md:w-[600px] h-64 sm:h-80 md:h-[600px] object-contain drop-shadow-2xl filter saturate-110"
                />
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <h2
                  className={`${FONT_SIZES.sectionTitle.primary} ${FONT_WEIGHTS.black} text-white mb-8 sm:mb-12`}
                >
                  {t("landing.stats.heading")}
                </h2>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {[
                    {
                      num: "4.9",
                      labelKey: "landing.stats.happyClients",
                      color: "from-cyan-500 to-blue-500",
                    },
                    {
                      num: "+500",
                      labelKey: "landing.stats.expertCreators",
                      color: "from-pink-500 to-purple-500",
                    },
                    {
                      num: "100%",
                      labelKey: "landing.stats.qualityScore",
                      color: "from-cyan-400 to-pink-400",
                    },
                    {
                      num: "+31",
                      labelKey: "landing.stats.portfolioItems",
                      color: "from-purple-400 to-orange-400",
                    },
                  ].map((stat) => (
                    <motion.div
                      key={`stat-${stat.labelKey}`}
                      variants={fadeInUp}
                      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-700/50 bg-black/50 hover:border-cyan-500/30 hover:bg-black/70 transition-all"
                    >
                      <div
                        className={`text-2xl sm:text-3xl ${FONT_WEIGHTS.black} bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                      >
                        {stat.num}
                      </div>
                      <p className={`${FONT_SIZES.body.small} text-gray-400`}>{t(stat.labelKey)}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 6. PRICING SECTION */}
        <section id="pricing" className="relative w-full py-16 sm:py-24 md:py-32">
          <div className="container relative z-10 px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-12 sm:mb-16 text-center"
            >
              <h2
                className={`${FONT_SIZES.sectionTitle.primary} ${FONT_WEIGHTS.black} text-white mb-4 sm:mb-6`}
              >
                {t("landing.pricing.heading")}
              </h2>
              <p className={`${FONT_SIZES.body.normal} text-gray-400`}>
                {t("landing.pricing.subheading")}
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto"
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
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 rounded-2xl sm:rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative bg-black border border-gray-700/60 hover:border-cyan-500/60 rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all h-full flex flex-col">
                        <h3
                          className={`${FONT_SIZES.cardTitle.main} ${FONT_WEIGHTS.bold} text-white mb-2`}
                        >
                          {getLocalizedText(pkg.name, pkg.nameI18n)}
                        </h3>
                        <p className={`${FONT_SIZES.body.small} text-gray-400 mb-6 flex-grow`}>
                          {pkg.credits} {t("common.credits")}
                        </p>

                        <div
                          className={`w-full h-1 bg-gradient-to-r ${gradient} rounded-full mb-6`}
                        />

                        <div className="mb-6">
                          <div
                            className={`text-3xl sm:text-4xl ${FONT_WEIGHTS.black} bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-1`}
                          >
                            ${pkg.price}
                          </div>
                          <p className={`${FONT_SIZES.body.small} text-gray-500`}>
                            {t("landing.pricing.perMonth")}
                          </p>
                        </div>

                        <ul className="space-y-2 sm:space-y-3 mb-8 flex-grow">
                          {getPackageFeatures(pkg)
                            .slice(0, 4)
                            .map((feature, featureIdx) => (
                              <li
                                key={`${pkg.id}-${featureIdx}`}
                                className={`flex items-start gap-2 ${FONT_SIZES.body.small} text-gray-400`}
                              >
                                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                        </ul>

                        {/* Registration is currently disabled - uncomment to enable */}
                        {/* <Link href="/auth/register" className="w-full">
                          <Button
                            className={`w-full rounded-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-bold text-sm sm:text-base`}
                          >
                            {t("common.buttons.getStarted")}
                          </Button>
                        </Link> */}
                      </div>
                    </motion.div>
                  );
                })}
            </motion.div>
          </div>
        </section>

        {/* 7. CTA SECTION */}
        <section className="relative w-full py-16 sm:py-24 md:py-32">
          <div className="container relative z-10 px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="text-center max-w-2xl mx-auto"
            >
              <h2
                className={`${FONT_SIZES.sectionTitle.primary} ${FONT_WEIGHTS.black} text-white mb-4 sm:mb-6`}
              >
                {t("landing.cta.heading")}
              </h2>
              <p className={`${FONT_SIZES.body.normal} text-gray-400 mb-8 sm:mb-10`}>
                {t("landing.cta.subheading")}
              </p>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
              >
                {/* Registration is currently disabled - uncomment to enable */}
                {/* <Link href="/auth/register">
                  <Button className="rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 text-white font-bold px-8 sm:px-10 py-2 sm:py-3 text-sm sm:text-base">
                    {t("landing.cta.startTrial")}{" "}
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </Link> */}
                <Link href="#pricing">
                  <Button
                    variant="outline"
                    className="rounded-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-8 sm:px-10 py-2 sm:py-3 text-sm sm:text-base"
                  >
                    {t("landing.cta.viewPlans")}
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
        className="border-t border-pink-500/20 py-6 sm:py-8 relative z-10 bg-black/50 backdrop-blur-sm mt-12"
      >
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <Image src="/images/logo.svg" alt="Nabra Logo" width={120} height={24} />
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="#"
              className="hover:text-pink-400 transition-colors text-xs sm:text-sm text-gray-400"
            >
              {t("common.footer.privacy")}
            </Link>
            <Link
              href="#"
              className="hover:text-pink-400 transition-colors text-xs sm:text-sm text-gray-400"
            >
              {t("common.footer.terms")}
            </Link>
            <Link
              href="#"
              className="hover:text-pink-400 transition-colors text-xs sm:text-sm text-gray-400"
            >
              {t("common.footer.contact")}
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-gray-400">{t("common.footer.copyright")}</p>
        </div>
      </motion.footer>

      {/* Floating Elements */}
      <NabarawyAssistant autoShow={true} showDelay={5000} />
      <WhatsAppSupport />
    </div>
  );
}
