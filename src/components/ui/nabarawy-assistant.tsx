"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface NabarawyAssistantProps {
  readonly messages?: string[];
  readonly autoShow?: boolean;
  readonly showDelay?: number;
}

export function NabarawyAssistant({
  messages = [],
  autoShow = false,
  showDelay = 3000,
}: NabarawyAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [hasShownAuto, setHasShownAuto] = useState(false);
  const t = useTranslations("nabarawy");

  const defaultMessages = [
    t("welcome", { defaultValue: "Hi! I'm Nabarawy, your AI assistant!" }),
    t("help", { defaultValue: "How can I help you today?" }),
    t("explore", { defaultValue: "Feel free to explore our services!" }),
  ];

  const displayMessages = messages.length > 0 ? messages : defaultMessages;

  useEffect(() => {
    if (autoShow && !hasShownAuto) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShownAuto(true);
      }, showDelay);
      return () => clearTimeout(timer);
    }
  }, [autoShow, hasShownAuto, showDelay]);

  useEffect(() => {
    if (isOpen && displayMessages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % displayMessages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, displayMessages.length]);

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 end-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="relative w-16 h-16 rounded-full bg-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all p-0 overflow-hidden group"
              aria-label="Open Nabarawy Assistant"
            >
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Image
                  src="/images/nabarawy.gif"
                  alt="Nabarawy"
                  width={64}
                  height={64}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </Button>

            {/* Pulsing indicator */}
            <motion.div
              className="absolute -top-1 -end-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 end-6 z-50 w-80"
          >
            <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-background via-background to-primary/5">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary via-purple-500 to-pink-500 p-4 text-white">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative"
                  >
                    <Image
                      src="/images/nabarawy.gif"
                      alt="Nabarawy"
                      width={48}
                      height={48}
                      unoptimized
                      className="w-12 h-12 object-contain"
                    />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Nabarawy</h3>
                    <p className="text-xs opacity-90 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      {t("online", { defaultValue: "Online & Ready to Help" })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessageIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-2"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 bg-primary/10 rounded-2xl rounded-tl-none p-3">
                      <p className="text-sm leading-relaxed">
                        {displayMessages[currentMessageIndex]}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Quick Actions */}
                <div className="pt-2 space-y-2">
                  <p className="text-xs text-muted-foreground px-1">
                    {t("quickActions", { defaultValue: "Quick Actions:" })}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/#features">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 hover:bg-primary/5 hover:border-primary/30 w-full"
                      >
                        📦 {t("services", { defaultValue: "View Services" })}
                      </Button>
                    </Link>
                    <Link href="/#pricing">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 hover:bg-primary/5 hover:border-primary/30 w-full"
                      >
                        💎 {t("pricing", { defaultValue: "See Pricing" })}
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 hover:bg-primary/5 hover:border-primary/30 w-full"
                      >
                        🚀 {t("getStarted", { defaultValue: "Get Started" })}
                      </Button>
                    </Link>
                    <a href="https://wa.me/966506159409" target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 hover:bg-primary/5 hover:border-primary/30 w-full"
                      >
                        💬 {t("contact", { defaultValue: "Contact Us" })}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-muted/30 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  {t("footer", {
                    defaultValue: "Powered by Nabra AI • Always here to help",
                  })}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Simple avatar version for headers/profiles
export function NabarawyAvatar({ size = 40 }: { readonly size?: number }) {
  return (
    <motion.div
      animate={{
        y: [0, -3, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative inline-block"
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/30 to-pink-500/30 rounded-full blur-lg"
        style={{ width: size, height: size }}
      />
      <Image
        src="/images/nabarawy.gif"
        alt="Nabarawy"
        width={size}
        height={size}
        unoptimized
        className="relative z-10 object-contain"
        style={{ width: size, height: size }}
      />
    </motion.div>
  );
}
