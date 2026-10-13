# Carpet Joint — Design model

Every number derives from this file. These are **starting hypotheses for the slice**, tuned by
play and by the pace tests (§11), never by looking at another game. Change a number → write the
new derivation here first. Money is in whole cents everywhere in the sim.

## 1. Time, space and the sim

- **Tick** 1/60 s, fixed step. The sim is pure and deterministic: seeded RNG streams (one per
  table, one for the crowd, one for events, one per rival), no `Math.random`, no wall time.
- **Night** runs 8pm to 6am: 10 game hours. **1 game hour = 27 s at 1×** (1,620 ticks), so a
  night is 4.5 minutes. Speeds: pause, 1×, 2×. Why 27 s: a season of 10 nights at 4.5 min plus
  about 1.5 min of day planning a night is about 60 min, the owner's "a bit under an hour".
- **Day** has no clock: planning takes as long as the player wants. The pace test assumes 1.5 min.
- **Screen** 640×360 logical, ×3 = 1920×1080, whole-number scaling, letterboxed.
- **Floor tile 16×16 px.** The sawdust joint's floor is **16×11 tiles** (256×176 px); a
  bought-out rival adds its own building as a connected wing. The camera pans; the floor view is
  at most 28×18 tiles (448×288 px) of the screen, the rest is the top bar (16 px) and the right
  panel (176 px).
- **Agents** (gamblers, staff) move on the tile grid with positions in integer 1/16 px, walking
  **2 tiles per game minute** (a gambler crosses the joint in about 8 game minutes = 3.6 s real),
  pathing on a flow field per destination rebuilt only when the floor changes.

## 2. The math of a bet

A bet on an outcome of probability **p** that pays **m to 1** returns `(m + 1) × stake` on a win
and nothing otherwise.

- **Return per $1** `R = Σ p_i × (m_i + 1)` over the bet's winning outcomes.
- **House edge** `E = 1 − R`. Positive is good for the house.
- **Volatility** (the SD of one $1 bet) `σ = sqrt(Σ p_i (m_i + 1)² − R²)`.
- **Hit rate** `H = Σ p_i`.

The odds calculator computes these **exactly** (rational arithmetic) for dice, wheels and
ball drums, whose outcomes can be enumerated. Anything that can't (later layers' shoes, the
book) uses a seeded simulation of 20,000 rounds, shows its ± and is cross-checked against exact
math in a test wherever exact math exists.

**The editor's color rule:** an edge reads green from **2% to 12%**, amber below 2% (you're
barely earning) or above 12% (the crowd will feel it, §5), red at or below 0% (you're paying
them to play). Why 2–12%: below 2%, a wheel with four tourists expects $144 a night (2% × 1,800
bets × $4) against a swing of about $170 (one SD), so it loses about 1 night in 5; above 12%, an
average tourist at dice pace expects to lose about half their bankroll before their patience
runs out (12% × $4 × 80 rounds × 1.5 h ≈ $58 of $120), which is where fast busts and the
word-of-mouth penalty (§5) pile up.

### Starter games (deliberately greedy)

| Game | Randomizer | Bet | Pays | p | Edge | σ |
|---|---|---|---|---|---|---|
| Hi-Lo Dice | 2d6 | High (8–12) or Low (2–6) | 1:1 | 15/36 | 16.7% | 0.99 |
| Hi-Lo Dice | 2d6 | Any Seven | 4:1 | 6/36 | 16.7% | 1.86 |
| Hi-Lo Dice | 2d6 | Doubles | 4:1 | 6/36 | 16.7% | 1.86 |
| Red Wheel | 24 pockets: 11 red, 11 black, 2 house | Red or Black | 1:1 | 11/24 | 8.3% | 1.00 |
| Red Wheel | same | One pocket | 20:1 | 1/24 | 12.5% | 4.20 |

Why greedy: the first lesson is that your starter games drive the crowd away (§5 word of mouth),
and editing a paytable fixes it. Pace test §11.1 encodes it.

## 3. Tables and pace

| Table | Seats | Rounds/hour (standard dealer) | Footprint | Cost |
|---|---|---|---|---|
| Dice table | 6 | 80 | 3×2 tiles | $1,200 |
| Wheel | 6 | 45 | 2×2 | $1,500 |
| Ball drum | 8 | 12 (a draw of 10 balls) | 3×2 | $1,800 |

- **Dealer skill** moves rounds per hour from ×0.8 (green) to ×1.25 (veteran). Wage $40 per night.
- **Limits:** minimum $1–$25, maximum ×5 to ×100 of the minimum. Layer-0 default $2–$50.
- **A table's expected earnings per hour** = `E × average bet × filled seats × rounds per hour`.
  Example: Red Wheel red/black at 8.3%, $4 average, 4 seats, 45 rounds: **$60/hour, $600/night**.
  Hi-Lo at 16.7% earns $214/hour with the same crowd, but its players go broke in about 2 hours
  (§5), so its seats empty.

## 4. Starting position

- **Bank $4,000, cage $2,000.** Two tables (Hi-Lo Dice, Red Wheel), a cage, a bar, an entrance.
  Staff: 2 dealers, 1 pit boss, 1 cashier. Room for about four more tables.
- Why: a starter night (§3 example, two tables) expects about +$900 with an SD of about
  $300–700 depending on the bet mix (simulated in M1; this is the hypothesis). Against a $2,000
  cage that's a risk of ruin near zero, so the first night is safe. The first whale (night 2,
  §6) is not: one $500 bet on a single wheel pocket pays $10,500.

## 5. Gamblers

Every gambler has a **session bankroll**, a **base bet** (a fraction of it), **patience** (game
minutes before boredom), **thrill** (taste for volatility, 0–1), **sharpness** (how well they
sense the edge, 0–1), a **stop-loss** and a **win goal**.

| Type (layer 0) | Bankroll | Base bet | Patience | Thrill | Sharpness | Word of mouth |
|---|---|---|---|---|---|---|
| Tourist | $60–200 | $2–5 | 90 min | 0.5 | 0.1 | 1.0 |
| Local | $100–300 | $5 | 150 min | 0.2 | 0.6 | 0.6 (but returns) |
| Conventioneer | $200–500 | $5–10 | 60 min | 0.6 | 0.2 | 1.5, arrive by bus in groups of 8–20 |
| High roller | $5,000–50,000 | $100–1,000 | 120 min | 0.7 | 0.5 | 4.0 |
| Cheat | $300–1,000 | $10–25 | 90 min | — | — | rival-sent or independent (§8) |
| Inspector | $200 | $5 | 120 min | — | 1.0 for gaffs | appears with heat (§8) |

- **Choosing a table** (each time a gambler is free): `score = 1.0·H + 0.6·thrill·log2(top
  payout) + 0.4·buzz − 8·sharpness·perceivedEdge − 0.05·walk tiles`, picked by a seeded softmax.
  `buzz` = seats filled plus recent visible wins nearby. `perceivedEdge` = true edge plus
  Gaussian noise of SD `0.04 × (1 − sharpness)`, nudged each hour toward the edge the gambler has
  actually seen at that table.
- **Leaving:** at the stop-loss (default 100% of bankroll for tourists, 60% for locals), at the
  win goal (×1.5 to ×3 of bankroll), or when patience runs out.
- **Word of mouth (pillar 3):** a gambler who leaves **up ≥ 50%** adds `WoM` to tomorrow's
  reputation ledger; one who leaves broke within 60 minutes subtracts `0.3 × WoM`. Everyone else
  is neutral. Why asymmetric: losers expect to lose, so a normal loss is quiet; a fast bust feels
  like a rigged house. With a 16.7% edge a tourist at $4 a bet on Hi-Lo busts in about 2 hours,
  so very few leave up; at 5% many more do (measured in M1 and written here).

## 6. High rollers and the Sweat

- **The first whale arrives on night 2**, then 0–2 a night by reputation. A whale asks for one
  of: higher limits at one table, a private table, or comps (a suite, a show; layer 0: comps
  cost $200–800). Saying no sends them across the street and costs a little reputation.
- **The Sweat** is the risk-of-ruin forecast, always on the cage panel: the probability that the
  cage's running balance hits zero before 6am. It's computed by **simulating 500 nights of the
  bet flow** (expected crowd per table, their bet sizes, the tables' real paytables and gaffs)
  with the same bet-resolution code the live night uses, shown with its ±. A test checks it
  against the closed form for a drifted random walk:
  `P(ruin by T) ≈ Φ((−C − μT)/(σ√T)) + e^(−2μC/σ²) · Φ((−C + μT)/(σ√T))`,
  with C the cage, μ and σ² the per-hour mean and variance of the house's net. (The closed form
  is wrong for big jumpy whale bets, which is why the Sweat simulates instead.)
- **The hard rule:** if any table's `maximum bet × (top payout + 1)` exceeds the cage, the table
  flashes red. One spin can bust you.
- **The armored car** moves money bank → cage in 1 game hour and costs $50.

## 7. The strip and the rivals

- **Strip population** 600 gamblers a night at night 1, +8% a night (season peak about 1,200).
  Conventions and events add bursts.
- **Crowd share** by a softmax over houses: `U = reputation + 0.5·marquee + comps value
  − 6·perceived edge of the house's games + games-match`. You start at about 12% (a sawdust joint
  against three established houses).
- **Rivals (layer 0):** the Undercutter (edges 3–5%, big crowds, thin cage), the Showman (lounge
  acts, high reputation, average edges), the Outfit (sends cheats and poaches staff; its own
  tables are gaffed). Each is a bot with a cash pile, a nightly result from its share, and one
  move per day from a deck of its style.
- **Buyout price** = `5 × its average nightly profit over the last 3 nights + its building value`,
  floored at its building value. Starting prices: Undercutter about $15,000, Showman $30,000,
  Outfit $50,000; the **flagship $120,000** and only after the other three. Why: at the §4
  hypothesis (+$900 a night rising to about +$3,000 with four good tables) the first buyout lands
  around night 4, and each buyout's building roughly doubles your earning floor, so the snowball
  reaches the flagship around night 9–10 for a good run. The M1 pace test measures this.

## 8. Cheats, gaffs and heat

- **Gambler cheats** (layer 0): the **dice slider** (controls one die 1 roll in 4 at a dice table),
  the **past-poster** (adds to a winning bet after the result), the **team** (three seats at a
  wheel signaling a dealer on a rival's payroll). Each takes money from the table at a rate shown
  in the eye-in-the-sky replay. A pit boss spots one with **2% a round** per skill level when
  watching that table; the eye in the sky lets you review and accuse; a wrong accusation costs
  reputation.
- **Gaffs** (house cheating): shaved dice (moves the 2d6 sum distribution by a chosen bias), a
  wheel brake (one pocket group ×1.5 less likely), a weighted ball. The editor shows true odds
  beside the paytable's apparent odds.
- **Spotting a gaff:** each round on a gaffed table, each seated gambler spots it with
  `0.0005 × sharpness × bias strength`; an inspector at the table `0.02 × bias strength`.
- **Heat** 0–100. +15 per gaff spotted, +3 per rough ejection, +10 per rival tip-off (the Outfit's
  move). Cools 5 a night. **50:** an inspector visits every night. **75:** a raid (a fine of 25%
  of the cage, the gaff confiscated, the table shut for a night). **100:** the license is pulled
  and the run ends.

## 9. The Web (in run)

- **Size at layer 0:** about **300 nodes**: about 230 Angles, 54 Specials, 12 House Rules, 4
  background starts. Each prestige layer adds a region of about 50 nodes.
- **Know-How:** 3 a night, +2 at each milestone (first profitable night, first whale paid, first
  cheat caught, first edited game), +4 a buyout. A full season earns about **45**, about 15% of
  the web. Why 15%: big enough for a build with two Specials and one House Rule from a start,
  small enough that a second run from the same start can go elsewhere.
- **Layout:** each background's start is 6–8 Angles from its nearest Special and about 20 from the
  nearest House Rule. Regions touch so a path can cross between them.
- **Angles** move one system by a small step (dealer pace +4%, pit-boss spotting +0.5 points,
  tourist patience +6 min, Sweat simulation ±, armored-car time −10 min). **Never cash.**
- **Respec:** one node a day for `$100 × nodes allocated`.

## 10. The Marquee and prestige (between runs)

- **Legend:** 1 per night survived, 4 per buyout, 10 for buying the flagship, 1 per "big sweat
  survived" (the cage fell under 10% and recovered by 6am). A full win earns about 32; a loss on
  night 5 about 6–9.
- **Signs:** 12 at layer 0, each 3–6 bulbs (about 50 bulbs). The k-th bulb in a sign costs k
  Legend, so a 5-bulb sign costs 15. A sign's power applies only when every bulb is lit.
- **Wattage:** 1 W a bulb, **12 W** at the start; each prestige layer adds 8 W. Why 12: two full
  signs, so the first choice of what to light is a real one.
- **Active abilities:** up to 2 slotted, each with a cooldown in game hours.
- **Prestige:** layer 1 unlocks after the first season won at layer 0. Taking a layer resets the
  Marquee's bulbs (not wattage or Charters) and pays `floor(sqrt(lifetime Legend))` of that layer's
  currency. Charters are short lists (6–10 unlocks per layer).

## 11. Pace tests (20 seeds each; bots play the sim headless)

1. **Greedy starter loses:** a bot that never edits a paytable is never ahead of every rival in
   crowd share after night 3 and can't afford the first buyout by night 6.
2. **The Sweat matters:** a bot that keeps tonight's Sweat under 5% busts on ≤ 10% of seeds; a bot
   that accepts every whale and ignores the Sweat busts on ≥ 40%.
3. **Winners are advertising:** an all-15%-edge bot's crowd share is ≥ 30% below an all-5% bot's by
   night 5, and it ends night 10 with less cash.
4. **Cheating is a loan:** a bot that gaffs every table leads in cash at night 3 and is raided or
   loses its license by night 8 on ≥ 70% of seeds.
5. **No dominant start:** each background's scripted build wins the season on 30–60% of seeds.
6. **Pacing:** a night is 4.5 min ± 5 s of real time at 1×; a winning season's first buyout lands
   on night 3–5 and the flagship on night 8–10.
7. **The Sweat is honest:** its forecast is within 3 points of 5,000 simulated nights, and within
   2 points of the closed form when no whale is present.

## 12. The gate (Milestone 2) asks

- Does editing a paytable feel like the main skill, not a menu?
- Does a whale feel like a decision you can read, not a coin flip?
- Is there a moment each night where the floor needs you live?
- Would the owner start a second run to try a different background?
