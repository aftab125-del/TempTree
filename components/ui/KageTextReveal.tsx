"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export interface KageTextRevealProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  japaneseAccent?: string;
  glow?: boolean;
}

// Kage's exact authored easing: cubic-bezier(.16, 1, .3, 1)
const KAGE_EASING: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const KageTextReveal: React.FC<KageTextRevealProps> = ({
  children,
  as: Component = "h2",
  className,
  delay = 0,
  stagger = 0.045,
  once = true,
  japaneseAccent,
  glow = false,
}) => {
  const words = children.split(" ");

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: {
      y: "115%",
      opacity: 0,
      rotateX: 12,
    },
    visible: {
      y: "0%",
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: 0.95,
        ease: KAGE_EASING,
      },
    },
  };

  const accentVariants: Variants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 0.7,
      y: 0,
      transition: { duration: 0.8, ease: KAGE_EASING, delay: delay + 0.2 },
    },
  };

  return (
    <div className="inline-block">
      {japaneseAccent && (
        <motion.span
          initial="hidden"
          whileInView="visible"
          viewport={{ once, margin: "-50px" }}
          variants={accentVariants}
          className="block font-serif text-[11px] sm:text-xs tracking-[0.35em] text-peachPink/80 uppercase mb-1.5 select-none"
        >
          {japaneseAccent}
        </motion.span>
      )}

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: "-50px" }}
        variants={containerVariants}
        className={cn(
          "inline-block font-playfair tracking-tight",
          glow && "drop-shadow-[0_2px_24px_rgba(226,180,189,0.35)]",
          className
        )}
      >
        <Component className="inline m-0 p-0 font-inherit leading-inherit tracking-inherit text-inherit">
          {words.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="inline-block overflow-hidden align-top mr-[0.28em] last:mr-0"
              style={{ paddingBottom: "0.08em" }}
            >
              <motion.span
                variants={wordVariants}
                className="inline-block will-change-transform transform-gpu"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </Component>
      </motion.div>
    </div>
  );
};

export default KageTextReveal;
