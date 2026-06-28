/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import GameMenu from './components/GameMenu';
import Controls from './components/Controls';
import EducationalBanner from './components/EducationalBanner';
import { GameScreen } from './types';
import { gameAudio } from './audio';
import { Droplet } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // HUD stats synced from Game Loop inside Canvas
  const [hudStats, setHudStats] = useState({
    lives: 3,
    timeRemaining: 120,
    familiesHelped: 0,
    hasWater: false,
    waterCarried: 0,
    lastHurtTime: 0,
  });

  // Mobile virtual key states passed to Canvas physics listeners
  const [mobileKeyStates, setMobileKeyStates] = useState({
    left: false,
    right: false,
    jump: false,
    action: false,
  });
  const [resetSignal, setResetSignal] = useState(0);

  // Check if device supports touch input
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        (navigator as any).msMaxTouchPoints > 0;
      setIsMobile(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Initialize Audio Context on first click interaction to comply with browser safety
  const handleUserInteraction = () => {
    gameAudio.init();
  };

  const toggleMute = () => {
    handleUserInteraction();
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    gameAudio.setMute(targetMute);
  };

  const startGame = () => {
    handleUserInteraction();
    setScreen('playing');
  };

  const resetGame = () => {
    handleUserInteraction();
    setResetSignal((prev) => prev + 1);
    if (screen !== 'playing') {
      setScreen('playing');
    }
  };

  const restartGame = () => {
    resetGame();
  };

  const goToMenu = () => {
    handleUserInteraction();
    setScreen('menu');
  };

  // Virtual key controls triggers for touch
  const handleMobilePressStart = (key: 'left' | 'right' | 'jump' | 'action') => {
    handleUserInteraction();
    setMobileKeyStates((prev) => ({ ...prev, [key]: true }));
  };

  const handleMobilePressEnd = (key: 'left' | 'right' | 'jump' | 'action') => {
    setMobileKeyStates((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div 
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      className="relative min-h-screen w-full bg-slate-950 bg-radial-gradient from-slate-900 to-slate-950 flex flex-col items-center justify-between p-3 md:p-6 text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* Decorative stars / bubbles drifting background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.15)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40"></div>

      {/* HEADER: Small top project brand */}
      <div className="w-full max-w-5xl flex flex-row justify-between items-center z-10 py-1.5 md:py-2 px-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-sky-500 text-white p-1 rounded-md animate-pulse">
            <Droplet className="w-4 h-4 fill-current" />
          </div>
          <span className="font-press-start text-[10px] md:text-xs tracking-tight text-sky-400">
            FETCH: THE CLEAN WATER QUEST
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-slate-400 font-press-start text-[8px] md:text-[9px]">
          <span>PERSISTENCE: SESSION LOCAL</span>
          <span className="hidden sm:inline text-emerald-400">• POWERED BY CHARITY: WATER</span>
        </div>
      </div>

      {/* CORE FRAME: Visual game console boundary wrapper */}
      <div className="relative w-full max-w-5xl flex-grow flex items-center justify-center p-1 md:p-2">
        
        {/* Aspect Ratio 16:9 Inner Canvas wrapper */}
        <div className="relative w-full aspect-[16/9] bg-slate-950 border-4 md:border-8 border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* 1. Core game renderer */}
          <GameCanvas
            screen={screen}
            setScreen={setScreen}
            setHudStats={setHudStats}
            mobileKeyStates={mobileKeyStates}
            resetSignal={resetSignal}
          />

          {/* 2. Overlaid Active Console HUD */}
          {screen === 'playing' && (
            <GameHUD
              lives={hudStats.lives}
              maxLives={3}
              timeRemaining={hudStats.timeRemaining}
              familiesHelped={hudStats.familiesHelped}
              totalFamilies={4}
              hasWater={hudStats.hasWater}
              waterCarried={hudStats.waterCarried}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onReset={resetGame}
              lastHurtTime={hudStats.lastHurtTime}
            />
          )}

          {/* 3. Interactive Modal Overlays for game screens */}
          {screen !== 'playing' && (
            <GameMenu
              screen={screen}
              lives={hudStats.lives}
              timeRemaining={hudStats.timeRemaining}
              familiesHelped={hudStats.familiesHelped}
              totalFamilies={4}
              onStartGame={screen === 'menu' ? () => setScreen('intro') : startGame}
              onRestartGame={restartGame}
              onGoToMenu={goToMenu}
            />
          )}

        </div>
      </div>

      {/* FOOTER DASHBOARD LAYER */}
      <div className="w-full max-w-5xl mt-3 flex flex-col md:flex-row justify-between items-center gap-4 z-10 py-2 border-t border-slate-800/80">
        
        {/* Left Side: Desktop/Mobile Controls layout indicator */}
        <Controls
          onPressStart={handleMobilePressStart}
          onPressEnd={handleMobilePressEnd}
          isMobile={isMobile}
        />

        {/* Right Side: Educational Scrolling Fact widget */}
        <EducationalBanner resetSignal={resetSignal} />
      </div>

    </div>
  );
}
