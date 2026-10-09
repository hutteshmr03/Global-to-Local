import React from 'react';
import { motion } from 'framer-motion';
import { TropicalSunIcon, CoastalWaveIcon, PalmLeafIcon } from './Icons';

export default function ShellDrift({ tone = 'light' }) {
  const isDark = tone === 'dark';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${
        isDark ? 'text-content-ondark opacity-[0.14]' : 'text-content opacity-[0.08]'
      }`}
    >
      {/* Drifting Golden Sunburst Motif */}
      <motion.span
        className="absolute block -left-6 top-[8%] w-24 lg:w-32"
        animate={{
          y: [0, 14, 0],
          rotate: [-6, -2, -6],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <TropicalSunIcon />
      </motion.span>

      {/* Drifting Coastal Wave Motif */}
      <motion.span
        className="absolute block right-[6%] top-[30%] w-20 lg:w-28"
        animate={{
          y: [0, -12, 0],
          rotate: [4, 8, 4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      >
        <CoastalWaveIcon />
      </motion.span>

      {/* Drifting Tropical Palm Leaf */}
      <motion.span
        className="absolute block right-[2%] bottom-[8%] w-24 lg:w-32"
        animate={{
          y: [0, 12, 0],
          rotate: [-8, -3, -8],
        }}
        transition={{
          duration: 9.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      >
        <PalmLeafIcon />
      </motion.span>
    </div>
  );
}
