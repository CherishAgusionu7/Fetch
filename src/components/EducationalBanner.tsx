/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Droplet, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WATER_FACTS } from '../constants';
import { gameAudio } from '../audio';

export default function EducationalBanner({ resetSignal }: { resetSignal: number }) {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % WATER_FACTS.length);
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setFactIndex(0);
  }, [resetSignal]);

  const handleLearnMore = () => {
    gameAudio.playClick();
    window.open('https://www.charitywater.org', '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      id="educational-banner"
      className="bg-[#faf6e8] border-4 border-[#bda27e] rounded-xl p-3 md:p-4 shadow-xl max-w-sm md:max-w-md text-[#5c4033] flex flex-row items-center gap-3 relative z-10 font-sans"
      style={{ boxShadow: '5px 5px 0px rgba(0,0,0,0.4)' }}
    >
      {/* Decorative corners */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-[#bda27e]"></div>
      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-[#bda27e]"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-[#bda27e]"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-[#bda27e]"></div>

      {/* Water Droplet Icon with wave effect */}
      <div className="bg-[#e0f2fe] p-2.5 rounded-lg border-2 border-[#38bdf8] flex-shrink-0 relative overflow-hidden group">
        <Droplet className="w-6 h-6 text-[#0284c7] animate-bounce" fill="#0ea5e9" />
        <span className="absolute inset-0 bg-[#38bdf8] opacity-10 rounded-full animate-ping"></span>
      </div>

      {/* Rotating Fact Content */}
      <div className="flex-grow min-w-0">
        <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#a0522d] font-press-start mb-1">
          WATER CRISIS FACT
        </h4>
        <div className="h-12 flex items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={factIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xs md:text-sm font-medium leading-tight text-[#4a2e1b] line-clamp-3"
            >
              {WATER_FACTS[factIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Learn More Action */}
      <button
        onClick={handleLearnMore}
        className="flex-shrink-0 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xxs md:text-xs font-bold py-1.5 px-3 rounded-lg border-b-4 border-[#0369a1] active:border-b-0 active:translate-y-[4px] transition-all flex items-center gap-1 cursor-pointer font-press-start uppercase tracking-tighter"
      >
        LEARN
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}
