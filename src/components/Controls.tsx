/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Zap } from 'lucide-react';

interface ControlsProps {
  onPressStart: (key: 'left' | 'right' | 'jump' | 'action') => void;
  onPressEnd: (key: 'left' | 'right' | 'jump' | 'action') => void;
  isMobile: boolean;
}

export default function Controls({ onPressStart, onPressEnd, isMobile }: ControlsProps) {
  // If not mobile, we don't display the virtual overlay, but we can display a keyboard legend
  if (!isMobile) {
    return (
      <div 
        className="hidden md:flex flex-row items-center gap-4 bg-slate-900/80 border-2 border-slate-700/80 rounded-xl px-4 py-2 text-slate-300 text-xs font-press-start relative z-10"
        style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center gap-1.5">
          <kbd className="bg-slate-800 border-b-2 border-slate-600 rounded px-1.5 py-0.5 text-white">A</kbd>
          <kbd className="bg-slate-800 border-b-2 border-slate-600 rounded px-1.5 py-0.5 text-white">D</kbd> or 
          <span className="text-sky-400">←</span><span className="text-sky-400">→</span>
          <span className="ml-1">Move</span>
        </div>
        <div className="h-4 w-px bg-slate-700"></div>
        <div className="flex items-center gap-1.5">
          <kbd className="bg-slate-800 border-b-2 border-slate-600 rounded px-1.5 py-0.5 text-white">W</kbd> or 
          <span className="text-sky-400">↑</span> or
          <kbd className="bg-slate-800 border-b-2 border-slate-600 rounded px-3 py-0.5 text-white">Space</kbd>
          <span className="ml-1">Jump</span>
        </div>
        <div className="h-4 w-px bg-slate-700"></div>
        <div className="flex items-center gap-1.5">
          <kbd className="bg-slate-800 border-b-2 border-slate-600 rounded px-2.5 py-0.5 text-white">E</kbd>
          <span className="ml-1 text-yellow-400 font-bold">Refill / Deliver</span>
        </div>
      </div>
    );
  }

  // Mobile layout with highly-responsive, low-latency touch controls
  return (
    <div className="fixed bottom-4 left-4 right-4 z-20 flex flex-row justify-between items-end pointer-events-none md:hidden">
      {/* Directional Pad */}
      <div className="flex flex-row gap-3 pointer-events-auto">
        <button
          onTouchStart={() => onPressStart('left')}
          onTouchEnd={() => onPressEnd('left')}
          onMouseDown={() => onPressStart('left')}
          onMouseUp={() => onPressEnd('left')}
          onMouseLeave={() => onPressEnd('left')}
          className="w-14 h-14 rounded-full bg-slate-800/90 active:bg-sky-500 border-4 border-slate-600 active:border-white text-white flex items-center justify-center shadow-lg transform active:scale-95 transition-all touch-none select-none"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onTouchStart={() => onPressStart('right')}
          onTouchEnd={() => onPressEnd('right')}
          onMouseDown={() => onPressStart('right')}
          onMouseUp={() => onPressEnd('right')}
          onMouseLeave={() => onPressEnd('right')}
          className="w-14 h-14 rounded-full bg-slate-800/90 active:bg-sky-500 border-4 border-slate-600 active:border-white text-white flex items-center justify-center shadow-lg transform active:scale-95 transition-all touch-none select-none"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Action Pad */}
      <div className="flex flex-row gap-3 pointer-events-auto">
        {/* Action button (Refill/Deliver) */}
        <button
          onTouchStart={() => onPressStart('action')}
          onTouchEnd={() => onPressEnd('action')}
          onMouseDown={() => onPressStart('action')}
          onMouseUp={() => onPressEnd('action')}
          onMouseLeave={() => onPressEnd('action')}
          className="w-14 h-14 rounded-full bg-amber-500/90 active:bg-amber-300 border-4 border-amber-700 active:border-white text-slate-900 flex flex-col items-center justify-center shadow-lg transform active:scale-95 transition-all touch-none select-none font-press-start"
        >
          <Zap className="w-5 h-5 mb-0.5 fill-current" />
          <span className="text-[8px] font-bold tracking-tight">E</span>
        </button>

        {/* Jump button */}
        <button
          onTouchStart={() => onPressStart('jump')}
          onTouchEnd={() => onPressEnd('jump')}
          onMouseDown={() => onPressStart('jump')}
          onMouseUp={() => onPressEnd('jump')}
          onMouseLeave={() => onPressEnd('jump')}
          className="w-16 h-16 rounded-full bg-sky-500/90 active:bg-sky-300 border-4 border-sky-700 active:border-white text-white flex items-center justify-center shadow-lg transform active:scale-95 transition-all touch-none select-none"
        >
          <ArrowUp className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
