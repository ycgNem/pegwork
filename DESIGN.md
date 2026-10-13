# Pegwork — Design model

Every number derives from this file. These are **starting hypotheses for the slice**, tuned by
play and by the pace tests, never by looking at another game. Change a number → write the new
derivation here first.

## 1. Units and the physics

- Tick 1/60 s. Logical pixels. The board is **20 × 28 cells of 8 px** (160 × 224 px), drawn
  at the left of the 384 × 216 screen. *Decided in M0 (DECISIONS #9):* row 0 is the hopper
  above the screen (marbles release at y = 4 px), row 1 is the drop rail at the top edge, the
  screen shows rows 1–27; no parts in rows 0–1, cups in rows 26–27.
- **The frame**: two walls, a ceiling over the hopper, and a 45° **shoulder** on each wall at
  row 3, one cell in and one cell down (DECISIONS #11): no cell-snapped peg can reach the lane
  along a wall, so without it columns 1 and 20 fall straight into the outer cups.
- **Marble**: radius 3 px. Gravity **600 px/s²**. Terminal speed 400 px/s. Air drag none.
- **Collision**: circle vs. circle (pegs are circles r = 3), circle vs. segment (board walls,
  ramps, gate flaps, cup walls). Restitution: peg **0.55**, bumper **0.95**, wall **0.4**,
  cup wall **0.2**. Tangential friction 0.02 per contact. Sub-stepped 4× per tick so a marble
  at 400 px/s moves ≤ 1.7 px per sub-step and never tunnels.
- **Determinism**: integer-seeded RNG, fixed-point-safe math (all positions and velocities
  rounded to 1/256 px after each sub-step), no `Math.random`, no time. Same seed + same
  commands = same drop. The Dry Run uses this to run 300 drops in under 50 ms.
- **Drop**: the player picks a column (20) and the marble releases from the rail at that
  column's center **± 1 px of seeded jitter**, never within **1/16 px** of dead center (a
  dead-center drop onto a peg balances on it; DECISIONS #13). Skill chooses the column; luck is
  the pixel.
- **Rounding**: positions round to the nearest 1/256 px, velocities toward zero, so a bounce
  never gains energy even by rounding (DECISIONS #14). **Marbles don't touch each other**
  (DECISIONS #10): the Dry Run of one marble is what every live marble faces.
- **The rail tap** (safety net): a marble below 4 px/s for 30 ticks gets a 24 px/s sideways tap
  (direction from its own seeded stream); one still in play after 1,800 ticks is jammed and pays
  0. Taps are counted; the base board needs none (§8.1).

## 2. Payout

`payout = stake × cupMultiplier × Π tags`, tags from Bumpers (×1.2 each, cap ×3 total) and
Spinners (×1.5 once). A marble in a Trap pays 0. A Splitter makes two marbles at half stake.

**Base board** (what you start with): 5 cups across the bottom at ×0, ×1, ×3, ×1, ×0 spanning
4 cells each; 24 pegs in a staggered field. Derived by simulation at M1 start and written
here: target **base EV ≈ 0.90** per stake from the best column, ≈ 0.75 from the worst. The
base board loses money on purpose; the game is fixing that.

*Measured in M0* (Steel, 3,000 drops a column, seed 1, ±0.02 each; `npx vite-node scripts/ev.ts`
for 300): the 24 pegs sit on a staggered lattice (even rows 4–22, alternate rows offset a cell),
chosen by hill climb (`scripts/tune-base.ts`) with the frame's shoulders at row 3. EV by column
1–20: 0.89 0.84 0.79 0.88 0.88 0.93 **0.73** 0.76 0.88 0.91 0.90 0.87 0.85 0.81 0.85 0.89 0.76
0.83 0.74 **0.94**. **Best 0.94 (column 20), worst 0.73 (column 7)**, mean 0.85. No column
needs a rail tap in 60,000 drops. The best column is not the middle one: the field throws
center drops outward and edge drops inward, so the board has to be read, not assumed.

## 3. Parts (first set)

| Part | Cost | Durability (drops) | Repair | What it does to the distribution |
|---|---|---|---|---|
| Peg | $5 | 60 | $2 | deflects; the basic shaping tool |
| Bumper | $20 | 30 | $8 | restitution 0.95, tags ×1.2 (cap ×3) |
| Gate | $15 | 40 | $5 | one-way flap: pushes mass toward one side |
| Funnel | $25 | 50 | $8 | narrows a 4-cell span to 2 |
| Spinner | $40 | 25 | $15 | paddle, 1 rev / 1.5 s, phase fixed per duel; tags ×1.5 |
| Splitter | $50 | 20 | $20 | one marble → two at half stake |
| Magnet | $35 | 40 | $12 | 120 px/s² pull within 24 px |
| Trap | $0 (rivals place them) | 100 | — | eats the marble |
| Cup ×5 | $60 | 80 | $20 | replaces a ×1 or ×3 cup |
| Cup ×20 | $150 | 40 | $60 | 2 cells wide only |

Durability counts marble contacts. A part at 0 is **bent**: it stays on the board but its
behavior degrades (pegs become restitution 0.3 and off-center by 1 px; bumpers lose their tag;
cups lose one multiplier step) until repaired. This is the maintenance loop: a board of 40
parts costs roughly **$60–120 a duel** to keep true.

## 4. Marbles (first set)

| Marble | Cost each | Mass | Restitution mod | Rule |
|---|---|---|---|---|
| Steel | $2 | 1.0 | ×1.0 | — |
| Glass | $1 | 0.6 | ×1.3 | shatters in a Trap (no refund of stake) |
| Lead | $4 | 1.8 | ×0.6 | breaks a Trap (destroys it), dents a Cup (−1 durability step) |
| Lucky | $6 | 1.0 | ×1.0 | the first contact that sends it toward a ×0 cup is re-rolled |
| Twin | $5 | 0.8 | ×1.0 | splits at its first peg, half stake each |
| Ember | $8 | 1.0 | ×1.0 | tags ×2, and burns 10 durability off every part it touches |

## 5. The duel (slice numbers)

Ante: rivals of town 1 ante **$20**; bankroll starts **$200**. Five rounds; each round, three
marbles at a stake of your choice from **$2 to $20 each** (capped at 10% of bankroll).
Round payouts and losses hit the bankroll immediately; the pot (2 × ante) goes to the higher
five-round profit. Ties return antes. A rival's board is fixed per rival and visible; their
column choice is a bot (town-1 rivals pick their best EV column from their own Dry Run with
±2 columns of noise; the boss picks the true best).

Derived: with the base board (EV 0.90) at a $10 stake, three marbles a round, five rounds,
you expect −$15 per duel in drops and a coin-flip on the $40 pot. *(M0 measured the best column
at 0.94, so −$9 a duel from the best column; −$40 from the worst. M1 checks §8.2 against this.)* A player who buys and places
two Bumpers and a Gate before duel 1 ($55) can push the best column's EV to ~1.15 (M1 writes
the measured number here), turning the duel into +$22 expected in drops and a ~65% pot. Town
1 is winnable by building; it is not winnable by not building.

## 6. The Dry Run

Always available for your own board. Simulates **300 drops per column** of the selected
marble and shows a histogram of payout per stake, the mean (EV) **with its ± (one standard
error, ≈ 0.06 at 300 drops on the base board)**, the hit rate of each cup, and the expected wear
cost. The ± is part of the honesty: at 300 drops a 0.94 column can read 1.04 (DECISIONS #12). Hustle nodes add: a heatmap of contacts per part (where wear
will land), rival boards (scout), and the wear forecast for the whole duel. The Dry Run is the
game's tutorial: the first lesson card points at the EV number and says "this is what you're
betting on."

## 7. Skill trees (slice: the first three nodes of each; 1 point per duel won)

**Tinker**: T1 repairs cost half · T2 two parts may share a cell edge (denser fields) ·
T3 Spinner phase is shown in the Dry Run and chosen per duel.
**Marbles**: M1 bag holds 12 (from 6) · M2 mixed drops (three different marbles a round) ·
M3 Lead no longer dents Cups.
**Hustle**: H1 Dry Run shows the contact heatmap · H2 side bet: name your column's cup before
the drop for ×1.5 on that marble if right · H3 scout rival boards in the Dry Run.

Rule: **every node moves the distribution or the knowledge of it.** The data validation test
rejects a node whose effect is a flat multiplier on payout.

## 8. Derived checks (these become pace tests, 20 seeds)

1. **Base board EV** measured over ~~300~~ **3,000** drops × 20 columns is in 0.70–0.95 from
   every column, best column 0.85–0.95, and no drop needs a rail tap. *(3,000 since M0: at 300
   the noisiest of 20 columns sits ±0.12 off its true value, wider than the band; DECISIONS
   #12. Measured: best 0.94, worst 0.73.)*
2. **Never-builds** bot (plays the base board, best column, $10 stakes) is out of bankroll
   by the end of town 2 on ≥ 16/20 seeds.
3. **Random-builder** bot (spends all money on random parts in random cells) wins fewer
   town-1 duels than the **EV-builder** bot (buys the part that most raises best-column EV
   per dollar in the Dry Run) on ≥ 16/20 seeds.
4. **Wear bites**: the EV-builder with repairs disabled drops ≥ 0.15 EV between duel 1 and
   duel 4.
5. **Marbles matter**: on the EV-builder's duel-4 board, the best marble choice differs from
   Steel on ≥ 10/20 seeds (the bag isn't cosmetic).
6. **Determinism**: a recorded duel replayed from its command log is bit-identical, and the
   Dry Run's 300-drop histogram for a board is identical across runs.
7. **Town-1 boss** (true-best column, a Trap placed on your board each round) beats the
   never-builds bot 20/20 and loses to the EV-builder on ≥ 10/20.

## 9. What the slice must answer

1. Does reading the Dry Run and changing the board feel like the game, or like homework before
   the game?
2. Does a marble's path feel honest (you can see why it landed where it did)?
3. Is the duel tense without a debt counter?
4. Does wear make you care about the board as an object?

If any answer is no, fix the model here before Milestone 3.
