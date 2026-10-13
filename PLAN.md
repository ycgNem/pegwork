# Pegwork — Plan

*Working title. Written 2026-10-13, before any code. Rename freely; check itch.io, Steam and
the domain before the first public build.*

## The pitch

A pixel-art gambling roguelike where **you build the machine you gamble on**. You're a
travelling marble hustler with a vertical board of pegs, bumpers, gates and cups. Each duel
you and a rival drop marbles down your own boards for a pot. Between duels you buy parts,
bolt them onto your board, pick your marbles, and skill up. The complexity isn't in the pull:
it's in the engineering. The game shows you your machine's payout distribution before you bet
on it, and the whole run is you turning a board that loses money into one that prints it,
while parts wear out and rivals get sharper.

**The one thing: the odds are yours to build, and you can see them.** Gambling games hide the
math. This one hands you the math (a dry-run simulator with histograms) and makes the board the
thing you're really betting on.

**Tone:** workshop-and-midway. Brass, felt, chalk, sawdust, carnival paint. Playful, a little
crooked, never grim.

## Feel references (one quality each, nothing else)

- *CloverPit*: the pleasure of a build that snowballs into absurd payouts.
- *Luck Be a Landlord*: small decisions every round that compound.

Neither game's loop, machine, symbols, items, rent/debt frame, numbers, names or UI appear
here. Both are slot machines you play; this is a marble machine you build and duel with.

## The removal test

> "If you removed building the board and seeing its distribution, what's left is a plinko
> gambling app with a shop."

A feature earns its place only if it changes the board's distribution or what you can learn
about it. Pace tests: a bot that never builds must lose by town 2; an EV-guided builder must
beat a random builder on the same parts.

## Pillars

1. **You build the odds.** Every part changes where marbles land. There is no payout that
   isn't the geometry's fault.
2. **The math is on the table.** The Dry Run simulates hundreds of drops instantly and shows
   the histogram per drop column. Skill is reading it, not guessing it.
3. **Parts wear.** Pegs bend, bumpers crack, cups dent. A machine is a thing you maintain,
   and a great board you can't afford to repair is a bad board. (The simulator vibe.)
4. **Duels, not rent.** Pressure comes from a rival with their own board and a pot, not a
   counter that demands money. Lose the duel, lose the ante. Lose your bankroll, lose the run.
5. **Three ways to be good.** Tinker (parts and board), Marbles (what you drop), Hustle (bets,
   reads, side action, the simulator itself). Each tree changes the board's distribution or
   your knowledge of it; nothing is a flat +x%.
6. **Readable at a glance.** One screen. The board, the cups, the histogram, the bankroll.
   A marble's path is visible and honest.

## The run

A circuit of four towns; each town has three rivals and a boss hustler. Sixteen duels. Between
duels: the parts market, the workshop (place, rotate, repair, sell), the marble bag, the skill
trees, and the Dry Run. Lose your bankroll (can't cover the next ante) and the run ends. Meta
between runs: new parts and marbles enter the market pool through achievements; nothing is
bought with real money, ever.

## The duel

Both players ante. Five rounds. Each round, each player picks a drop column and a stake per
marble, and drops three marbles down their own board. A marble's payout = stake × its cup's
multiplier × the tags it picked up on the way (bumpers, spinners). Rival boards are visible;
the Hustle tree lets you scout them in the Dry Run. After five rounds the higher total profit
takes the pot. Bosses add a rule for the duel (your marbles on their board; pegs hidden until
hit; one cup swapped every round).

## The board and its parts (first set)

A vertical pixel board, 20 cells wide × 28 tall, cells of 8 px. Parts snap to cells.
Peg (deflects), Bumper (deflects hard and tags ×1.2, stacking to ×3), Gate (one-way flap),
Funnel (narrows), Spinner (a paddle on a fixed-phase rotation, deterministic), Splitter (one
marble becomes two at half stake each), Magnet (bends paths toward it), Trap (eats the marble,
×0), Ramp, and Cups at the bottom (×0 to ×20; the base board starts with ×0 ×1 ×3 ×1 ×0).
Every part has durability and a repair cost.

## Marbles (first set)

Steel (standard), Glass (light, bouncy, cheap, shatters in Traps), Lead (heavy, straight,
breaks Traps, dents Cups), Lucky (one bad bounce per drop rerolls), Twin (splits at the first
peg), Ember (doubles tags, burns one part's durability per drop).

## The three trees (eight nodes each; every node moves the distribution or the knowledge)

- **Tinker**: second part per cell type, cheaper repairs, Spinner phase control, Cup
  widening, a tenth column of cups, part salvage from beaten rivals.
- **Marbles**: a bigger bag, marble upgrades (Lead that doesn't dent, Twin that splits twice),
  mixed drops (three different marbles per round), a sixth marble per round.
- **Hustle**: Dry Run detail (heatmap per part, rival boards, wear forecast), side bets
  (bet on your own column before the drop for a multiplier), the hustle (one re-drop per duel
  at a cost), reading the boss rule a town early.

## The not-list

- No slot reels, no symbol grid, no adjacency or "neighbor" scoring, no charms, no coins
  falling into a pile, no landlord, no debt counter, no rent deadline, no deity. The pressure
  is a rival and a pot.
- No borrowed names (parts, marbles, nodes, rivals) and no borrowed numbers; every number
  derives from `DESIGN.md`.
- No hidden odds: the Dry Run is always available for your own board.
- Not Peggle (no aiming at targets to clear; no scoring pegs), not Pachinko (no winning
  pockets that feed reels), not a plinko app (the board is built, not fixed).
- Nothing past Milestone 1 before the Milestone 2 gate.

## Tech (decided)

Same framework as Sprocket & Sprout, Candlepower and Trotline: TypeScript strict + Vite, one
Canvas 2D at **384×216 logical** (×5 = 1920×1080, whole-number scaling, letterboxed),
`imageSmoothingEnabled = false`, fixed 60 Hz pure deterministic sim with our own fixed-step
circle physics (no physics library: determinism and replay matter more than realism), IMGUI
canvas UI with the bitmap font, Web Audio, Vitest + Playwright, GitHub Pages, Electron later.
Engine layer extracted from S&S; nothing from its `sim/`, `data/`, `app/` or art. **Art is
made with the `pixel-art-studio` skill** (code-drawn, deterministic, palette-locked): see
`STYLE.md`.
