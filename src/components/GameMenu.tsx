/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Award, AlertTriangle, ExternalLink, Globe, Compass, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { gameAudio } from '../audio';

interface GameMenuProps {
  screen: 'menu' | 'intro' | 'gameover' | 'victory';
  lives: number;
  timeRemaining: number;
  familiesHelped: number;
  totalFamilies: number;
  onStartGame: () => void;
  onRestartGame: () => void;
  onGoToMenu: () => void;
}

export default function GameMenu({
  screen,
  lives,
  timeRemaining,
  familiesHelped,
  totalFamilies,
  onStartGame,
  onRestartGame,
  onGoToMenu,
}: GameMenuProps) {

  const handleStart = () => {
    gameAudio.playClick();
    onStartGame();
  };

  const handleRestart = () => {
    gameAudio.playClick();
    onRestartGame();
  };

  const handleGoToMenu = () => {
    gameAudio.playClick();
    onGoToMenu();
  };

  const handleLearnMore = () => {
    gameAudio.playClick();
    window.open('https://www.charitywater.org', '_blank', 'noopener,noreferrer');
  };

  // Render format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Main Menu Screen
  if (screen === 'menu') {
    return (
      <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center z-30 p-4 text-center select-none overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="max-w-lg bg-[#2e104e] border-8 border-[#a855f7] rounded-2xl p-6 md:p-8 flex flex-col items-center text-white"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.6)' }}
        >
          {/* Logo Title */}
          <h1 className="text-5xl md:text-6xl font-press-start font-black text-[#facc15] text-shadow-purple tracking-widest uppercase scale-y-110 mb-2">
            FETCH
          </h1>
          
          <h2 className="font-press-start text-xs md:text-sm text-sky-300 uppercase tracking-wider mb-6">
            The Clean Water Quest
          </h2>

          <p className="text-xs md:text-sm text-purple-200 leading-relaxed font-sans max-w-sm mb-8">
            Take on the role of a young water explorer. Cross obstacles, dodge pollution creatures, collect clean water from the reservoir, and bring hope to families in need!
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleStart}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 border-b-6 border-yellow-700 hover:border-yellow-500 active:border-b-0 active:translate-y-[6px] rounded-xl py-3 px-6 text-sm font-press-start flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all uppercase"
            >
              <Play className="w-5 h-5 fill-current" />
              PLAY MISSION
            </button>

            <button
              onClick={handleLearnMore}
              className="bg-sky-500 hover:bg-sky-400 text-white border-b-6 border-sky-700 hover:border-sky-500 active:border-b-0 active:translate-y-[6px] rounded-xl py-3 px-6 text-xs font-press-start flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all uppercase"
            >
              <Globe className="w-4 h-4" />
              charity: water
            </button>
          </div>

          <div className="mt-8 text-[10px] font-press-start text-purple-300">
            Inspired by charity: water • Help solve the crisis
          </div>
        </motion.div>
      </div>
    );
  }

  // Story Introduction / Instruction Screen
  if (screen === 'intro') {
    return (
      <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-30 p-4 text-center select-none overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl bg-slate-900 border-4 border-[#16a34a] rounded-2xl p-6 md:p-8 flex flex-col text-slate-100 font-sans"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.6)' }}
        >
          <div className="flex items-center gap-2 mb-4 self-center">
            <Compass className="w-6 h-6 text-green-400 animate-spin-slow" />
            <h2 className="text-lg md:text-xl font-press-start text-green-400 uppercase tracking-tight">
              MISSION BRIEFING
            </h2>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-4 text-left border border-slate-800 text-xs md:text-sm leading-relaxed text-slate-300 mb-6 flex flex-col gap-3">
            <p className="font-semibold text-sky-400 font-press-start text-xxs uppercase">THE CRISIS:</p>
            <p>
              Right now, over <strong>703 million people</strong> around the world do not have access to safe, clean drinking water. In remote villages, kids and mothers walk hours to fetch water from polluted rivers that make them sick.
            </p>
            <p className="font-semibold text-yellow-400 font-press-start text-xxs uppercase">YOUR GOAL:</p>
            <p>
              As the village explorer, you must run across the floating hills and muddy valleys to deliver clean, life-saving water to <strong>four waiting families</strong>.
            </p>
            <p className="font-semibold text-emerald-400 font-press-start text-xxs uppercase">HOW TO PLAY:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-300">
              <li>Walk far left to the <strong>Clean Water Tank</strong> and press <kbd className="px-1 bg-slate-800 text-white font-bold rounded">E</kbd> or tap <kbd className="px-1 bg-slate-800 text-white font-bold rounded">E icon</kbd> to refill. And Pro tip, you can double-tap the space bar to double jump!</li>
              <li>Carry the bucket carefully. Watch it bounce on your head!</li>
              <li>Dodge mud puddles, poisonous creatures, spikes, and falling boulders.</li>
              <li>Deliver water to each of the <strong>4 families</strong> by walking to them and pressing <kbd className="px-1 bg-slate-800 text-white font-bold rounded">E</kbd>!</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="bg-green-500 hover:bg-green-400 text-slate-900 border-b-6 border-green-700 hover:border-green-500 active:border-b-0 active:translate-y-[6px] rounded-xl py-3 px-8 text-sm font-press-start shadow-md cursor-pointer transition-all self-center uppercase"
          >
            START QUEST
          </button>
        </motion.div>
      </div>
    );
  }

  // Game Over Screen
  if (screen === 'gameover') {
    return (
      <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-30 p-4 text-center select-none">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md bg-[#3b0712] border-8 border-red-600 rounded-2xl p-6 md:p-8 flex flex-col items-center text-white"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.6)' }}
        >
          <AlertTriangle className="w-16 h-16 text-red-500 animate-bounce mb-2" />
          
          <h1 className="text-3xl md:text-4xl font-press-start font-black text-red-500 text-shadow-custom uppercase tracking-wide mb-4">
            GAME OVER
          </h1>

          <p className="text-xs md:text-sm text-red-200 font-sans max-w-sm mb-6 leading-relaxed">
            {lives <= 0 
              ? "You ran out of health hearts due to hazards and water monsters. Don't give up! The families still need you."
              : "Time ran out! Collecting clean water is a race against time for those in need."}
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleRestart}
              className="bg-red-500 hover:bg-red-400 text-white border-b-6 border-red-700 hover:border-red-500 active:border-b-0 active:translate-y-[6px] rounded-xl py-3 px-6 text-sm font-press-start flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
            >
              <RotateCcw className="w-5 h-5" />
              TRY AGAIN
            </button>

            <button
              onClick={handleGoToMenu}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-b-6 border-slate-900 hover:border-slate-800 active:border-b-0 active:translate-y-[6px] rounded-xl py-3 px-6 text-xs font-press-start flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
            >
              <RefreshCw className="w-4 h-4" />
              MAIN MENU
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Victory / Mission Complete Screen
  if (screen === 'victory') {
    return (
      <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-30 p-4 text-center select-none overflow-y-auto">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="max-w-lg bg-[#064e3b] border-8 border-emerald-500 rounded-2xl p-6 md:p-8 flex flex-col items-center text-white"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.6)' }}
        >
          <Award className="w-16 h-16 text-yellow-400 animate-pulse mb-3" />

          <h1 className="text-3xl md:text-4xl font-press-start font-black text-yellow-400 text-shadow-custom uppercase tracking-wide mb-1 leading-tight">
            MISSION COMPLETE!
          </h1>
          
          <h3 className="font-press-start text-[10px] md:text-xs text-emerald-300 uppercase tracking-widest mb-6">
            You Saved the Village!
          </h3>

          <p className="text-xs md:text-sm text-emerald-100 max-w-sm mb-6 leading-relaxed font-sans">
            "You changed lives by delivering clean water." All 4 families now have safe, sustainable clean water from the tank, preventing illnesses and allowing kids to go to school!
          </p>

          {/* Stats Breakdown Box */}
          <div className="w-full bg-slate-950/80 border-2 border-emerald-800 rounded-xl p-4 text-left font-press-start text-xxs md:text-xs flex flex-col gap-2.5 mb-6 text-slate-300 shadow-inner">
            <div className="flex flex-row justify-between border-b border-emerald-950 pb-1.5">
              <span>FAMILIES HELPED:</span>
              <span className="text-yellow-400">{familiesHelped} / {totalFamilies}</span>
            </div>
            <div className="flex flex-row justify-between border-b border-emerald-950 pb-1.5">
              <span>LIVES REMAINING:</span>
              <span className="text-red-400">{'♥'.repeat(lives)}</span>
            </div>
            <div className="flex flex-row justify-between">
              <span>TIME REMAINING:</span>
              <span className="text-sky-400">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleRestart}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 border-b-6 border-yellow-700 hover:border-yellow-500 active:border-b-0 active:translate-y-[6px] rounded-xl py-3 px-6 text-sm font-press-start flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
            >
              <RotateCcw className="w-4 h-4 fill-current" />
              PLAY AGAIN
            </button>

            <button
              onClick={handleLearnMore}
              className="bg-sky-500 hover:bg-sky-400 text-white border-b-6 border-sky-700 hover:border-sky-500 active:border-b-0 active:translate-y-[6px] rounded-xl py-3 px-6 text-xs font-press-start flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
            >
              <ExternalLink className="w-4 h-4" />
              VISIT CHARITYWATER.ORG
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
