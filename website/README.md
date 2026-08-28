# Pendle points calculator

A browser tool for Pendle YT (yield token) positions.

You enter protocol TVL, point multipliers, your holdings, and your entry day. It estimates:

- your share of the points pool
- how many airdrop tokens that share might be
- what that is worth under different FDV assumptions
- which entry days look better (timing sweep)

Nothing is sent to a server. The math runs in your browser.

Live page: https://marcusm4ximus.xyz/pendle-points-calculator/

## Files

- `index.html` — page layout
- `style.css` — styling
- `calculator.js` — the math
- `script.js` — buttons, inputs, charts

## Run locally

From this folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000
