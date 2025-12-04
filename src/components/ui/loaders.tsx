"use client";

import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div
        className="flex space-x-2"
        initial="hidden"
        animate="visible"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-primary rounded-full"
            animate={{
              y: ["0%", "-50%", "0%"],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.15,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export function CardLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      <div className="h-24 bg-muted rounded animate-pulse" />
    </motion.div>
  );
}

export function SpinnerLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

export function FullPageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center"
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          <span className="text-2xl font-bold text-primary-foreground">N</span>
        </motion.div>
        <motion.p
          className="text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
