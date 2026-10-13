# Carpet Joint

A pixel-art casino roguelike: you run the house on a neon 1970s strip. Write your own games'
odds, lay out the floor, work it live, and survive the swings, because the house doesn't always
win. (The repo is still called `pegwork`, after the marble-board game it started as.)

**Play the current build:** https://ycgnem.github.io/pegwork/

Right now this is Milestone 0, the debug floor: a sawdust joint with two tables and a night's
crowd walking in. Click a table to see its paytable with every bet's exact house edge and hit
rate, and press - / + to change what a bet pays. The cage panel shows **the Sweat**: the chance
the cage runs dry before 6am, from replaying the rest of tonight 500 times with the real
paytables. Space pauses (every order still works), 1 and 2 set the speed. "Send in a whale" sends
in a high roller.

TypeScript + Vite, one 640x360 Canvas 2D, a deterministic 60 Hz sim. `npm install`, `npm run dev`,
`npm test`. Design docs: `PLAN.md`, `DESIGN.md`, `STYLE.md`, `ROADMAP.md`.

No real money, ever.
