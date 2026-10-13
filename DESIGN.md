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
- **Arrivals:** tonight's crowd (§7) walks in at an even seeded rate over the first 8 game hours
  (8pm–4am); the M1 crowd model gives the evening its peak.
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
| Lucky Drum | 40 balls, 10 drawn | Pick 1 (catch it) | 2.5:1 | 1/4 | 12.5% | 1.52 |
| Lucky Drum | same | Pick 3 (2 hits / 3 hits) | 2:1 / 40:1 | 0.137 / 0.0121 | 9.2% | 4.56 |

The wheel's house pockets sit opposite each other (0 and 12) and the colors alternate around the
whole wheel. The drum's odds are hypergeometric (every set of picks has the same odds, so a catch
bet's numbers are fixed). The Lucky Drum isn't on the sawdust joint's floor at the start; it's the
third layer-0 table to buy (§3).

**Bets on one table share its outcome.** Six tourists on the same wheel pocket win together, so
a table's swing is the sum of its bets moving as one, not six independent bets. The Sweat (§6)
simulates rounds, not bets, for exactly this reason.

Why greedy: the first lesson is that your starter games drive the crowd away (§5 word of mouth),
and editing a paytable fixes it. Pace test §11.1 encodes it.

## 3. Tables and pace

| Table | Seats | Rounds/hour (standard dealer) | Footprint | Cost |
|---|---|---|---|---|
| Dice table | 6 | 80 | 3×2 tiles | $1,200 |
| Wheel | 6 | 45 | 2×2 | $1,500 |
| Ball drum | 8 | 12 (a draw of 10 balls) | 3×2 | $1,800 |

- **Dealer skill** moves rounds per hour from ×0.8 (green) to ×1.25 (veteran): Hi-Lo deals 64,
  80 or 100 rounds an hour. **A table needs a dealer to open**; taking its dealer away closes it.
- **Staff and wages** (a night, by green / standard / veteran; paid at dawn from the bank, then
  the cage; a payroll the house can't meet ends the season):

  | Role | Does | Wage |
  |---|---|---|
  | Dealer | runs one table at its pace | $30 / $40 / $55 |
  | Pit boss | watches up to 3 tables for cheats (§8) | $60 / $75 / $90 |
  | Security | walks a spotted or accused cheat out, 1.5× a gambler's walk | $50 / $50 / $65 |
  | Cashier | the cage needs one to open the doors | $40 |

  The starting staff (§4) costs **$195 a night**, about 6% of a starter night's +$3,000. Why
  these wages: a dealer at a standard table earns its $40 back in the first hour (§3's $60/hour
  wheel); a veteran's ×1.25 pace is worth its extra $15 only on a table that's full. The hiring
  hall offers 6 candidates a day (2 dealers, 1 pit boss, 2 security, 1 cashier), skills drawn
  35% green, 45% standard, 20% veteran.
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
- *Measured in M0* (20 seeds, the debug floor's night 1: starter games, $2–$50 limits, about 70
  arrivals, no whales): house net **+$3,004 ± $270** a night (SD $1,208, range +$714 to +$4,765),
  a 14.2% hold on everything bet, no busts. That's over three times the hypothesis: a tourist's
  stop-loss is their whole bankroll, so at a 16.7% table the house keeps most of it in one night.
  Word of mouth came out **+4.4** a night (6.2 left up 50%, 7.1 went broke fast), so the greedy
  starter games don't yet cost the crowd they should (§11.1). M1 rebalances: stop-losses below
  100% for tourists, the word-of-mouth penalty, and the buyout prices in §7, which assumed $900.

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
  payout) + 0.4·buzz − 8·sharpness·perceivedEdge − 0.05·walk tiles`, picked by a seeded softmax
  at temperature 0.25 (a 0.25 better score is e times as likely). Each table is scored by the
  gambler's best bet there, and that's the bet they play. `top payout` here is `1 + pays`.
  Gamblers judge the paytable as it looks: a gaff's true odds never enter this formula.
  `buzz` = seats filled plus recent visible wins nearby. `perceivedEdge` = true edge plus
  Gaussian noise of SD `0.04 × (1 − sharpness)`, nudged each hour toward the edge the gambler has
  actually seen at that table.
- **Stake:** the base bet, inside the table's limits, never more than the gambler has left.
- **Leaving:** at the stop-loss (80% of the bankroll down for tourists and conventioneers, 60%
  for locals, all of it for high rollers), at the win goal (×1.5 to ×3 of bankroll), or when
  patience runs out. *M1:* the tourist's stop-loss came down from 100% because a gambler who
  plays to zero hands a greedy house their whole bankroll whatever the edge (DESIGN §4's M0
  measurement), which made greed pay.
- **Word of mouth (pillar 3):** a gambler who leaves **up ≥ 50%** adds `WoM` to tonight's
  ledger; one who leaves **down 80% or more within 60 minutes** subtracts `1.0 × WoM`. Everyone
  else is neutral. At the count, reputation keeps 80% of itself and adds the night's ledger.
  Why asymmetric: losers expect to lose, so a normal loss is quiet; a fast wipe-out feels like a
  rigged house and gets told the same way a big win does. *M1:* the penalty was 0.3 × WoM in M0,
  where word of mouth came out +4.4 a night even at the greedy starter games; at 1.0 a greedy
  house's reputation falls to about −14 by night 4 and a house at 8% to about −7 (both measured,
  20 seeds). The long-shot bets make both winners and fast wipe-outs: volatility is the lever.

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
- **How money moves:** every bet settles against the cage the moment its round resolves: a loss
  adds the stake, a win pays the gain. A win bigger than the cage busts the house. (Equivalent to
  buy-ins and cash-outs at the cage, but it puts the bust exactly where the swing is.)
- **Milestone 0's Sweat** holds tonight's seated crowd fixed: everyone seated now keeps their bet
  until 6am. The forecast of arrivals and departures comes with M1. The fast path tabulates each
  table's round per outcome (the cage change and the least cage that survives the seat order);
  a test proves it equals settling bet by bet.
- **The closed-form check** uses Siegmund's correction (the barrier moved out by 0.583 of one
  bet's SD), because a walk of whole bets overshoots zero instead of touching it.
- **The hard rule:** if any table's `maximum bet × (top payout + 1)` exceeds the cage, the table
  flashes red. One spin can bust you.
- **The armored car** moves money bank → cage in 1 game hour and costs $50.

## 7. The strip and the rivals

- **Strip population** 600 gamblers a night at night 1, +8% a night (season peak about 1,200).
  Conventions and events add bursts.
- **Crowd share** by a softmax over houses: `U = 0.05·reputation − 14·posted edge` (+ the marquee,
  comps and games-match terms when they exist; + a rival's buffet). The posted edge is the mean,
  over open tables, of each table's mean bet edge as its paytable reads (a gaff isn't heard). The
  Showman and the Outfit sit out the slice as one fixed pull, `U = −0.8`. You start at **12.5%**
  (starter games post 13.2%: U = −1.85; the Undercutter U = 0.2 − 0.63 = −0.43; the rest −0.8).
  Why 14: a house's take is roughly share × edge while edges are below the point where a crowd's
  bankrolls run out, and share falls like e^(−14·edge), so the take peaks near an edge of 1/14 ≈
  7%: greed and generosity both lose to a middle edge. (At 6, the M0 guess, the peak was 17%,
  and the starter games were already optimal.)
- **The slice's rival, the Undercutter** (the Silver Dollar): posts 4.5% and cuts toward 3%,
  reputation 4, $15,000 cash. Its night: crowd = population × its share, each spending $480 per
  1.0 of edge ($21.60 at 4.5%), minus $5,718 overhead: about **+$1,000** on night 1. Its moves, one
  a day from a seeded deck: *undercut* (−0.5 points of edge), *billboard* (+2 reputation),
  *buffet* (+0.4 U for one night).
- **Rivals (layer 0):** the Undercutter (edges 3–5%, big crowds, thin cage), the Showman (lounge
  acts, high reputation, average edges), the Outfit (sends cheats and poaches staff; its own
  tables are gaffed). Each is a bot with a cash pile, a nightly result from its share, and one
  move per day from a deck of its style.
- **Buyout price** = `4 × its average nightly profit over the last 3 nights + its building value`,
  floored at its building value. The Undercutter's building is $7,000, so it opens near **$11,000**
  and moves with its profits: about $17,500 by day 5 against a greedy house (it keeps the crowd)
  and $13,300 against one at 8% (measured, 20 seeds). The other rivals and the flagship are
  priced in M4 from what this one teaches. *M1:* 5 nights and a $10,000 building priced the
  Undercutter at $18,400 against the 8% house, beyond what four nights earn.
- **The slice** is 4 nights; the day after night 4 is the last chance to buy. Buying ends the
  slice won; walking away (or busting) ends it lost.

## 8. Cheats, gaffs and heat

- **Gambler cheats** (layer 0): the **dice slider** (on 1 roll in 4 at a dice table, re-throws
  until their bet comes in, up to 6 tries), the **past-poster** (slips a second stake onto every
  winning bet after the result, so every win pays double), the **team** (three seats at a wheel
  signaling a dealer on a rival's payroll; M4). Each takes money from the table at a rate shown
  in the eye-in-the-sky replay. A pit boss spots one with **2% a cheating round** per skill level
  when watching that table; the eye in the sky lets you review and accuse; a wrong accusation costs
  reputation.
- *As built in M1* (the slider and the past-poster): a slider on High 8–12 (fair 15/36) wins 55.7%
  of rolls: 1 − (21/36)^7 on a controlled roll, so +11% a round against the house instead of
  −16.7%. On Any Seven, 30.5% instead of 16.7%. A past-poster on High at 1:1 is paid 2:1 on wins:
  +25% a round; on Any Seven (4:1 → 8:1), +50%. A standard pit boss (4% a cheating round) at a
  full Hi-Lo table sees about 33 posted wins an hour from a past-poster, so spots them within the
  hour 74% of the time (1 − 0.96^33), the slider (20 controlled rolls an hour) 56%. A cheat
  who's spotted with **no security free keeps playing**; security walks them out and their
  winnings tonight return to the cage (+1 word of mouth for a clean house). **Accusing an honest
  gambler**: they leave and word of mouth takes −2. Cheats arrive at 0.5 a night on night 1,
  +0.25 a night after; they dress as a tourist (past-poster) or a local (slider), with one tell
  each (STYLE.md rule 1): a gold pinky ring, a spare chip in the cuff.
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
   crowd share after night 3 and can't afford the first buyout by night 6. *Slice scale (M1):* the
   greedy bot wins ≤ 20% of 20 seeds and the 8% tuner wins ≥ 35% and at least twice as often.
   Measured: greedy 3/20, tuner 8/20 (stage A); with wages (stage B) greedy 2/20, tuner 8/20
   once it hires one security guard (6/20 without: the payroll alone costs it two seasons).
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
