"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Template } from "@/types/template";
import TemplateCard from "./TemplateCard";

interface ScrollAnimatedCardGridProps {
  templates: Template[];
}

interface AnimatedCardWrapperProps {
  children: React.ReactNode;
  index: number;
  total: number;
  progress: MotionValue<number>;
  isDesktop: boolean;
}

const AnimatedCardWrapper: React.FC<AnimatedCardWrapperProps> = ({
  children,
  index,
  total,
  progress,
  isDesktop,
}) => {
  // Distance from center: -1.5, -0.5, +0.5, +1.5 for 4 cards
  const centerIndex = (total - 1) / 2;
  const distanceFromCenter = index - centerIndex;

  // Skiper31 style 3D fan-out & glide dynamics
  // Desktop has full 3D fan spread, mobile has softer vertical staggered entrance
  const x = useTransform(
    progress,
    [0, 1],
    [isDesktop ? distanceFromCenter * 65 : distanceFromCenter * 15, 0]
  );

  const rotateZ = useTransform(
    progress,
    [0, 1],
    [isDesktop ? distanceFromCenter * 5 : 0, 0]
  );

  const rotateY = useTransform(
    progress,
    [0, 1],
    [isDesktop ? -distanceFromCenter * 8 : 0, 0]
  );

  const y = useTransform(
    progress,
    [0, 1],
    [Math.abs(distanceFromCenter) * 28 + (index * 12), 0]
  );

  const scale = useTransform(progress, [0, 1], [0.88, 1]);
  const opacity = useTransform(progress, [0, 0.4, 1], [0.25, 0.7, 1]);

  return (
    <motion.div
      className="w-full h-full will-change-transform transform-gpu"
      style={{
        x,
        y,
        rotateZ,
        rotateY,
        scale,
        opacity,
        transformOrigin: "bottom center",
      }}
    >
      {children}
    </motion.div>
  );
};

export default function ScrollAnimatedCardGrid({
  templates,
}: ScrollAnimatedCardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth, { passive: true });
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Single scroll tracker tied to when cards scroll into view
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center 60%"],
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ perspective: "1200px" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {templates.map((template, index) => (
          <AnimatedCardWrapper
            key={template.id}
            index={index}
            total={templates.length}
            progress={scrollYProgress}
            isDesktop={isDesktop}
          >
            <TemplateCard template={template} />
          </AnimatedCardWrapper>
        ))}
      </div>
    </div>
  );
}
