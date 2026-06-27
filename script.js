/* FETCH — Main game script
   Single-file canvas implementation with HUD integration.
*/
(function(){
  'use strict';

  // Config
  const TOTAL_BUCKETS = 4;
  const START_TIME = 150; // seconds
  const TANK_X = 8; // percent
  const FAMILY_POSITIONS = [66, 76, 86, 92];
  const INTERACT_RANGE = 8; // percent
  const PLAYER_SPEED = 36; // percent per second
  const GRAVITY = 1600; // px/s^2
  const JUMP_VELOCITY = -520; // px/s
  const INVINCIBLE_MS = 1200;

  const FACTS = [
    '703 million people lack access to clean drinking water.',
    'Clean water improves health and education outcomes.',
    'Women and children often walk miles each day to collect water.',
    'Access to clean water transforms communities over generations.'
  ];

  // DOM
  const canvas = document.getElementById('game');
  const timerEl = document.getElementById('timer');
  const bucketFill = document.getElementById('bucketFill');
  const bucketText = document.getElementById('bucketText');
  const factEl = document.getElementById('factText') || document.getElementById('fact-text');
  const overlay = document.getElementById('overlay');
  const overlayContent = document.getElementById('overlayContent');
  const retryBtn = document.getElementById('retryBtn');
  const menuBtn = document.getElementById('menuBtn');
  const touchControls = document.getElementById('touchControls');
  const leftBtn = document.getElementById('leftBtn') || document.getElementById('btn-left');
  const rightBtn = document.getElementById('rightBtn') || document.getElementById('btn-right');
  const jumpBtn = document.getElementById('jumpBtn') || document.getElementById('btn-jump');
  const actionBtn = document.getElementById('actionBtn') || document.getElementById('btn-action');

  const ctx = canvas.getContext('2d');

  // State
  const state = {
    player: { xPct:50, y:0, vy:0, w:36, h:48, onGround:true, hasBucket:false },
    bucketsDelivered: 0,
    hearts: 3,
    timeLeft: START_TIME,
    running: false,
    lastTs: 0,
    factIndex: 0,
    invincibleUntil: 0,
    keys: { left:false, right:false },
    enemies: []
  };

  // Audio (synth)
  let audioCtx = null;
  function ac(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
  function playTone(freq,dur=0.08,type='sine',vol=0.12){ try{ const c=ac(); const o=c.createOscillator(); const g=c.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=vol; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+dur);}catch(e){} }

  // Canvas helpers
  function resize(){ canvas.width = Math.floor(window.innerWidth); canvas.height = Math.floor(window.innerHeight); }
  window.addEventListener('resize', resize); resize();
  function worldX(pct){ return (pct/100) * canvas.width; }
  function groundY(){ return canvas.height * 0.86; }

  // Enemies
  function spawnEnemies(){
    state.enemies = [
      { type:'patrol', xPct:32, dir:1, speed:12, w:56, h:40 },
      { type:'slime', xPct:48, timer:0, jumpEvery:1.4, y:0, vy:0, w:34, h:26 },
      { type:'fly', xPct:60, angle:0, radius:36, w:28, h:18 }
    ];
  }

  // Input
  function bindHold(el,down,up){ if(!el) return; el.addEventListener('touchstart', e=>{ e.preventDefault(); down(); }); el.addEventListener('touchend', e=>{ e.preventDefault(); up(); }); el.addEventListener('mousedown', down); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', up); }
  window.addEventListener('keydown', e=>{
    if(e.code==='ArrowLeft'||e.code==='KeyA') state.keys.left=true;
    if(e.code==='ArrowRight'||e.code==='KeyD') state.keys.right=true;
    if(e.code==='Space'||e.code==='KeyW'||e.code==='ArrowUp'){ e.preventDefault(); tryJump(); }
    if(e.code==='KeyE') handleAction();
  });
  window.addEventListener('keyup', e=>{ if(e.code==='ArrowLeft'||e.code==='KeyA') state.keys.left=false; if(e.code==='ArrowRight'||e.code==='KeyD') state.keys.right=false; });
  bindHold(leftBtn, ()=>state.keys.left=true, ()=>state.keys.left=false);
  bindHold(rightBtn, ()=>state.keys.right=true, ()=>state.keys.right=false);
  if(jumpBtn) { jumpBtn.addEventListener('touchstart', e=>{ e.preventDefault(); tryJump(); }); jumpBtn.addEventListener('click', tryJump); }
  if(actionBtn) { actionBtn.addEventListener('click', handleAction); actionBtn.addEventListener('touchstart', e=>{ e.preventDefault(); handleAction(); }); }

  // Actions
  function tryJump(){ if(!state.running) return; if(state.player.onGround){ state.player.vy = JUMP_VELOCITY; state.player.onGround = false; playTone(720,0.08,'square',0.08); } }
  function handleAction(){ if(!state.running) return; const px = state.player.xPct; if(Math.abs(px - TANK_X) <= INTERACT_RANGE && !state.player.hasBucket && state.bucketsDelivered < TOTAL_BUCKETS){ collectWater(); return; } for(let i=0;i<FAMILY_POSITIONS.length;i++){ if(Math.abs(px - FAMILY_POSITIONS[i]) <= INTERACT_RANGE && state.player.hasBucket){ deliverTo(i); return; } } }
  function collectWater(){ state.player.hasBucket = true; playTone(620,0.12,'sine'); showFloating('Bucket filled'); updateHUD(); }
  function deliverTo(idx){ state.player.hasBucket = false; state.bucketsDelivered++; playTone(880,0.12,'triangle'); showFloating('Delivered!'); updateHUD(); if(state.bucketsDelivered >= TOTAL_BUCKETS) win(); }

  function showFloating(text){ overlayContent.textContent = text; overlay.classList.remove('hidden'); setTimeout(()=>{ if(!state.gameOver) overlay.classList.add('hidden'); }, 700); }

  // HUD / Facts
  let timerId = null, factId = null;
  function updateTimerDisplay(){ const m = Math.floor(state.timeLeft/60), s = state.timeLeft%60; timerEl.textContent = `${m}:${String(s).padStart(2,'0')}`; timerEl.classList.toggle('low-time', state.timeLeft<=20 && state.timeLeft>0); }
  function startTimer(){ clearInterval(timerId); updateTimerDisplay(); timerId = setInterval(()=>{ if(!state.running) return; state.timeLeft--; updateTimerDisplay(); if(state.timeLeft<=0) lose('time'); }, 1000); }
  function rotateFacts(){ if(!factEl) return; factEl.textContent = FACTS[state.factIndex]; clearInterval(factId); factId = setInterval(()=>{ factEl.classList.add('fade'); setTimeout(()=>{ state.factIndex = (state.factIndex+1) % FACTS.length; factEl.textContent = FACTS[state.factIndex]; factEl.classList.remove('fade'); }, 350); }, 10000); }
  function updateHUD(){ if(bucketFill) bucketFill.style.width = `${(state.bucketsDelivered/TOTAL_BUCKETS)*100}%`; if(bucketText) bucketText.textContent = `${state.bucketsDelivered} / ${TOTAL_BUCKETS}`; }

  // Enemy & collision logic
  function updateEnemies(dt){ state.enemies.forEach(e=>{ if(e.type==='patrol'){ e.xPct += e.dir * e.speed * dt; if(e.xPct > 60) e.dir = -1; if(e.xPct < 24) e.dir = 1; } else if(e.type==='slime'){ e.timer = (e.timer||0) + dt; if(e.timer >= e.jumpEvery){ e.timer = 0; e.vy = -260; } e.y = (e.y||0) + (e.vy||0)*dt; e.vy = (e.vy||0) + 900*dt; if(e.y > 0){ e.y = 0; e.vy = 0; } } else if(e.type==='fly'){ e.angle = (e.angle||0) + dt*2; e.xPct += Math.cos(e.angle)*6*dt; } }); }
  function checkEnemyCollisions(){ const now = performance.now(); const px = state.player.xPct; state.enemies.forEach(e=>{ const dist = Math.abs(px - (e.xPct||e.xPct)); if(dist < 6 && now > state.invincibleUntil && state.running){ takeDamage(); } }); }
  function takeDamage(){ state.hearts = Math.max(0, state.hearts - 1); state.invincibleUntil = performance.now() + INVINCIBLE_MS; playTone(160,0.18,'sawtooth'); if(state.hearts <= 0) lose('lives'); }

  // Win / Lose
  function win(){ state.running = false; state.gameOver = true; playTone(880,0.28,'triangle'); overlayContent.textContent = 'Mission Complete! You changed lives by delivering clean water.'; overlay.classList.remove('hidden'); }
  function lose(kind){ state.running = false; state.gameOver = true; overlayContent.textContent = kind==='time' ? 'Time ran out!' : 'You lost all hearts.'; overlay.classList.remove('hidden'); }

  // Render
  function render(){ const c = canvas, g = ctx; g.clearRect(0,0,c.width,c.height);
    // sky
    const sky = g.createLinearGradient(0,0,0,c.height); sky.addColorStop(0,'#8FD3F4'); sky.addColorStop(1,'#C2E9FB'); g.fillStyle = sky; g.fillRect(0,0,c.width,c.height);
    // mountains
    g.fillStyle = '#7FA8B6'; g.beginPath(); g.moveTo(0,c.height*0.7); g.lineTo(c.width*0.18,c.height*0.45); g.lineTo(c.width*0.36,c.height*0.7); g.lineTo(c.width*0.52,c.height*0.35); g.lineTo(c.width*0.7,c.height*0.7); g.lineTo(c.width, c.height*0.55); g.lineTo(c.width, c.height); g.lineTo(0,c.height); g.closePath(); g.fill();
    // ground
    g.fillStyle = '#5A9550'; g.fillRect(0,c.height*0.86,c.width,c.height*0.14);

    // water tank
    const tx = worldX(TANK_X), ty = groundY()-10; g.fillStyle='#8FA3AC'; g.fillRect(tx-30, ty-84, 60, 84); g.fillStyle='#2E8FB0'; const level = 0.68; g.fillRect(tx-24, ty-84 + (1-level)*70, 48, 70*level);

    // families
    FAMILY_POSITIONS.forEach((pct,i)=>{ const fx = worldX(pct), fy = groundY(); g.fillStyle='#A65A38'; g.fillRect(fx-36, fy-66, 72, 46); g.fillStyle='#FFE07A'; g.beginPath(); g.moveTo(fx-42,fy-66); g.lineTo(fx,fy-96); g.lineTo(fx+42,fy-66); g.closePath(); g.fill(); g.fillStyle='#F2B98B'; g.fillRect(fx-8, fy-30, 16, 20); if(i >= state.bucketsDelivered){ g.fillStyle='#fff'; g.fillRect(fx+18, fy-90, 110, 30); g.fillStyle='#2E4756'; g.font='14px sans-serif'; g.fillText(i===state.bucketsDelivered? 'We need water!':'So thirsty!', fx+24, fy-72); } });

    // enemies
    state.enemies.forEach(e=>{ const ex = worldX(e.xPct); const ey = groundY() - (e.y||0) - 18; g.fillStyle = e.type==='fly' ? '#2E4756' : '#3E5A2C'; g.beginPath(); g.ellipse(ex, ey, (e.w||36)/2, (e.h||24)/2, 0,0,Math.PI*2); g.fill(); });

    // player
    const px = worldX(state.player.xPct), py = groundY() - state.player.h - state.player.y; g.save(); g.translate(px, py); g.fillStyle='#F2B98B'; g.fillRect(-12,-36,24,24); g.fillStyle='#2E8F4B'; g.fillRect(-14,-26,28,6); g.fillStyle='#5C3FAE'; g.fillRect(-14,-6,28,26); g.fillStyle='#E2592B'; g.fillRect(-12,18,24,12); if(state.player.hasBucket){ g.fillStyle='#7A5230'; g.fillRect(-16,-56,32,12); g.fillStyle='#9AE6FF'; g.fillRect(-14,-50,28,6); } g.restore();

    // HUD hearts
    for(let i=0;i<3;i++){ g.fillStyle = i < state.hearts ? '#E84855' : '#6b6b6b'; g.beginPath(); g.ellipse(24 + i*34, 34, 10,9,0,0,Math.PI*2); g.fill(); }
  }

  // Main loop
  function step(ts){ if(!state.lastTs) state.lastTs = ts; const dt = Math.min(0.05, (ts - state.lastTs)/1000); state.lastTs = ts; if(state.running && !state.gameOver){ if(state.keys.left) state.player.xPct = Math.max(0, state.player.xPct - PLAYER_SPEED * dt); if(state.keys.right) state.player.xPct = Math.min(100, state.player.xPct + PLAYER_SPEED * dt); // physics
    state.player.vy += GRAVITY * dt; state.player.y += state.player.vy * dt; if(state.player.y > 0){ state.player.y = 0; state.player.vy = 0; state.player.onGround = true; }
    updateEnemies(dt); checkEnemyCollisions(); }
    render(); requestAnimationFrame(step); }

  // bootstrap
  function start(){ state.running = true; state.gameOver = false; state.timeLeft = START_TIME; state.lastTs = 0; state.bucketsDelivered = 0; state.hearts = 3; state.player.xPct = 50; state.player.y = 0; state.player.hasBucket = false; updateHUD(); rotateFacts(); spawnEnemies(); startTimer(); requestAnimationFrame(step); }

  if(retryBtn) retryBtn.addEventListener('click', ()=>{ overlay.classList.add('hidden'); start(); });
  if(menuBtn) menuBtn.addEventListener('click', ()=>location.reload());

  // start on load
  rotateFacts(); updateHUD(); spawnEnemies(); render(); start();

})();
