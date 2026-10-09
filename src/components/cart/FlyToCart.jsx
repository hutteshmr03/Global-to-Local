import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';

// Zustand store for managing flying particles
export const useFlyToCartStore = create((set) => ({
  particles: [],
  fly: ({ startRect, imageSrc }) => {
    const id = Date.now() + Math.random();
    const targetEl = document.getElementById('header-bag-btn');
    const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth - 60, top: 20, width: 44, height: 44 };

    const startX = startRect.left + startRect.width / 2 - 26;
    const startY = startRect.top + startRect.height / 2 - 26;
    const endX = targetRect.left + targetRect.width / 2 - 26;
    const endY = targetRect.top + targetRect.height / 2 - 26;

    const newParticle = {
      id,
      imageSrc,
      startX,
      startY,
      endX,
      endY,
    };

    set((state) => ({ particles: [...state.particles, newParticle] }));

    // Remove particle after animation completes
    setTimeout(() => {
      set((state) => ({
        particles: state.particles.filter((p) => p.id !== id),
      }));
    }, 750);
  },
}));

export function useFlyToCart() {
  return useFlyToCartStore((state) => state.fly);
}

export default function FlyToCartContainer() {
  const particles = useFlyToCartStore((state) => state.particles);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: p.startX,
              y: p.startY,
              scale: 0.9,
              opacity: 1,
            }}
            animate={{
              x: [p.startX, (p.startX + p.endX) / 2 - 30, p.endX],
              y: [p.startY, Math.min(p.startY, p.endY) - 60, p.endY],
              scale: [0.9, 1.1, 0.35],
              opacity: [1, 1, 0.4],
              rotate: [0, 15, -15, 0],
            }}
            exit={{ opacity: 0, scale: 0.1 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1], // snappy cubic-bezier
              times: [0, 0.45, 1],
            }}
            className="absolute top-0 left-0 h-14 w-14 rounded-full border-2 border-white bg-surface shadow-2xl overflow-hidden ring-2 ring-accent/30 flex items-center justify-center"
          >
            <img
              src={p.imageSrc}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
