"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CAROUSEL_IMAGES = Array.from({ length: 31 }, (_, i) => ({
  id: i + 1,
  src: `/images/landing/${i + 1}.jpg`,
  alt: `Portfolio image ${i + 1}`,
}));

const VISIBLE_SLIDES = 3;

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const getSlideIndex = (offset: number) =>
    (currentIndex + offset + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length;

  const paginate = (direction: number) => {
    setCurrentIndex((prev) => (prev + direction + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
    setIsAutoplay(false);
  };

  useEffect(() => {
    if (!isAutoplay || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoplay, isHovered]);

  useEffect(() => {
    if (!isHovered) {
      const timer = setTimeout(() => setIsAutoplay(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  const slideVariants = {
    center: {
      zIndex: 5,
      x: 0,
      scale: 1,
      opacity: 1,
      rotateY: 0,
    },
    left: {
      zIndex: 3,
      x: "-120%",
      scale: 0.7,
      opacity: 0.5,
      rotateY: 45,
    },
    right: {
      zIndex: 1,
      x: "120%",
      scale: 0.5,
      opacity: 0.3,
      rotateY: -45,
    },
  };

  const getSlidePosition = (index: number) => {
    const diff = (index - currentIndex + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length;
    if (diff === 0) return "center";
    if (diff === 1) return "right";
    if (diff === CAROUSEL_IMAGES.length - 1) return "left";
    return "right";
  };

  const getAnimatePosition = (pos: string): "center" | "left" | "right" => {
    if (pos === "center") return "center";
    if (pos === "left") return "left";
    return "right";
  };

  return (
    <section
      aria-label="Portfolio Showcase Carousel"
      className="w-full py-20 bg-gradient-to-b from-background via-background to-muted/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container max-w-7xl">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block mb-4"
          >
            <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <p className="text-sm font-semibold text-primary">✨ Portfolio Showcase</p>
            </div>
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="block mb-2">Stunning Work</span>
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              From Our Creators
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore exceptional projects completed by our talented network of designers, developers,
            and content creators
          </p>
        </motion.div>

        {/* Main Carousel Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full"
        >
          {/* 3D Carousel Container */}
          <div className="relative h-96 md:h-[500px] perspective">
            {/* Blur Background Slides */}
            <AnimatePresence mode="wait">
              {CAROUSEL_IMAGES.map((image, idx) => {
                const position = getSlidePosition(idx);
                const isVisible =
                  position === "center" ||
                  position === "left" ||
                  (position === "right" && idx !== getSlideIndex(2));

                if (!isVisible) return null;

                return (
                  <motion.div
                    key={`slide-${image.id}`}
                    custom={position}
                    variants={slideVariants}
                    initial="right"
                    animate={getAnimatePosition(position)}
                    transition={{
                      type: "spring" as const,
                      stiffness: 300,
                      damping: 40,
                      mass: 1,
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ perspective: "1000px" }}
                  >
                    {/* Card Container */}
                    <motion.div
                      className="relative w-full h-full max-w-md md:max-w-xl rounded-3xl overflow-hidden shadow-2xl"
                      whileHover={position === "center" ? { y: -10 } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Image */}
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        priority={position === "center"}
                        sizes={
                          position === "center"
                            ? "(max-width: 768px) 90vw, 600px"
                            : "(max-width: 768px) 60vw, 400px"
                        }
                      />

                      {/* Animated Gradient Overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
                        animate={
                          position === "center" ? { opacity: [0.5, 0.7, 0.5] } : { opacity: 0.3 }
                        }
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                        }}
                      />

                      {/* Image Number Badge */}
                      {position === "center" && (
                        <motion.div
                          className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-xl px-4 py-2 rounded-full border border-white/30"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <p className="text-white font-semibold text-sm">
                            {image.id} / {CAROUSEL_IMAGES.length}
                          </p>
                        </motion.div>
                      )}

                      {/* Shine Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{
                          x: ["100%", "-100%"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-8 z-20 pointer-events-none">
              <motion.button
                onClick={() => paginate(-1)}
                className="pointer-events-auto group relative w-14 h-14 bg-gradient-to-br from-primary/80 to-primary rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 hover:from-primary hover:to-primary/80 transition-all shadow-lg hover:shadow-primary/50"
                whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(var(--primary), 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-6 h-6 text-white group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              <motion.button
                onClick={() => paginate(1)}
                className="pointer-events-auto group relative w-14 h-14 bg-gradient-to-br from-primary/80 to-primary rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 hover:from-primary hover:to-primary/80 transition-all shadow-lg hover:shadow-primary/50"
                whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(var(--primary), 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="w-6 h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
              </motion.button>
            </div>
          </div>

          {/* Interactive Dot Navigation */}
          <motion.div
            className="flex justify-center gap-2 mt-12 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {CAROUSEL_IMAGES.map((image) => (
              <motion.button
                key={`dot-nav-${image.id}`}
                onClick={() => {
                  setCurrentIndex(image.id - 1);
                  setIsAutoplay(false);
                }}
                className={`relative rounded-full transition-all ${
                  currentIndex === image.id - 1
                    ? "bg-gradient-to-r from-primary to-purple-500 w-8 h-2.5"
                    : "bg-primary/20 w-2 h-2 hover:bg-primary/40"
                }`}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
              >
                {currentIndex === image.id - 1 && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30 blur-lg"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Autoplay Indicator */}
          <motion.div className="flex justify-center mt-6">
            {isAutoplay && !isHovered ? (
              <motion.div
                className="flex items-center gap-2 text-sm text-primary font-semibold"
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Auto-playing
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isHovered ? "Interactive Mode" : "Paused"}
              </p>
            )}
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
        >
          {[
            { label: "Portfolio Items", value: "31+" },
            { label: "Quality Assured", value: "100%" },
            { label: "Creator Network", value: "500+" },
            { label: "Client Satisfaction", value: "4.9★" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 hover:border-primary/40 transition-colors"
              whileHover={{ scale: 1.05, borderColor: "rgba(var(--primary), 0.6)" }}
            >
              <motion.p
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                {stat.value}
              </motion.p>
              <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
