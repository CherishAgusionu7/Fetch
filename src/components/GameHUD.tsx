/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Timer, Volume2, VolumeX, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameHUDProps {
  lives: number;
  maxLives: number;
  timeRemaining: number;
  familiesHelped: number;
  totalFamilies: number;
  hasWater: boolean;
  waterCarried: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
  lastHurtTime: number; // to trigger heart animation
}

export default function GameHUD({
  lives,
  maxLives,
  timeRemaining,
  familiesHelped,
  totalFamilies,
  hasWater,
  waterCarried,
  isMuted,
  onToggleMute,
  onReset,
  lastHurtTime,
}: GameHUDProps) {
  // Format timer as m:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine current active mission prompt
  const getMissionPrompt = () => {
    if (familiesHelped === totalFamilies) {
      return "ALL FAMILIES HELPED! VICTORY!";
    }
    if (hasWater) {
      if (familiesHelped === 0) {
        return "DELIVER CLEAN WATER TO AMINA'S FAMILY!";
      } else if (familiesHelped === 1) {
        return "BRING WATER TO KOFI'S FAMILY NEXT!";
      } else if (familiesHelped === 2) {
        return "BRING WATER TO MATEO IN THE VALLEY!";
      } else {
        return "FINAL STRETCH: HELP SUMI'S FAMILY AT THE CLIFFS!";
      }
    } else {
      return "GO LEFT TO REFILL YOUR BUCKET AT THE CLEAN WATER TANK!";
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 p-4 md:p-6 flex flex-col justify-between">
      
      {/* HEADER ROW */}
      <div className="w-full flex flex-row justify-between items-start">
        
        {/* TOP LEFT: Hearts (Lives) */}
        <div className="flex flex-row items-center gap-1.5 pointer-events-auto">
            {Array.from({ length: maxLives }).map((_, i) => {
              const isFilled = i < lives;
              return (
                <AnimatePresence key={i}>
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={
                      isFilled
                        ? {
                            scale: [1, 1.15, 1],
                            transition: {
                              repeat: Infinity,
                              repeatDelay: 2 + i * 0.5,
                              duration: 0.6,
                            },
                          }
                        : { scale: 0.8, opacity: 0.5 }
                    }
                    whileHover={{ scale: 1.2 }}
                    className="relative cursor-pointer"
                  >
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 16 16"
                      className="pixel-art filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
                    >
                      {/* Perfect Symmetrical Outline */}
                      <path
                        d="M2 1h3v1H2zm9 0h3v1h-3zM1 2h1v1H1zm4 0h1v1H5zm5 0h1v1h-1zm4 0h1v1h-1zM0 3h1v3H0zm6 0h1v1H6zm3 0h1v1H9zm6 0h1v3h-1zM7 4h2v1H7zm-6 2h1v1H1zm13 0h1v1h-1zM2 7h1v1H2zm11 0h1v1h-1zM3 8h1v1H3zm9 0h1v1h-1zM4 9h1v1H4zm7 0h1v1h-1zM5 10h1v1H5zm5 0h1v1h-1zM6 11h1v1H6zm3 0h1v1H9zm1 1h1v1h-1zM7 12h2v1H7z"
                        fill="#000000"
                      />
                      {/* Inner color with 3D bevel shading */}
                      {isFilled ? (
                        <>
                          {/* Red Base Fill */}
                          <path
                            d="M2 2h3v1H2zm9 0h3v1h-3zM1 3h5v1H1zm6 0h2v1H7zm3 0h5v1h-5zM1 4h6v1H1zm8 0h6v1H9zm-8 1h14v1H1zm1 1h12v1H2zm1 1h10v1H3zm1 1h8v1H4zm1 1h6v1H5zm1 1h4v1H6zm1 1h2v1H7z"
                            fill="#ef4444"
                          />
                          {/* Soft highlights (Glossy Pink) */}
                          <path
                            d="M4 2h1v1H4zm-1 1h1v1H3zm-1 1h1v1H2zm10 -2h1v1h-1z"
                            fill="#fca5a5"
                          />
                          {/* Strong highlights (Glossy White) */}
                          <path
                            d="M3 2h1v1H3zm-1 1h1v1H2zm10 -1h1v1h-1z"
                            fill="#ffffff"
                          />
                          {/* Bottom-Right Inner Shadow (Maroon) */}
                          <path
                            d="M13 3h2v3h-2zm-1 3h2v1h-2zm-1 1h2v1h-2zm-1 1h2v1h-2zm-1 1h2v1H9zm-1 1h2v1H8zm0 1h1v1H8z"
                            fill="#991b1b"
                          />
                        </>
                      ) : (
                        <>
                          {/* Depleted Slate-Gray Base Fill */}
                          <path
                            d="M2 2h3v1H2zm9 0h3v1h-3zM1 3h5v1H1zm6 0h2v1H7zm3 0h5v1h-5zM1 4h6v1H1zm8 0h6v1H9zm-8 1h14v1H1zm1 1h12v1H2zm1 1h10v1H3zm1 1h8v1H4zm1 1h6v1H5zm1 1h4v1H6zm1 1h2v1H7z"
                            fill="#475569"
                          />
                          {/* Soft Gray highlights */}
                          <path
                            d="M4 2h1v1H4zm-1 1h1v1H3zm-1 1h1v1H2zm10 -2h1v1h-1z"
                            fill="#94a3b8"
                          />
                          {/* Strong highlights (Glossy Silver-White) */}
                          <path
                            d="M3 2h1v1H3zm-1 1h1v1H2zm10 -1h1v1h-1z"
                            fill="#cbd5e1"
                          />
                          {/* Bottom-Right Slate-Dark Inner Shadow */}
                          <path
                            d="M13 3h2v3h-2zm-1 3h2v1h-2zm-1 1h2v1h-2zm-1 1h2v1h-2zm-1 1h2v1H9zm-1 1h2v1H8zm0 1h1v1H8z"
                            fill="#1e293b"
                          />
                        </>
                      )}
                    </svg>
                  </motion.div>
                </AnimatePresence>
              );
            })}
        </div>

        {/* TOP CENTER: FETCH Logo */}
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-press-start font-black text-[#581c87] text-shadow-purple tracking-widest uppercase select-none scale-y-115">
            FETCH
          </h1>
          <div className="text-[9px] md:text-[10px] font-press-start text-white bg-sky-500 border-2 border-slate-900 rounded px-1.5 py-0.5 -mt-1 shadow-md uppercase tracking-tight">
            Clean Water Quest
          </div>
        </div>

        {/* TOP RIGHT: Game Timer & Audio Toggle */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Timer Badge */}
          <div
            className="flex items-center gap-2 bg-white/95 border-4 border-[#0284c7] rounded-xl px-3 py-1.5 shadow-md"
            style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.4)' }}
          >
            <Timer className="w-5 h-5 text-[#0284c7] animate-pulse" />
            <span className="font-press-start text-[#0284c7] text-lg md:text-xl tracking-tight leading-none">
              {formatTime(timeRemaining)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={onReset}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96, y: 1 }}
              className="bg-[#0ea5e9] hover:bg-[#22c7ff] border-2 border-[#0369a1] rounded-lg px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white font-press-start shadow-lg active:border-white transition-all cursor-pointer"
              style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.35)' }}
              aria-label="Reset Game"
            >
              RESET
            </motion.button>

            <button
              onClick={onToggleMute}
              className="bg-slate-800/95 hover:bg-slate-700/95 border-2 border-slate-600 active:border-white rounded-lg p-2 text-white shadow-md active:translate-y-[2px] transition-all cursor-pointer"
              style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* MIDDLE CONTAINER (Mission prompt Box Upper Right) */}
      <div className="w-full flex justify-end pointer-events-none mt-2">
        <div 
          className="bg-white/95 border-4 border-[#16a34a] rounded-xl p-3 shadow-lg max-w-xs pointer-events-auto"
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.4)' }}
        >
          <div className="flex items-center gap-1.5 text-[#15803d] font-bold mb-1">
            <ClipboardList className="w-4 h-4" />
            <h5 className="text-[10px] uppercase font-press-start tracking-tighter">MISSION LOG</h5>
          </div>
          <p className="text-xxs md:text-xs font-bold font-press-start leading-normal text-[#1f2937]">
            {getMissionPrompt()}
          </p>
        </div>
      </div>

      {/* FOOTER ROW */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mt-auto">
        <div className="w-1 h-1 pointer-events-none"></div>
        
        {/* BOTTOM CENTER: Bucket Progress Bar (Families helped indicator) */}
        <div 
          className="bg-[#2e1d11] border-4 border-[#614126] rounded-xl p-2.5 px-4 shadow-xl flex flex-row items-center gap-3 relative z-10 pointer-events-auto"
          style={{ boxShadow: '5px 5px 0px rgba(0,0,0,0.5)' }}
        >
          {/* Bucket Outline SVG */}
          <div className="relative">
            <svg
              width="36"
              height="36"
              viewBox="0 0 16 16"
              className="pixel-art filter drop-shadow-[1px_1px_0px_rgba(0,0,0,0.8)]"
            >
              {/* Wooden bucket path */}
              <path d="M2 3h12v1H2zm1 1h10v1H3zm0 1h10v8H3zm1 8h8v1H4zm-1-8h1v8H3zm9 0h1v8h-1z" fill="#6b46c1" />
              {/* Iron ring details */}
              <path d="M2 6h12v1H2zm1 4h10v1H3z" fill="#a78bfa" />
              {/* Water Inside Bucket */}
              {hasWater && (
                <path d="M4 5h8v4H4z" fill="#0284c7" className="animate-pulse" />
              )}
            </svg>
            {hasWater && (
              <span className="absolute -top-1.5 -right-1 text-[8px] bg-sky-500 border border-white rounded-full text-white px-1 font-bold animate-bounce leading-none py-0.5">
                FULL
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-end mb-1 font-press-start text-[9px] md:text-[10px]">
              <span className="text-amber-100 font-bold tracking-tight">DELIVERIES</span>
              <span className="text-sky-400 font-bold font-press-start">
                {familiesHelped} / {totalFamilies}
              </span>
            </div>
            
            {/* Custom Green Progress Bar */}
            <div className="w-44 h-4 bg-slate-950 border-2 border-slate-800 rounded-md overflow-hidden p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-sm"
                initial={{ width: 0 }}
                animate={{ width: `${(familiesHelped / totalFamilies) * 100}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT: Handled by EducationalBanner outside in App.tsx layout */}
        <div className="w-1 h-1 pointer-events-none"></div>
        
      </div>

    </div>
  );
}
