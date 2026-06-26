# Fetch 💧

A small browser game inspired by charity: water's mission to bring clean drinking water to communities in need. Collect clean water, deliver it to a thirsty family, and avoid the Dirty Water Monster — all before the timer runs out.

Built with plain **HTML, CSS, and JavaScript** — no frameworks, engines, or build step required.

## Files

```
index.html   Game markup and overlays (start, win, game over)
style.css    Visuals, layout, animations, responsive rules
script.js    Game logic (movement, collisions, timer, audio, confetti)
```

## How to run

No installation needed.

1. Download all three files into the same folder.
2. Double-click `index.html` (or open it in any modern browser).

To run it from a local server instead (optional, e.g. for testing on mobile):

```
npx serve .
```

## How to play

**Goal:** Deliver 4 buckets of clean water to the family before the 2-minute timer hits zero.

1. Walk to the water tank and collect a bucket.
2. Carry it across the level to the family's house and deliver it.
3. Repeat until all 4 buckets are delivered.
4. Avoid the Dirty Water Monster patrolling the level — touching it costs a heart.

You have 3 hearts. Lose them all, or run out of time, and it's game over — but you can always hit **Reset** and try again.

### Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move left/right | `A` / `D` (or arrow keys) | ◀ / ▶ on-screen buttons |
| Jump | `Space` | ⤴ button |
| Collect / deliver water | `E` | "E" button |

Touch controls appear automatically on phones and tablets.

## Features

- Responsive layout that scales from desktop to mobile, with a fixed top HUD
- Hearts, countdown timer, and bucket counter with live visual feedback
- Patrolling monster with knockback, screen flash, and brief invincibility on hit
- Win screen with confetti, victory chime, and a stats summary
- Game over screen with a one-click Retry
- Rotating educational facts about the global water crisis, refreshed every 10 seconds
- All sound effects are synthesized in-browser via the Web Audio API — no audio files to load
- charity: water inspired color palette (yellow `#FFC907`, blue `#77A8BB`)

## Credits / learn more

This project is a fan-made educational game and is **not officially affiliated** with charity: water. Learn more about their work and donate at [charitywater.org](https://www.charitywater.org).
