/* ===================================================================
   FETCH — Game Logic
   A charity: water inspired browser game.
   Organized into clearly commented sections / functions as requested:
   initializeGame, movePlayer, collectWater, deliverWater,
   monsterMovement, checkCollisions, updateHUD, loseLife,
   winGame, gameOver, resetGame.
=================================================================== */

(function () {
  "use strict";

  /* ================= CONSTANTS ================= */
  const TANK_X = 8;            // % position of water tank
  const HOUSE_X = 90;           // % position of house/family
  const WORLD_MIN_X = 4;
  const WORLD_MAX_X = 96;
  const INTERACT_RANGE = 9;     // % distance to allow collect/deliver
  const MONSTER_HIT_RANGE = 6;  // % distance counted as a collision
  const MONSTER_MIN_X = 16;
  const MONSTER_MAX_X = 46;
  const MONSTER_SPEED = 14;     // %/second
  const PLAYER_SPEED = 32;      // %/second
  const TOTAL_BUCKETS = 4;
  const START_TIME = 120;       // seconds (2:00)
  const INVINCIBLE_MS = 2000;
  const KNOCKBACK_AMOUNT = 8;   // % pushed away from monster

  const FACTS = [
    "703 million people lack access to clean drinking water.",
    "Clean water helps children stay healthy and attend school.",
    "Many families walk miles each day to collect water.",
    "Women and girls spend 200 million hours every day collecting water.",
    "Access to clean water can transform an entire community's future.",
    "Every dollar invested in clean water returns gains in health, time, and education."
  ];

  /* ================= DOM REFERENCES ================= */
  const dom = {
    hearts: document.querySelectorAll(".heart"),
    timer: document.getElementById("timer"),
    bucketCount: document.getElementById("bucket-count"),
    world: document.getElementById("game-world"),
    player: document.getElementById("player"),
    playerBucket: document.getElementById("player-bucket"),
    floatingText: document.getElementById("floating-text"),
    monster: document.getElementById("monster"),
    tank: document.getElementById("water-tank"),
    tankPrompt: document.getElementById("tank-prompt"),
    house: document.getElementById("house"),
    housePrompt: document.getElementById("house-prompt"),
    family: document.getElementById("family"),
    familySpeech: document.getElementById("family-speech"),
    factText: document.getElementById("fact-text"),
    screenFlash: document.getElementById("screen-flash"),
    startOverlay: document.getElementById("start-overlay"),
    winOverlay: document.getElementById("win-overlay"),
    gameoverOverlay: document.getElementById("gameover-overlay"),
    gameoverReason: document.getElementById("gameover-reason"),
    winTime: document.getElementById("win-time"),
    winLives: document.getElementById("win-lives"),
    winBuckets: document.getElementById("win-buckets"),
    startBtn: document.getElementById("start-btn"),
    retryBtn: document.getElementById("retry-btn"),
    winResetBtn: document.getElementById("win-reset-btn"),
    resetBtn: document.getElementById("reset-btn"),
    btnLeft: document.getElementById("btn-left"),
    btnRight: document.getElementById("btn-right"),
    btnJump: document.getElementById("btn-jump"),
    btnAction: document.getElementById("btn-action"),
    confettiCanvas: document.getElementById("confetti-canvas")
  };

  /* ================= GAME STATE ================= */
  let state = {};

  function freshState() {
    return {
      playerX: 50,
      facing: "right",
      isJumping: false,
      isWalking: false,
      hasBucket: false,
      bucketsDelivered: 0,
      hearts: 3,
      invincibleUntil: 0,
      timeLeft: START_TIME,
      monsterX: 30,
      monsterDir: 1,
      keys: { left: false, right: false },
      running: false,
      gameOver: false,
      factIndex: 0,
      lastTimestamp: 0
    };
  }

  /* ================= AUDIO (synthesized — no external files needed) ================= */
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type, startDelay, volume) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (startDelay || 0);
      gain.gain.setValueAtTime(volume || 0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      /* Audio not available — fail silently */
    }
  }

  const sfx = {
    collect: () => { playTone(520, 0.12, "sine", 0, 0.18); playTone(740, 0.15, "sine", 0.08, 0.15); },
    deliver: () => { playTone(523, 0.15, "triangle", 0, 0.2); playTone(659, 0.15, "triangle", 0.12, 0.2); playTone(784, 0.2, "triangle", 0.24, 0.2); },
    hit: () => { playTone(160, 0.25, "sawtooth", 0, 0.2); },
    gameover: () => { playTone(300, 0.2, "sine", 0, 0.2); playTone(220, 0.25, "sine", 0.18, 0.2); playTone(140, 0.35, "sine", 0.4, 0.2); },
    victory: () => { [523, 659, 784, 1046].forEach((f, i) => playTone(f, 0.22, "triangle", i * 0.13, 0.2)); },
    hover: () => { playTone(880, 0.05, "sine", 0, 0.06); },
    click: () => { playTone(660, 0.08, "square", 0, 0.1); }
  };

  /* ================= INITIALIZATION ================= */
  function initializeGame() {
    state = freshState();
    updateHUD();
    positionEntities();
    attachInputHandlers();
    attachUIHandlers();
    rotateFacts();
    dom.startOverlay.classList.remove("hidden");
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    state.running = true;
    state.gameOver = false;
    dom.startOverlay.classList.add("hidden");
    startTimer();
  }

  /* ================= INPUT HANDLERS ================= */
  function attachInputHandlers() {
    document.addEventListener("keydown", (e) => {
      if (!state.running) return;
      switch (e.code) {
        case "KeyA":
        case "ArrowLeft":
          state.keys.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          state.keys.right = true;
          break;
        case "Space":
          e.preventDefault();
          triggerJump();
          break;
        case "KeyE":
          handleActionKey();
          break;
      }
    });

    document.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyA":
        case "ArrowLeft":
          state.keys.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          state.keys.right = false;
          break;
      }
    });

    // Touch controls
    bindHold(dom.btnLeft, () => (state.keys.left = true), () => (state.keys.left = false));
    bindHold(dom.btnRight, () => (state.keys.right = true), () => (state.keys.right = false));
    dom.btnJump.addEventListener("touchstart", (e) => { e.preventDefault(); triggerJump(); });
    dom.btnJump.addEventListener("click", () => triggerJump());
    dom.btnAction.addEventListener("touchstart", (e) => { e.preventDefault(); handleActionKey(); });
    dom.btnAction.addEventListener("click", () => handleActionKey());
  }

  function bindHold(el, onDown, onUp) {
    el.addEventListener("touchstart", (e) => { e.preventDefault(); onDown(); });
    el.addEventListener("touchend", (e) => { e.preventDefault(); onUp(); });
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("mouseleave", onUp);
  }

  function handleActionKey() {
    if (!state.running) return;
    if (isNear(TANK_X)) {
      collectWater();
    } else if (isNear(HOUSE_X)) {
      deliverWater();
    }
  }

  function isNear(targetX) {
    return Math.abs(state.playerX - targetX) <= INTERACT_RANGE;
  }

  /* ================= UI BUTTON HANDLERS ================= */
  function attachUIHandlers() {
    [dom.startBtn, dom.retryBtn, dom.winResetBtn, dom.resetBtn].forEach((btn) => {
      btn.addEventListener("mouseenter", sfx.hover);
    });

    dom.startBtn.addEventListener("click", () => { sfx.click(); startGame(); });
    dom.retryBtn.addEventListener("click", () => { sfx.click(); resetGame(); startGame(); });
    dom.winResetBtn.addEventListener("click", () => { sfx.click(); resetGame(); startGame(); });
    dom.resetBtn.addEventListener("click", () => { sfx.click(); resetGame(); });
  }

  /* ================= MOVEMENT ================= */
  function movePlayer(dt) {
    let moved = false;
    if (state.keys.left) {
      state.playerX -= PLAYER_SPEED * dt;
      state.facing = "left";
      moved = true;
    }
    if (state.keys.right) {
      state.playerX += PLAYER_SPEED * dt;
      state.facing = "right";
      moved = true;
    }
    state.playerX = clamp(state.playerX, WORLD_MIN_X, WORLD_MAX_X);
    state.isWalking = moved;
  }

  function triggerJump() {
    if (state.isJumping || !state.running) return;
    state.isJumping = true;
    dom.player.classList.add("jumping");
    setTimeout(() => {
      state.isJumping = false;
      dom.player.classList.remove("jumping");
    }, 550);
  }

  /* ================= WATER COLLECTION / DELIVERY ================= */
  function collectWater() {
    if (state.hasBucket) return; // already carrying one
    state.hasBucket = true;
    dom.playerBucket.classList.add("visible");
    showFloatingText("+1 Bucket Collected");
    sfx.collect();
  }

  function deliverWater() {
    if (!state.hasBucket) return; // nothing to deliver
    state.hasBucket = false;
    dom.playerBucket.classList.remove("visible");
    state.bucketsDelivered++;
    showFloatingText("Family Helped!");
    sfx.deliver();
    cheerFamily();
    updateHUD();

    if (state.bucketsDelivered >= TOTAL_BUCKETS) {
      winGame();
    }
  }

  function showFloatingText(text) {
    dom.floatingText.textContent = text;
    dom.floatingText.classList.remove("show");
    // restart animation
    void dom.floatingText.offsetWidth;
    dom.floatingText.classList.add("show");
  }

  function cheerFamily() {
    dom.family.classList.add("cheering");
    dom.familySpeech.classList.add("hidden");
    setTimeout(() => dom.family.classList.remove("cheering"), 1000);
  }

  /* ================= MONSTER ================= */
  function monsterMovement(dt) {
    state.monsterX += state.monsterDir * MONSTER_SPEED * dt;
    if (state.monsterX >= MONSTER_MAX_X) {
      state.monsterX = MONSTER_MAX_X;
      state.monsterDir = -1;
    } else if (state.monsterX <= MONSTER_MIN_X) {
      state.monsterX = MONSTER_MIN_X;
      state.monsterDir = 1;
    }
    dom.monster.style.left = state.monsterX + "%";
  }

  /* ================= COLLISIONS ================= */
  function checkCollisions() {
    const now = performance.now();
    const isInvincible = now < state.invincibleUntil;
    const touchingMonster = Math.abs(state.playerX - state.monsterX) <= MONSTER_HIT_RANGE;

    if (touchingMonster && !isInvincible && !state.isJumping && state.running) {
      loseLife();
    }

    // Show interaction prompts
    dom.tankPrompt.classList.toggle("show", isNear(TANK_X) && !state.hasBucket && state.running);
    dom.housePrompt.classList.toggle("show", isNear(HOUSE_X) && state.hasBucket && state.running);
  }

  /* ================= HEARTS / DAMAGE ================= */
  function loseLife() {
    state.hearts = Math.max(0, state.hearts - 1);
    const heartEl = dom.hearts[state.hearts]; // the heart that just became "lost"
    if (heartEl) heartEl.classList.add("lost");

    sfx.hit();
    flashScreen();
    knockBack();

    state.invincibleUntil = performance.now() + INVINCIBLE_MS;
    dom.player.classList.add("invincible", "hurt");
    setTimeout(() => dom.player.classList.remove("hurt"), 900);
    setTimeout(() => dom.player.classList.remove("invincible"), INVINCIBLE_MS);

    if (state.hearts <= 0) {
      gameOver("monster");
    }
  }

  function flashScreen() {
    dom.screenFlash.classList.remove("flash");
    void dom.screenFlash.offsetWidth;
    dom.screenFlash.classList.add("flash");
  }

  function knockBack() {
    const direction = state.playerX < state.monsterX ? -1 : 1;
    state.playerX = clamp(state.playerX + direction * KNOCKBACK_AMOUNT, WORLD_MIN_X, WORLD_MAX_X);
  }

  /* ================= HUD ================= */
  function updateHUD() {
    dom.bucketCount.textContent = `${state.bucketsDelivered}/${TOTAL_BUCKETS}`;
    dom.bucketCount.classList.remove("bump");
    void dom.bucketCount.offsetWidth;
    dom.bucketCount.classList.add("bump");
  }

  function updateTimerDisplay() {
    const mins = Math.floor(state.timeLeft / 60);
    const secs = state.timeLeft % 60;
    dom.timer.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
    dom.timer.classList.toggle("low-time", state.timeLeft <= 20 && state.timeLeft > 0);
  }

  let timerInterval = null;
  function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      if (!state.running) return;
      state.timeLeft--;
      updateTimerDisplay();
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        updateTimerDisplay();
        gameOver("time");
      }
    }, 1000);
  }

  /* ================= EDUCATIONAL FACTS ================= */
  let factInterval = null;
  function rotateFacts() {
    dom.factText.textContent = FACTS[state.factIndex];
    clearInterval(factInterval);
    factInterval = setInterval(() => {
      dom.factText.classList.add("fade");
      setTimeout(() => {
        state.factIndex = (state.factIndex + 1) % FACTS.length;
        dom.factText.textContent = FACTS[state.factIndex];
        dom.factText.classList.remove("fade");
      }, 400);
    }, 10000);
  }

  /* ================= WIN ================= */
  function winGame() {
    state.running = false;
    clearInterval(timerInterval);
    dom.winTime.textContent = formatTime(state.timeLeft);
    dom.winLives.textContent = state.hearts;
    dom.winBuckets.textContent = `${state.bucketsDelivered}/${TOTAL_BUCKETS}`;
    dom.winOverlay.classList.remove("hidden");
    sfx.victory();
    launchConfetti();
  }

  function formatTime(t) {
    const mins = Math.floor(t / 60);
    const secs = t % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /* ================= GAME OVER ================= */
  function gameOver(reason) {
    state.running = false;
    state.gameOver = true;
    clearInterval(timerInterval);
    dom.gameoverReason.textContent =
      reason === "time"
        ? "You ran out of time."
        : "You ran out of lives to the Dirty Water Monster.";
    dom.gameoverOverlay.classList.remove("hidden");
    sfx.gameover();
  }

  /* ================= RESET ================= */
  function resetGame() {
    clearInterval(timerInterval);
    clearInterval(factInterval);
    state = freshState();

    // Reset DOM
    dom.hearts.forEach((h) => h.classList.remove("lost"));
    dom.playerBucket.classList.remove("visible");
    dom.player.classList.remove("invincible", "hurt", "jumping", "facing-left", "walking");
    dom.family.classList.remove("cheering");
    dom.familySpeech.classList.remove("hidden");
    dom.tankPrompt.classList.remove("show");
    dom.housePrompt.classList.remove("show");
    dom.winOverlay.classList.add("hidden");
    dom.gameoverOverlay.classList.add("hidden");
    dom.startOverlay.classList.add("hidden");
    updateHUD();
    updateTimerDisplay();
    positionEntities();
    rotateFacts();
  }

  /* ================= RENDER HELPERS ================= */
  function positionEntities() {
    dom.player.style.left = state.playerX + "%";
    dom.monster.style.left = state.monsterX + "%";
  }

  function renderPlayer() {
    dom.player.style.left = state.playerX + "%";
    dom.player.classList.toggle("facing-left", state.facing === "left");
    dom.player.classList.toggle("walking", state.isWalking && state.running);
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /* ================= CONFETTI (canvas particle effect) ================= */
  function launchConfetti() {
    const canvas = dom.confettiCanvas;
    const ctx = canvas.getContext("2d");
    const colors = ["#FFC907", "#77A8BB", "#2E4756", "#FFFFFF", "#4CAF50", "#E84855"];
    let particles = [];

    function resize() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    resize();

    for (let i = 0; i < 140; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: 2 + Math.random() * 3,
        speedX: -1.5 + Math.random() * 3,
        rotation: Math.random() * 360,
        spin: -6 + Math.random() * 12
      });
    }

    let frame = 0;
    const maxFrames = 260;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      frame++;
      if (frame < maxFrames && dom.winOverlay && !dom.winOverlay.classList.contains("hidden")) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    animate();
  }

  /* ================= MAIN GAME LOOP ================= */
  function gameLoop(timestamp) {
    if (!state.lastTimestamp) state.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - state.lastTimestamp) / 1000, 0.05); // seconds, capped
    state.lastTimestamp = timestamp;

    if (state.running) {
      movePlayer(dt);
      monsterMovement(dt);
      checkCollisions();
    }
    renderPlayer();

    requestAnimationFrame(gameLoop);
  }

  /* ================= BOOT ================= */
  document.addEventListener("DOMContentLoaded", initializeGame);
})();
