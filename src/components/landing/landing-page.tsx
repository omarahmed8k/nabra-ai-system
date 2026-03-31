"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useRef, useMemo } from "react";
import type { ComponentType } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WhatsAppSupport } from "@/components/ui/whatsapp-support";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import {
  Check,
  Zap,
  Shield,
  Clock,
  Star,
  Users,
  Loader2,
  Plus,
  ArrowUp,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { setPendingRequestDescription } from "@/lib/landing-request-draft";

// Typography (Lovable-style: large hero, restrained body)
const FONT_SIZES = {
  hero: {
    title: "text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl",
    subtitle: "text-base sm:text-lg text-muted-foreground",
  },
  sectionTitle: {
    primary: "text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl",
    secondary: "text-2xl sm:text-3xl md:text-4xl",
  },
  cardTitle: {
    main: "text-base sm:text-lg",
    small: "text-sm md:text-base",
  },
  body: {
    large: "text-base sm:text-lg",
    normal: "text-sm sm:text-base text-muted-foreground",
    small: "text-xs sm:text-sm text-muted-foreground",
  },
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

const MEET_STEP_KEYS = ["start", "work", "ship"] as const;

const GALLERY_VIDEO_INDICES = [1, 2, 3, 4, 5, 6] as const;

const GALLERY_IMAGE_INDICES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function getVideoCardsPerView(width: number) {
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 1;
}

function getVideoDragDelta(offsetX: number, threshold: number) {
  if (offsetX <= -threshold) return 1;
  if (offsetX >= threshold) return -1;
  return 0;
}

function getVideoPlaybackLabel(locale: string, isPlaying: boolean) {
  if (isPlaying) {
    return locale === "ar" ? "إيقاف الفيديو" : "Pause video";
  }
  return locale === "ar" ? "تشغيل الفيديو" : "Play video";
}

function getVideoMuteLabel(locale: string, isMuted: boolean) {
  if (isMuted) {
    return locale === "ar" ? "إلغاء كتم الصوت" : "Unmute";
  }
  return locale === "ar" ? "كتم الصوت" : "Mute";
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations();
  const isRTL = locale === "ar";
  const textDirectionClass = isRTL ? "text-right" : "text-left";
  const replyScrollPaddingClass = isRTL ? "pl-1" : "pr-1";
  const typingCaretSpacingClass = isRTL ? "mr-0.5" : "ml-0.5";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [heroPrompt, setHeroPrompt] = useState("");
  const [heroReply, setHeroReply] = useState("");
  const [heroLoadingReply, setHeroLoadingReply] = useState(false);
  const [heroTypingReply, setHeroTypingReply] = useState(false);
  const [promptRotateIndex, setPromptRotateIndex] = useState(0);
  const [videoCardsPerView, setVideoCardsPerView] = useState(1);
  const [videoCardWidth, setVideoCardWidth] = useState(0);
  const [videoSlideIndex, setVideoSlideIndex] = useState(0);
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [videoPlayingState, setVideoPlayingState] = useState<Record<number, boolean>>({});
  const [videoMutedState, setVideoMutedState] = useState<Record<number, boolean>>({});
  const [videoProgressState, setVideoProgressState] = useState<Record<number, number>>({});
  const videoCarouselViewportRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const videoDragReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroReplyScrollRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const promptRotations = useMemo(() => {
    const staticExamples = [
      t("landing.hero.promptRotate0"),
      t("landing.hero.promptRotate1"),
      t("landing.hero.promptRotate2"),
      t("landing.hero.promptRotate3"),
      t("landing.hero.promptRotate4"),
      t("landing.hero.promptRotate5"),
      t("landing.hero.promptRotate6"),
    ];
    return staticExamples;
  }, [t]);

  useEffect(() => {
    if (heroPrompt.length > 0) return;
    const len = promptRotations.length;
    if (len === 0) return;
    const id = setInterval(() => {
      setPromptRotateIndex((i) => (i + 1) % len);
    }, 4200);
    return () => clearInterval(id);
  }, [heroPrompt, promptRotations.length]);

  useEffect(() => {
    const viewport = videoCarouselViewportRef.current;
    if (!viewport) return;

    const updateVideoLayout = () => {
      const width = viewport.clientWidth;
      const cardsPerView = getVideoCardsPerView(width);

      setVideoCardsPerView(cardsPerView);
      setVideoCardWidth(width > 0 ? width / cardsPerView : 0);
    };

    updateVideoLayout();

    const resizeObserver = new ResizeObserver(() => {
      updateVideoLayout();
    });

    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const maxIndex = Math.max(0, GALLERY_VIDEO_INDICES.length - videoCardsPerView);
    setVideoSlideIndex((prev) => Math.min(prev, maxIndex));
  }, [videoCardsPerView]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      if (videoDragReleaseTimerRef.current) {
        clearTimeout(videoDragReleaseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const replyLength = heroReply.length;
    if (replyLength === 0) return;
    if (!heroReplyScrollRef.current) return;
    heroReplyScrollRef.current.scrollTop = heroReplyScrollRef.current.scrollHeight;
  }, [heroReply]);

  const startTypingReply = (fullReply: string) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setHeroReply("");
    setHeroTypingReply(true);

    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      i += 1;
      setHeroReply(fullReply.slice(0, i));

      if (i >= fullReply.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setHeroTypingReply(false);
      }
    }, 16);
  };

  const renderReplyWithLinks = (text: string) => {
    const nodes: React.ReactNode[] = [];
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let lastIndex = 0;
    for (;;) {
      const match = regex.exec(text);
      if (!match) break;

      const [fullMatch, label, href] = match;
      const start = match.index;

      if (start > lastIndex) {
        nodes.push(text.slice(lastIndex, start));
      }

      nodes.push(
        <a
          key={`hero-link-${start}-${href}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
        >
          {label}
        </a>
      );

      lastIndex = start + fullMatch.length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes;
  };

  const handleHeroSubmit = async () => {
    const text = heroPrompt.trim();
    if (!text || heroLoadingReply) return;

    setPendingRequestDescription(text);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setHeroPrompt("");
    setHeroReply("");
    setHeroTypingReply(false);
    setHeroLoadingReply(true);

    try {
      const response = await fetch("/api/landing/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          locale,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || "Chat request failed");
      }

      startTypingReply(data.reply);
    } catch (error) {
      toast.error(
        locale === "ar"
          ? "تعذر توليد الرد الآن. حاول مرة أخرى."
          : "Could not generate a reply right now. Please try again."
      );
      console.error("Landing chat error:", error);
    } finally {
      setHeroLoadingReply(false);
    }
  };

  const maxVideoSlideIndex = Math.max(0, GALLERY_VIDEO_INDICES.length - videoCardsPerView);

  const shiftVideoSlides = (delta: number) => {
    const span = maxVideoSlideIndex + 1;
    if (span <= 1) {
      setVideoSlideIndex(0);
      return;
    }

    setVideoSlideIndex((prev) => {
      const next = prev + delta;
      return ((next % span) + span) % span;
    });
  };

  const toggleVideoPlayback = (idx: number) => {
    if (isVideoDragging) return;

    const target = videoRefs.current[idx];
    if (!target) return;

    if (target.paused) {
      void target.play();
      return;
    }

    target.pause();
  };

  const toggleVideoMute = (idx: number) => {
    const target = videoRefs.current[idx];
    if (!target) return;

    target.muted = !target.muted;
    setVideoMutedState((prev) => ({ ...prev, [idx]: target.muted }));
  };

  const seekVideo = (idx: number, progressValue: number) => {
    const target = videoRefs.current[idx];
    if (!target || !Number.isFinite(target.duration) || target.duration <= 0) return;

    target.currentTime = (progressValue / 100) * target.duration;
    setVideoProgressState((prev) => ({ ...prev, [idx]: progressValue }));
  };

  return (
    <div
      className={`flex min-h-screen flex-col overflow-hidden bg-background ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Brand color ambience across landing */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#824d7c]/20 blur-3xl" />
        <div className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-[#5db9ba]/18 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-160px] h-[640px] w-[640px] rounded-full bg-[#5db9ba]/10 blur-3xl" />
      </div>

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl"
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#5db9ba]/45 to-transparent" />
        <div className="mx-auto flex h-30 max-w-[1400px] items-center justify-between px-4 sm:h-30 sm:px-6 lg:px-10">
          <Link href="/" className="relative z-10 flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Nabra Logo"
              width={120}
              height={120}
              className="h-20 w-auto sm:h-24"
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex lg:gap-10">
            {[
              { href: "#features", label: t("landing.nav.features") },
              { href: "#gallery", label: t("landing.nav.gallery") },
              { href: "#pricing", label: t("landing.nav.pricing") },
              { href: "/forms/client", label: t("landing.nav.clientForm") },
              { href: "/forms/provider", label: t("landing.nav.providerForm") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="relative">
                  {item.label}
                  <span
                    className={`absolute -bottom-2 h-px w-full scale-x-0 bg-gradient-to-r from-[#5db9ba] to-[#824d7c] transition-transform duration-300 group-hover:scale-x-100 ${isRTL ? "right-0 origin-right" : "left-0 origin-left"}`}
                  />
                </span>
              </Link>
            ))}
          </nav>

          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md border-border bg-transparent px-4 text-sm font-medium text-foreground hover:bg-muted/50"
              >
                {t("common.buttons.signIn")}
              </Button>
            </Link>
            {/*
            <Link href="/auth/register">
              <Button
                size="sm"
                className="h-9 rounded-md bg-gradient-to-r from-[#824d7c] to-[#5db9ba] px-4 text-sm font-medium text-white shadow-[0_10px_30px_rgba(93,185,186,0.15)] transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_14px_40px_rgba(130,77,124,0.18)]"
              >
                {t("common.buttons.getStarted")}
              </Button>
            </Link>
            */}
          </div>
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* Hero — Lovable-style: headline + prompt shell */}
        <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-10">
          <div className="pointer-events-none absolute inset-x-0 top-[-24%] h-[58%] bg-[radial-gradient(ellipse_65%_58%_at_50%_0%,rgba(8,8,10,0.95),rgba(8,8,10,0.68)_50%,transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.06),transparent)]" />
          <div className="pointer-events-none absolute left-[-18%] top-[52%] h-[26rem] w-[26rem] rounded-full bg-[#824d7c]/35 blur-3xl sm:h-[34rem] sm:w-[34rem]" />
          <div className="pointer-events-none absolute right-[-20%] top-[46%] h-[24rem] w-[24rem] rounded-full bg-[#5db9ba]/30 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
          <div className="pointer-events-none absolute inset-x-0 -bottom-40 h-[72%] bg-[radial-gradient(ellipse_75%_56%_at_50%_100%,rgba(130,77,124,0.28),rgba(93,185,186,0.19)_44%,transparent_76%)]" />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 max-w-md text-sm text-muted-foreground"
            >
              {t("landing.hero.socialProof")}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`${FONT_SIZES.hero.title} text-foreground`}
            >
              <span className="inline-flex items-center justify-center gap-3 sm:gap-4">
                <span className="relative h-14 w-14 sm:h-28 sm:w-28">
                  <Image
                    src="/images/logo.png"
                    alt=""
                    fill
                    sizes="(max-width: 640px) 3.5rem, 7rem"
                    className="object-contain drop-shadow-[0_10px_30px_rgba(130,77,124,0.35)]"
                    aria-hidden="true"
                  />
                </span>
                <span>{t("landing.hero.title")}</span>
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`mt-5 max-w-xl whitespace-pre-line ${FONT_SIZES.hero.subtitle}`}
            >
              {t("landing.hero.subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-10 w-full max-w-5xl rounded-2xl border border-border bg-card/95 p-3 shadow-[0_20px_80px_rgba(130,77,124,0.25),0_14px_56px_rgba(93,185,186,0.18),0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm"
            >
              <div className="relative min-h-[5.5rem]">
                <textarea
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  placeholder=" "
                  rows={3}
                  className={`relative z-[1] w-full resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-transparent focus:outline-none focus:ring-0 ${textDirectionClass}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleHeroSubmit();
                    }
                  }}
                  aria-label={t("landing.hero.promptPlaceholder")}
                />
                {!heroPrompt && promptRotations.length > 0 && (
                  <div
                    className={`pointer-events-none absolute inset-0 z-0 flex items-start px-3 py-2 ${textDirectionClass}`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={promptRotateIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35 }}
                        className="line-clamp-3 text-sm text-muted-foreground"
                      >
                        {promptRotations[promptRotateIndex % promptRotations.length]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border px-2 pb-1 pt-2">
                <div className="group relative">
                  <button
                    type="button"
                    disabled
                    aria-disabled
                    className="cursor-not-allowed rounded-full p-2 text-muted-foreground opacity-50"
                    aria-label={t("landing.hero.uploadTooltip")}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-center text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  >
                    {t("landing.hero.uploadTooltip")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="inline-flex rounded-full p-2 text-muted-foreground"
                    aria-hidden="true"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleHeroSubmit()}
                    disabled={heroLoadingReply || !heroPrompt.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#824d7c] to-[#5db9ba] text-white shadow-[0_8px_24px_rgba(130,77,124,0.35)] transition-all hover:scale-[1.03] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                    aria-label={t("common.buttons.getStarted")}
                  >
                    {heroLoadingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {(heroLoadingReply || heroReply || heroTypingReply) && (
                <div
                  className={`mt-2 rounded-xl border border-border bg-muted/30 px-4 py-3 ${textDirectionClass}`}
                >
                  <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {locale === "ar" ? "رد نبراوي" : "Nabarawy reply"}
                  </p>
                  {heroLoadingReply ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{locale === "ar" ? "جاري التفكير..." : "Thinking..."}</span>
                    </div>
                  ) : (
                    <div
                      ref={heroReplyScrollRef}
                      className={`max-h-56 overflow-y-auto ${replyScrollPaddingClass}`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                        {renderReplyWithLinks(heroReply)}
                        {heroTypingReply ? (
                          <span
                            className={`${typingCaretSpacingClass} inline-block animate-pulse text-muted-foreground`}
                          >
                            |
                          </span>
                        ) : null}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
            <p className="mt-4 max-w-md text-xs text-muted-foreground">
              {t("landing.hero.promptHint")}
            </p>
          </div>
        </section>

        {/* Client / Provider forms (CTA section) */}
        <section className="relative w-full border-t border-border bg-background py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/55 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(93,185,186,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(130,77,124,0.10),transparent_55%)]" />

          <div className="container relative z-10 px-4 sm:px-6">
            <div className="mx-auto max-w-5xl text-center">
              <h2 className={`${FONT_SIZES.sectionTitle.primary} mb-4 text-foreground sm:mb-6`}>
                {t("landing.forms.heading")}
              </h2>
              <p className={FONT_SIZES.body.normal}>{t("landing.forms.subheading")}</p>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5">
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted/30 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_90px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5db9ba]/55 to-transparent opacity-70" />
                <div className="pointer-events-none absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#5db9ba]/12 via-transparent to-[#824d7c]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="flex items-start gap-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                    <Image src="/images/logo.png" alt="" fill className="object-contain p-2" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("landing.forms.client.title")}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("landing.forms.client.description")}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/forms/client">
                    <Button className="h-10 rounded-md bg-gradient-to-r from-[#824d7c] to-[#5db9ba] px-5 text-sm font-medium text-white transition-all hover:opacity-95">
                      {t("landing.forms.client.cta")}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted/30 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_90px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#824d7c]/55 to-transparent opacity-70" />
                <div className="pointer-events-none absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#824d7c]/12 via-transparent to-[#5db9ba]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="flex items-start gap-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                    <Image src="/images/logo.png" alt="" fill className="object-contain p-2" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("landing.forms.provider.title")}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("landing.forms.provider.description")}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/forms/provider">
                    <Button
                      variant="outline"
                      className="h-10 rounded-md border-border bg-transparent px-5 text-sm font-medium text-foreground hover:bg-muted/50"
                    >
                      {t("landing.forms.provider.cta")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meet — three steps (Lovable “Meet Lovable” pattern) */}
        <section className="relative border-t border-border bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight text-foreground sm:mb-14 sm:text-4xl">
              {t("landing.meet.heading")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              {MEET_STEP_KEYS.map((key) => (
                <motion.div
                  key={key}
                  className="group relative rounded-2xl border border-border bg-muted/30 p-5 sm:p-6"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#824d7c]/55 to-transparent opacity-70" />
                  <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-[#824d7c]/10 via-transparent to-[#5db9ba]/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.35)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <h3 className="mb-2 text-base font-medium text-foreground">
                    {t(`landing.meet.steps.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.meet.steps.${key}.description`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="relative w-full border-t border-border py-16 sm:py-24 md:py-32"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(130,77,124,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(93,185,186,0.09),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/55 to-transparent" />
          <div className="container relative z-10 px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-12 sm:mb-16 md:mb-20 text-center"
            >
              <h2 className={`${FONT_SIZES.sectionTitle.primary} mb-4 text-foreground sm:mb-6`}>
                {t("landing.features.heading")}
                <br className="hidden sm:block" />
                <span
                  className={`mt-2 block font-normal text-muted-foreground sm:mt-4 ${FONT_SIZES.body.large}`}
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
              {featureItems.map((feature) => {
                const Icon = feature.icon;
                const title = t(`landing.features.${feature.key}.title`);
                const description = t(`landing.features.${feature.key}.description`);

                return (
                  <motion.div
                    key={feature.key}
                    variants={scaleIn}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                    className="group relative flex min-w-[170px] max-w-[220px] flex-1 flex-col rounded-2xl border border-border bg-muted/30 p-3 transition-colors hover:border-primary/40 sm:min-w-[180px] sm:p-4 md:min-w-[200px]"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5db9ba]/50 to-transparent opacity-60" />
                    <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-[#5db9ba]/10 via-transparent to-[#824d7c]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_18px_70px_rgba(0,0,0,0.45)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#824d7c]/25 to-[#5db9ba]/20 sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 text-foreground/90 transition-transform duration-300 group-hover:scale-110 sm:h-6 sm:w-6" />
                    </div>
                    <h3
                      className={`${FONT_SIZES.cardTitle.small} mb-2 font-medium capitalize text-foreground`}
                    >
                      {title}
                    </h3>
                    <p className={`${FONT_SIZES.body.small} text-muted-foreground`}>
                      {description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Gallery: looping draggable videos + 8 images */}
        <section
          id="gallery"
          className="relative w-full overflow-hidden border-t border-border bg-background py-16 sm:py-24 md:py-32"
        >
          <div className="container px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-8 text-center sm:mb-12"
            >
              <h2 className={`${FONT_SIZES.sectionTitle.primary} mb-4 text-foreground sm:mb-6`}>
                {t("landing.gallery.videos.heading")}
              </h2>
              <p className={FONT_SIZES.body.normal}>{t("landing.gallery.videos.subheading")}</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mx-auto w-full"
            >
              <div className="mb-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => shiftVideoSlides(-1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/20 text-foreground transition hover:bg-muted/60"
                  aria-label={locale === "ar" ? "السابق" : "Previous"}
                >
                  {isRTL ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => shiftVideoSlides(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/20 text-foreground transition hover:bg-muted/60"
                  aria-label={locale === "ar" ? "التالي" : "Next"}
                >
                  {isRTL ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div ref={videoCarouselViewportRef} className="overflow-hidden" dir="ltr">
                <motion.div
                  className="flex -mx-2 cursor-grab active:cursor-grabbing"
                  drag="x"
                  dragElastic={0.04}
                  animate={{ x: -(videoSlideIndex * videoCardWidth) }}
                  transition={{ type: "spring", stiffness: 300, damping: 34 }}
                  onDragStart={() => {
                    setIsVideoDragging(true);
                  }}
                  onDragEnd={(_event, info) => {
                    const threshold = Math.max(40, videoCardWidth * 0.12);

                    const dragDelta = getVideoDragDelta(info.offset.x, threshold);
                    if (dragDelta !== 0) {
                      shiftVideoSlides(dragDelta);
                    }

                    if (videoDragReleaseTimerRef.current) {
                      clearTimeout(videoDragReleaseTimerRef.current);
                    }
                    videoDragReleaseTimerRef.current = setTimeout(() => {
                      setIsVideoDragging(false);
                      videoDragReleaseTimerRef.current = null;
                    }, 140);
                  }}
                >
                  {GALLERY_VIDEO_INDICES.map((idx) => (
                    <div
                      key={`landing-video-${idx}`}
                      className="shrink-0 px-2"
                      style={{ width: videoCardWidth > 0 ? `${videoCardWidth}px` : undefined }}
                    >
                      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card sm:rounded-3xl">
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_20%,rgba(93,185,186,0.16),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(130,77,124,0.14),transparent_55%)]" />
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video
                          className="aspect-[9/16] w-full object-cover"
                          ref={(el) => {
                            videoRefs.current[idx] = el;
                          }}
                          playsInline
                          muted={videoMutedState[idx] ?? true}
                          preload="metadata"
                          onClick={() => {
                            toggleVideoPlayback(idx);
                          }}
                          onLoadedMetadata={(event) => {
                            const target = event.currentTarget;
                            setVideoMutedState((prev) => ({ ...prev, [idx]: target.muted }));
                            setVideoProgressState((prev) => ({ ...prev, [idx]: 0 }));
                          }}
                          onPlay={() => {
                            setVideoPlayingState((prev) => ({ ...prev, [idx]: true }));
                          }}
                          onPause={() => {
                            setVideoPlayingState((prev) => ({ ...prev, [idx]: false }));
                          }}
                          onTimeUpdate={(event) => {
                            const target = event.currentTarget;
                            if (!Number.isFinite(target.duration) || target.duration <= 0) return;
                            const nextProgress = (target.currentTime / target.duration) * 100;
                            setVideoProgressState((prev) => ({ ...prev, [idx]: nextProgress }));
                          }}
                        >
                          <source src={`/images/landing/${idx}.mp4`} type="video/mp4" />
                        </video>

                        <div
                          className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-12"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={0.1}
                              value={videoProgressState[idx] ?? 0}
                              onChange={(event) => {
                                seekVideo(idx, Number(event.target.value));
                              }}
                              className="h-1 w-full cursor-pointer appearance-none bg-transparent accent-[#5db9ba]"
                              aria-label={locale === "ar" ? "تقدم الفيديو" : "Video progress"}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                toggleVideoPlayback(idx);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                              aria-label={getVideoPlaybackLabel(
                                locale,
                                videoPlayingState[idx] ?? false
                              )}
                            >
                              {videoPlayingState[idx] ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                toggleVideoMute(idx);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                              aria-label={getVideoMuteLabel(locale, videoMutedState[idx] ?? true)}
                            >
                              {(videoMutedState[idx] ?? true) ? (
                                <VolumeX className="h-4 w-4" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="container relative z-10 mt-16 px-4 sm:mt-20 sm:px-6 md:mt-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-8 text-center sm:mb-12"
            >
              <h2 className={`${FONT_SIZES.sectionTitle.primary} mb-4 text-foreground sm:mb-6`}>
                {t("landing.gallery.images.heading")}
              </h2>
              <p className={FONT_SIZES.body.normal}>{t("landing.gallery.images.subheading")}</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
            >
              {GALLERY_IMAGE_INDICES.map((n) => (
                <div
                  key={n}
                  className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-border transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_18px_70px_rgba(0,0,0,0.55)] sm:rounded-xl"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[linear-gradient(135deg,rgba(130,77,124,0.18),transparent_45%),linear-gradient(315deg,rgba(93,185,186,0.16),transparent_45%)]" />
                  <Image
                    src={`/images/landing/${n}.jpg`}
                    alt={`Portfolio ${n}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats — Lovable “in numbers” tone */}
        <section className="relative w-full border-t border-border py-16 sm:py-24 md:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(130,77,124,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(93,185,186,0.09),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/55 to-transparent" />
          <div className="container relative z-10 px-4 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2">
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
                <p className="mb-3 text-sm text-muted-foreground">
                  {t("landing.stats.subheading")}
                </p>
                <h2 className={`${FONT_SIZES.sectionTitle.primary} mb-8 text-foreground sm:mb-12`}>
                  {t("landing.stats.heading")}
                </h2>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {[
                    {
                      num: "4.9",
                      labelKey: "landing.stats.happyClients",
                    },
                    {
                      num: "+500",
                      labelKey: "landing.stats.expertCreators",
                    },
                    {
                      num: "100%",
                      labelKey: "landing.stats.qualityScore",
                    },
                    {
                      num: "+31",
                      labelKey: "landing.stats.portfolioItems",
                    },
                  ].map((stat) => (
                    <motion.div
                      key={`stat-${stat.labelKey}`}
                      variants={fadeInUp}
                      className="group relative rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:border-primary/40 sm:rounded-3xl sm:p-6"
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#824d7c]/55 to-transparent opacity-60" />
                      <div className="pointer-events-none absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#5db9ba]/10 via-transparent to-[#824d7c]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="mb-2 text-2xl font-semibold tracking-tight bg-gradient-to-r from-[#5db9ba] to-[#824d7c] bg-clip-text text-transparent sm:text-3xl">
                        {stat.num}
                      </div>
                      <p className={`${FONT_SIZES.body.small}`}>{t(stat.labelKey)}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="relative w-full border-t border-border py-16 sm:py-24 md:py-32"
        >
          <div className="container relative z-10 px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="mb-12 sm:mb-16 text-center"
            >
              <h2 className={`${FONT_SIZES.sectionTitle.primary} mb-4 text-foreground sm:mb-6`}>
                {t("landing.pricing.heading")}
              </h2>
              <p className={FONT_SIZES.body.normal}>{t("landing.pricing.subheading")}</p>
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
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loadingPackages &&
                packages.length > 0 &&
                packages.map((pkg) => {
                  return (
                    <motion.div
                      key={pkg.id}
                      variants={scaleIn}
                      whileHover={{ y: -4, transition: { duration: 0.25 } }}
                      className="group relative"
                    >
                      <div className="relative flex h-full flex-col rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_22px_90px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-8">
                        <h3
                          className={`${FONT_SIZES.cardTitle.main} mb-2 font-semibold text-foreground`}
                        >
                          {getLocalizedText(pkg.name, pkg.nameI18n)}
                        </h3>
                        <p
                          className={`${FONT_SIZES.body.small} mb-6 flex-grow text-muted-foreground`}
                        >
                          {pkg.credits} {t("common.credits")}
                        </p>

                        <div className="mb-6 h-px w-full bg-gradient-to-r from-[#824d7c]/35 via-white/10 to-[#5db9ba]/35" />

                        <div className="mb-6">
                          <div className="mb-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            ${pkg.price}
                          </div>
                          <p className={`${FONT_SIZES.body.small} text-muted-foreground`}>
                            {t("landing.pricing.perMonth")}
                          </p>
                        </div>

                        <ul className="space-y-2 sm:space-y-3 mb-8 flex-grow">
                          {getPackageFeatures(pkg)
                            .slice(0, 4)
                            .map((feature, featureIdx) => (
                              <li
                                key={`${pkg.id}-${featureIdx}`}
                                className={`flex items-start gap-2 ${FONT_SIZES.body.small} text-muted-foreground`}
                              >
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
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

        {/* CTA — Lovable-style closing band */}
        <section className="relative w-full border-t border-border py-16 sm:py-24 md:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(130,77,124,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(93,185,186,0.09),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/55 to-transparent" />
          <div className="container relative z-10 mx-auto max-w-2xl px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="text-center"
            >
              <h2 className={`${FONT_SIZES.sectionTitle.primary} mb-4 text-foreground sm:mb-6`}>
                {t("landing.cta.heading")}
              </h2>
              <p className={`${FONT_SIZES.body.normal} mb-8 sm:mb-10`}>
                {t("landing.cta.subheading")}
              </p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4"
              >
                {/*
                <Link href="/auth/register">
                  <Button className="h-11 rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-zinc-200 sm:px-10">
                    {t("common.buttons.getStarted")}
                  </Button>
                </Link>
                */}
                <Link href="#pricing">
                  <Button
                    variant="outline"
                    className="h-11 rounded-md border-border bg-transparent px-8 text-sm font-medium text-foreground hover:bg-muted/50 sm:px-10"
                  >
                    {t("landing.cta.viewPlans")}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <motion.footer
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="relative z-10 border-t border-border bg-background py-10 sm:py-12"
      >
        <div className="container flex flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Nabra Logo" width={120} height={24} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="transition-colors hover:text-foreground">
              {t("common.footer.privacy")}
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              {t("common.footer.terms")}
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              {t("common.footer.contact")}
            </Link>
          </div>

          <p className="text-xs text-muted-foreground sm:text-sm">{t("common.footer.copyright")}</p>
        </div>
      </motion.footer>

      <WhatsAppSupport />
    </div>
  );
}
