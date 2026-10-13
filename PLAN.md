# Carpet Joint — Plan

*Written 2026-10-12 with the owner. This replaces the marble-board plan (Pegwork), which is
still in git history at commit 94a2b78. The repo stays `ycgNem/pegwork`. Check the name on
itch.io and Steam before the first build that carries it.*

"Carpet joint" is 1970s slang for a classy casino; a "sawdust joint" was the cheap kind. You
start the game as a sawdust joint.

## What the owner asked for (2026-10-12)

- **No marble/plinko board.** Gambling stays, the visible math stays, rivals stay.
- **You are the house**, not the gambler.
- **Skill trees, upgrades and complexity**: a huge passive web *inside* each run (Path of Exile
  scale) plus a constellation-style tree *between* runs, plus **prestige layers** that each
  unlock a whole new mechanic (incremental-game style).
- **Fully active nights**, with pause. You **oversee the floor with a cursor**; you are not
  an avatar walking around.
- You design **the games, the floor layout, the staff and the crowd.**
- **The house can cheat**, at a cost.
- **A neon 1970s strip.** 640×360. Runs a bit under an hour.
- **Start fresh**: the marble-board code gets wiped from this repo.

## The pitch

A pixel-art roguelike tycoon where **you run a casino on a neon 1970s strip**. You design your
own table games, write their paytables, lay out the floor, hire the staff and court the crowd.
Then you open the doors and work the floor live, night after night, while three rival houses
fight you for the same gamblers. The house has the edge, but the edge only shows up over
thousands of bets. Tonight, one whale on a hot streak can empty your cage. Lose the cage and
you lose the run. Buy out the strip and you win it.

**The one thing: the house doesn't always win.** The edge is a law of large numbers, and your
job is surviving the short run. Every game you design shows its exact house edge and how swingy
it is. **The Sweat** (casino slang for watching a big bet nervously) shows how likely tonight is
to break you. Being a good owner means balancing three things: an edge that's fat enough, swings
you can survive, and games gamblers still want to play.

**Tone:** neon, shag carpet, lounge acts, cigarette haze, polyester, mob money at the edges.
Glamorous on the floor, a little crooked in the count room. Playful, never grim.

## Feel references (one quality each, nothing else) — FLAGGED per CLAUDE.md

- *Path of Exile*: a passive web so big that where you travel in it *is* your build. We take
  the shape (a web, starting points, paths you must travel through, rare rule-breaking nodes).
  We don't take its names ("keystone", "notable", "jewel"), numbers, layout or classes.
- *Grim Dawn* constellations: a meta tree you complete set by set, where each finished set
  grants a power. We don't take its affinity system; our constraint is a **wattage budget**.
- *Antimatter Dimensions* (and incremental games generally): each prestige layer unlocks a
  whole new mechanic, not just bigger numbers. We don't take its currencies, names or curves.
- Tycoon floor sims (*Theme Hospital*, *Two Point*, *Casino Inc.*): crowds walking a floor you
  laid out. That's the genre convention; we take none of their rooms, staff names or UI.
- **The Vig** (the owner's other project, `Documents/the-vig`) is a casino game played from
  the gambler's side. This game shares nothing with it: no Collector, no quota, no charms, no
  names, no code.

## The removal test

> "If you removed designing the games and surviving their variance, what's left is a generic
> casino tycoon with a skill tree."

A feature earns its place only if it changes **the odds of a game, the swings the cage has to
survive, or which gamblers come to play**. Pace tests (bots, in `DESIGN.md` §11): a bot that
never touches a paytable loses to the rivals; a bot that sets limits from the Sweat outlasts one
that ignores it on the same seeds.

## Pillars

1. **You write the odds.** Games are built from parts (a randomizer, a bet menu, a paytable,
   limits). Every number a gambler can win comes from rules you wrote.
2. **The math is on the table.** Every bet you design shows its exact house edge, volatility and
   hit rate. The Sweat shows tonight's risk of ruin. The odds are never hidden from the owner,
   including the true odds of a game you've rigged.
3. **Winners are advertising.** Gamblers who lose leave quietly; gamblers who win big tell the
   strip. A house with no winners has no crowd. You *need* to give some money back.
4. **The floor is live.** Nights play in real time. You open and close tables, move staff,
   change limits, comp a whale, call security on a cheat. Planning wins seasons; the floor wins
   nights.
5. **Build identity through the web.** The in-run web is big enough that two runs from the same
   owner can play completely differently. Small nodes move a system (dealer speed, crowd
   patience, cheat spotting), never a flat "+x% money".
6. **Each prestige is a new game.** A prestige layer adds a mechanic (a randomizer, a room, a
   kind of business), not just a multiplier.

## The run

**The strip.** You open a sawdust joint at the cheap end of the strip. Three rival houses run
the rest, each owned by a character with a style (the Undercutter runs thin edges and huge
crowds; the Showman steals your crowd with lounge acts; the Outfit sends cheats and leans on your
staff). The flagship at the top of the strip is the end-of-season boss.

**A season is 10 nights** (target 50–60 minutes at layer 0). Each night has two phases:

- **Day (planning, the clock stopped):** design or tune games, rearrange the floor, hire and
  train staff, set marketing and comps, spend Know-How in the web, move money between the cage
  and the bank, and read the strip map (rival moves, crowd forecast, tonight's high rollers).
- **Night (live, about 4.5 minutes from 8pm to 6am at 1×; pause, 1× and 2×):** the doors open and
  the crowd arrives. You work the floor. At 6am the count room tallies the night.

**Crowd share.** Every night the strip's gamblers choose among the four houses by reputation,
the games on offer, comps and the neon outside. The strip remembers: big winners raise your
reputation, rough security and stingy games lower it.

**Winning:** buy out each rival. A rival's price falls as it loses crowd and cash. Buying one
takes over its building (more floor), some of its staff and one of its games. Buy the flagship
by the end of night 10 to win the season.

**Losing:** **the cage runs dry.** A winner cashes out and the cage can't pay: the house is
finished. Or **the license is pulled**: you cheated and got caught too often (see *Heat*).
There is no quota and no rent deadline.

## The night

You oversee the floor with a cursor: click a table, a staff member or a gambler to inspect them
and give orders. Space pauses, and you can give every order while paused.

- **Open, close and re-limit tables.** Raising a table's maximum draws bigger bets and bigger
  swings.
- **Move staff.** Dealers set a table's pace (rounds per hour, so edge earned per hour). Pit
  bosses watch for cheats and keep players happy. Security walks problems out.
- **Handle high rollers.** A whale arrives with a bankroll and demands: higher limits, a private
  table, comps. Every yes means more expected profit and more risk of ruin, and the Sweat shows
  both.
- **Catch cheats.** Dice sliders, past-posters, collusion teams, many sent by rivals. The
  eye-in-the-sky view replays a table's last rounds.
- **Feed the cage.** Call the armored car to move money from the bank to the cage mid-night (it
  takes an hour of game time and leaves the bank thin for tomorrow).
- **Events.** A lounge act sells out, a convention bus pulls up, a rival's crew walks in, the
  power flickers.

## What you design

### Games (the core)
A game is built from four parts. The editor always shows each bet's **house edge, volatility and
hit rate**: exact where the math allows, by fast seeded simulation where it doesn't.

- **A randomizer:** dice (count and faces), a wheel (pockets you place), a drum of numbered balls.
  Card shoes arrive at prestige layer 1, more later.
- **A bet menu:** which outcomes gamblers can bet on (a sum, a pocket color, a pair, a range).
- **A paytable:** what each bet pays. This is where the edge lives.
- **Limits and pace:** table minimum and maximum, seats, rounds per hour.

Gamblers don't read the edge exactly. Each gambler type judges a game by rough cues (how often
people win, how big the top payout is, how busy the table looks), so a game can be good for the
house *and* popular. Finding that kind of game is the skill.

### Gaffs (the house cheating)
A gaff is a rigged randomizer: shaved dice, a wheel with a brake, a weighted ball. It quietly
shifts the true odds while the paytable stays the same. The editor shows the owner the true odds
side by side with what gamblers think they are. Every round played on a gaffed table risks being
spotted by a sharp gambler, a rival's plant or the Gaming Commission's inspector, and every
spotting raises **Heat**. Heat cools slowly. High heat brings inspectors every night, then a
raid (a fine from the cage, the gaff confiscated, the table shut for a night), then the license
pulled, which ends the run. Cheating is a loan against your future.

### Floor layout
A grid floor. Tables, the cage, the bar, the lounge stage, restrooms, the entrance and the
high-limit room all take space. Gamblers walk the floor: traffic, sightlines from the entrance
and distance from the bar decide which tables fill up. Buyouts and the web bring more floor.

### Staff
Dealers, pit bosses, security, cage cashiers, hosts and lounge acts. Each has traits, a level and
gear (a faster shuffler, a radio). Rivals can poach staff, and a dealer on a rival's payroll is
the worst cheat there is.

### The crowd
Gambler types, each with a bankroll, patience, taste for swings and a way of judging games:
tourists, locals, conventioneers, high rollers, cheats and the inspector (layer 0), then card
counters and others in later layers. Marketing, comps, the marquee and the floor decide who comes.

## Progression: three layers

### 1. In run — the Web (PoE-scale passive web)
- **About 300 nodes** in one connected web, paid for with **Know-How** (earned each night, at
  milestones and from buyouts). A season reaches about 45 nodes; the web is far bigger than one
  run on purpose.
- **Four owner backgrounds**, each starting in a different part of the web: *the Ex-Dealer*
  (games and cheat spotting), *the Showman* (crowd, décor, lounge), *the Bookmaker* (odds,
  limits, the cage), *the Fixer* (whales, gaffs, rival dirty work).
- **Regions:** Games, Floor, Staff, Crowd, Cage, the Back Room (gaffs and heat). Paths cross
  between regions, so hybrids are a real choice.
- **Node tiers** (our names): small **Angles** (move one system a little), mid **Specials** (a
  named effect, e.g. "a dealer who wins a hand gets tipped, and tips go to the house"), and rare
  **House Rules** that break a rule of the game (e.g. *No Ceiling*: no table maximums, whales
  come twice as often; *Square House*: gaffs are impossible and your reputation never drops from
  a loss streak; *Paper*: you can extend credit to gamblers).
- Resets every run.

### 2. Between runs — the Marquee (constellation-style meta tree)
- Your casino's outside marquee is a wall of **neon signs**. Each sign is a constellation of
  bulbs. Light bulbs with **Legend** (earned each season by how far you got). A fully lit sign
  grants its power: a passive ("the first whale of every season is a regular"), or an **active
  floor ability** with a cooldown (e.g. *Eye in the Sky*: replay any table's last 10 rounds;
  *Last Call*: everyone at the bar heads for the tables).
- **Wattage** is the constraint: every lit bulb draws a watt and the marquee's wattage is
  limited, so you can't light everything and the marquee is a build too. Prestige raises wattage.
- Persists between runs.

### 3. Prestige layers (each one adds a mechanic)
Each layer unlocks with a goal. Taking it resets the Marquee's bulbs for that layer's permanent
currency, spent on the layer's **Charter** (a short list of permanent unlocks, not another tree).

| Layer | Name (working) | Adds |
|---|---|---|
| 0 | The Sawdust Joint | Dice, wheel and ball-drum randomizers, one floor, three rivals |
| 1 | Go Carpet | Card shoes, staff gear, the high-limit room, card counters |
| 2 | The Hotel | Rooms upstairs (a captive crowd), lounge headliners, a second floor |
| 3 | The Wire | A race and sports book: bets on simulated outside events that settle later |
| 4 | The Syndicate | Run several houses at once on different strips; incremental-scale numbers |

Each layer also opens a new region of the Web and new Marquee signs.

## Currencies (each has a DECISIONS entry naming its pillar)
- **Cash**, split between the **cage** (pays winners tonight) and the **bank** (builds and buys).
  In run. Pillar 2.
- **Heat** (not spendable; a meter). In run. Pillar 2: the true cost of a rigged game.
- **Know-How**: in run, spent in the Web. Pillar 5.
- **Legend**: between runs, lights the Marquee. Pillar 5.
- **One currency per prestige layer**, spent on its Charter. Pillar 6.

## The not-list
- No marble or plinko board, no pegs (the owner's call). No slot reels as the core, no symbol
  grids, no charms, no adjacency scoring.
- No quota, no rent deadline, no debt collector. The pressure is rivals, variance and heat.
- No deck-building poker hands (Balatro's territory). Card shoes are a randomizer for games you
  design, never a hand you build.
- No flat "+x% money" nodes anywhere in the Web, the Marquee or a Charter.
- No hidden odds for the owner's own games, rigged or not.
- No real-money anything, ever. No loot boxes, no paid currency.
- No borrowed names or numbers; every number derives from `DESIGN.md`.

## What survives from the marble-board plan
- Pillar 2 (the math on the table), now for games instead of a board.
- Rivals as the pressure instead of a quota.
- A pure, deterministic, seeded sim with a replay test and bot pace tests.
- The engine tooling already in the repo (loop, input, audio shell, font, IMGUI kit, overlap
  audit, atlas and sheet loader, e2e harness, deploy, `.bat` files, Electron; DECISIONS #8),
  the pixel-art pipeline (`pixel-art-studio` only) and GitHub Pages.

Everything else (the board, the physics, the Dry Run, parts, marbles, the old trees) goes.

## Tech (decided)
TypeScript strict, Vite, one Canvas 2D at **640×360 logical** (×3 = 1080p, whole-number scaling,
letterboxed), pixel art, IMGUI canvas UI with the bitmap font, Web Audio, localStorage for
settings and meta saves, Vitest, Playwright, GitHub Pages, Electron later. No physics engine: the
sim is crowd agents on a tile grid plus randomizers, pure and deterministic at 60 Hz.
