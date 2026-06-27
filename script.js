/* FETCH — Main game script
   Hooks the start overlay button to a real game loop for the DOM-based version of the page.
*/
(function () {
  'use strict';

  const TOTAL_BUCKETS = 4;
  const START_TIME = 120;
  const PLAYER_SPEED = 18;
  const MONSTER_SPEED = 16;
  const INTERACT_RANGE = 12;
  const INVINCIBLE_MS = 800;
  const TANK_X = 10;
  const HOUSE_X = 90;

  const FACTS = [
    '703 million people lack access to clean drinking water.',
    'Clean water improves health and education outcomes.',
    'Women and children often walk miles each day to collect water.',
    'Access to clean water transforms communities over generations.'
  ];

  const refs = {
    startOverlay: document.getElementById('start-overlay'),
    winOverlay: document.getElementById('win-overlay'),
    gameoverOverlay: document.getElementById('gameover-overlay'),
    gameoverReason: document.getElementById('gameover-reason'),
    timerEl: document.getElementById('timer'),
    bucketCountEl: document.getElementById('bucket-count'),
    hearts: Array.from(document.querySelectorAll('.heart')),
    player: document.getElementById('player'),
    monster: document.getElementById('monster'),
    tankPrompt: document.getElementById('tank-prompt'),
    housePrompt: document.getElementById('house-prompt'),
    familySpeech: document.getElementById('family-speech'),
    floatingText: document.getElementById('floating-text'),
    playerBucket: document.getElementById('player-bucket'),
    factText: document.getElementById('fact-text'),
    startBtn: document.getElementById('start-btn'),
    retryBtn: document.getElementById('retry-btn'),
    winResetBtn: document.getElementById('win-reset-btn'),
    resetBtn: document.getElementById('reset-btn'),
    btnLeft: document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    btnAction: document.getElementById('btn-action'),
    btnJump: document.getElementById('btn-jump'),
    winTime: document.getElementById('win-time'),
    winLives: document.getElementById('win-lives'),
    winBuckets: document.getElementById('win-buckets')
  };

  const state = {
    running: false,
    timeLeft: START_TIME,
    hearts: 3,
    bucketsDelivered: 0,
    hasBucket: false,
    playerX: 50,
    monsterX: 30,
    monsterDir: 1,
    invincibleUntil: 0,
    factIndex: 0,
    keys: { left: false, right: false },
    lastTs: 0
  };

  let frameRequest = null;
  let timerId = null;
  let factTimerId = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateTimerDisplay() {
    if (!refs.timerEl) return;
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    refs.timerEl.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
    refs.timerEl.classList.toggle('low-time', state.timeLeft <= 20 && state.timeLeft > 0);
  }

  function updateHearts() {
    refs.hearts.forEach((heart, index) => {
      heart.classList.toggle('lost', index >= state.hearts);
    });
  }

  function updateBucketCount() {
    if (!refs.bucketCountEl) return;
    refs.bucketCountEl.textContent = `${state.bucketsDelivered}/${TOTAL_BUCKETS}`;
    refs.bucketCountEl.classList.remove('bump');
    void refs.bucketCountEl.offsetWidth;
    refs.bucketCountEl.classList.add('bump');
  }

  function showFloating(text) {
    if (!refs.floatingText) return;
    refs.floatingText.textContent = text;
    refs.floatingText.classList.remove('show');
    void refs.floatingText.offsetWidth;
    refs.floatingText.classList.add('show');
  }

  function updatePrompts() {
    const nearTank = Math.abs(state.playerX - TANK_X) <= INTERACT_RANGE && !state.hasBucket && state.bucketsDelivered < TOTAL_BUCKETS;
    const nearHouse = Math.abs(state.playerX - HOUSE_X) <= INTERACT_RANGE && state.hasBucket;
    if (refs.tankPrompt) refs.tankPrompt.classList.toggle('show', nearTank);
    if (refs.housePrompt) refs.housePrompt.classList.toggle('show', nearHouse);
    if (refs.familySpeech) {
      refs.familySpeech.textContent = state.hasBucket ? 'Thank you!' : 'So thirsty!';
      refs.familySpeech.classList.toggle('hidden', state.bucketsDelivered >= TOTAL_BUCKETS);
    }
  }

  function renderWorld() {
    if (refs.player) {
      refs.player.style.left = `${state.playerX}%`;
      refs.player.classList.toggle('walking', state.keys.left || state.keys.right);
      refs.player.classList.toggle('facing-left', state.keys.left && !state.keys.right);
      refs.player.classList.toggle('invincible', performance.now() < state.invincibleUntil);
      if (refs.playerBucket) {
        refs.playerBucket.classList.toggle('visible', state.hasBucket);
      }
    }

    if (refs.monster) {
      refs.monster.style.left = `${state.monsterX}%`;
    }

    updatePrompts();
  }

  function startTimer() {
    clearInterval(timerId);
    timerId = window.setInterval(() => {
      if (!state.running) return;
      state.timeLeft -= 1;
      updateTimerDisplay();
      if (state.timeLeft <= 0) {
        endGame(false, 'You ran out of time.');
      }
    }, 1000);
  }

  function startFactRotation() {
    clearInterval(factTimerId);
    if (!refs.factText) return;
    refs.factText.textContent = FACTS[state.factIndex];
    factTimerId = window.setInterval(() => {
      refs.factText.classList.add('fade');
      window.setTimeout(() => {
        state.factIndex = (state.factIndex + 1) % FACTS.length;
        refs.factText.textContent = FACTS[state.factIndex];
        refs.factText.classList.remove('fade');
      }, 350);
    }, 8000);
  }

  function takeDamage() {
    if (!state.running || performance.now() < state.invincibleUntil) return;
    state.hearts = Math.max(0, state.hearts - 1);
    state.invincibleUntil = performance.now() + INVINCIBLE_MS;
    updateHearts();
    showFloating('Ouch!');
    if (refs.player) {
      refs.player.classList.remove('hurt');
      void refs.player.offsetWidth;
      refs.player.classList.add('hurt');
      window.setTimeout(() => refs.player.classList.remove('hurt'), 320);
    }
    if (state.hearts <= 0) {
      endGame(false, 'You lost all hearts.');
    }
  }

  function collectWater() {
    state.hasBucket = true;
    showFloating('Bucket filled');
    updateBucketCount();
    renderWorld();
  }

  function deliverWater() {
    state.hasBucket = false;
    state.bucketsDelivered += 1;
    showFloating('Delivered!');
    updateBucketCount();
    if (state.bucketsDelivered >= TOTAL_BUCKETS) {
      endGame(true, 'Mission complete!');
    } else {
      renderWorld();
    }
  }

  function handleAction() {
    if (!state.running) return;
    const nearTank = Math.abs(state.playerX - TANK_X) <= INTERACT_RANGE && !state.hasBucket && state.bucketsDelivered < TOTAL_BUCKETS;
    const nearHouse = Math.abs(state.playerX - HOUSE_X) <= INTERACT_RANGE && state.hasBucket;

    if (nearTank) {
      collectWater();
    } else if (nearHouse) {
      deliverWater();
    }
  }

  function tryJump() {
    if (!state.running) return;
    showFloating('Jump!');
  }

  function endGame(isWin, reason) {
    if (!state.running) return;
    state.running = false;
    clearInterval(timerId);
    clearInterval(factTimerId);
    if (isWin) {
      refs.winTime.textContent = `${Math.floor(state.timeLeft / 60)}:${String(state.timeLeft % 60).padStart(2, '0')}`;
      refs.winLives.textContent = String(state.hearts);
      refs.winBuckets.textContent = String(state.bucketsDelivered);
      refs.winOverlay.classList.remove('hidden');
      refs.gameoverOverlay.classList.add('hidden');
      refs.startOverlay.classList.add('hidden');
    } else {
      refs.gameoverReason.textContent = reason;
      refs.gameoverOverlay.classList.remove('hidden');
      refs.winOverlay.classList.add('hidden');
      refs.startOverlay.classList.add('hidden');
    }
  }

  function updateGame(dt) {
    if (!state.running) return;

    if (state.keys.left) {
      state.playerX = clamp(state.playerX - PLAYER_SPEED * dt, 8, 92);
    }
    if (state.keys.right) {
      state.playerX = clamp(state.playerX + PLAYER_SPEED * dt, 8, 92);
    }

    state.monsterX += state.monsterDir * MONSTER_SPEED * dt;
    if (state.monsterX >= 72) {
      state.monsterX = 72;
      state.monsterDir = -1;
    } else if (state.monsterX <= 28) {
      state.monsterX = 28;
      state.monsterDir = 1;
    }

    const distanceToMonster = Math.abs(state.playerX - state.monsterX);
    if (distanceToMonster < 10) {
      takeDamage();
    }

    renderWorld();
  }

  function tick(timestamp) {
    if (!state.lastTs) {
      state.lastTs = timestamp;
    }
    const dt = Math.min(0.03, (timestamp - state.lastTs) / 1000);
    state.lastTs = timestamp;
    updateGame(dt);
    frameRequest = window.requestAnimationFrame(tick);
  }

  function startGame() {
    state.running = true;
    state.timeLeft = START_TIME;
    state.hearts = 3;
    state.bucketsDelivered = 0;
    state.hasBucket = false;
    state.playerX = 50;
    state.monsterX = 30;
    state.monsterDir = 1;
    state.invincibleUntil = 0;
    state.lastTs = 0;
    updateHearts();
    updateTimerDisplay();
    updateBucketCount();
    renderWorld();
    refs.startOverlay.classList.add('hidden');
    refs.winOverlay.classList.add('hidden');
    refs.gameoverOverlay.classList.add('hidden');
    startTimer();
    startFactRotation();
    if (frameRequest) {
      window.cancelAnimationFrame(frameRequest);
    }
    frameRequest = window.requestAnimationFrame(tick);
  }

  function resetGame() {
    clearInterval(timerId);
    clearInterval(factTimerId);
    if (frameRequest) {
      window.cancelAnimationFrame(frameRequest);
    }
    refs.startOverlay.classList.remove('hidden');
    refs.winOverlay.classList.add('hidden');
    refs.gameoverOverlay.classList.add('hidden');
    state.running = false;
    state.timeLeft = START_TIME;
    state.hearts = 3;
    state.bucketsDelivered = 0;
    state.hasBucket = false;
    state.playerX = 50;
    state.monsterX = 30;
    state.monsterDir = 1;
    state.invincibleUntil = 0;
    updateHearts();
    updateTimerDisplay();
    updateBucketCount();
    renderWorld();
  }

  function bindHold(element, onDown, onUp) {
    if (!element) return;
    const downHandler = (event) => {
      event.preventDefault();
      onDown();
    };
    const upHandler = (event) => {
      event.preventDefault();
      onUp();
    };
    element.addEventListener('touchstart', downHandler, { passive: false });
    element.addEventListener('mousedown', downHandler);
    element.addEventListener('touchend', upHandler);
    element.addEventListener('touchcancel', upHandler);
    element.addEventListener('mouseup', upHandler);
    element.addEventListener('mouseleave', upHandler);
  }

  function bindInputs() {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        state.keys.left = true;
      }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        state.keys.right = true;
      }
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        tryJump();
      }
      if (event.code === 'KeyE') {
        event.preventDefault();
        handleAction();
      }
    });

    window.addEventListener('keyup', (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        state.keys.left = false;
      }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        state.keys.right = false;
      }
    });

    bindHold(refs.btnLeft, () => { state.keys.left = true; }, () => { state.keys.left = false; });
    bindHold(refs.btnRight, () => { state.keys.right = true; }, () => { state.keys.right = false; });
    if (refs.btnJump) {
      refs.btnJump.addEventListener('click', tryJump);
      refs.btnJump.addEventListener('touchstart', (event) => {
        event.preventDefault();
        tryJump();
      }, { passive: false });
    }
    if (refs.btnAction) {
      refs.btnAction.addEventListener('click', handleAction);
      refs.btnAction.addEventListener('touchstart', (event) => {
        event.preventDefault();
        handleAction();
      }, { passive: false });
    }
  }

  function attachButtons() {
    if (refs.startBtn) {
      refs.startBtn.addEventListener('click', startGame);
    }
    if (refs.retryBtn) {
      refs.retryBtn.addEventListener('click', startGame);
    }
    if (refs.winResetBtn) {
      refs.winResetBtn.addEventListener('click', startGame);
    }
    if (refs.resetBtn) {
      refs.resetBtn.addEventListener('click', resetGame);
    }
  }

  function init() {
    bindInputs();
    attachButtons();
    updateHearts();
    updateTimerDisplay();
    updateBucketCount();
    renderWorld();
    startFactRotation();
  }

  init();
})();
