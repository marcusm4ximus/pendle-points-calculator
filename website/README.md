# Pendle YT Airdrop Calculator - Web Version

A retro-styled web calculator for estimating Pendle YT airdrop allocations and optimizing entry timing.

## Features

- ✅ Full calculator with all parameters
- ✅ Interactive parameter inputs with hover tooltips
- ✅ Real-time calculation
- ✅ Save/Load configurations
- ✅ Retro design with Pendle Finance colors
- 🚧 Timing sweep visualization (coming soon)

## Deployment Options

### Option 1: GitHub Pages (Recommended for Beginners)

1. Create a GitHub account (if you don't have one)
2. Create a new repository (e.g., `pendle-calculator`)
3. Upload all files from the `website` folder to the repository
4. Go to repository Settings → Pages
5. Select "Deploy from a branch" → choose `main` branch → `/ (root)` folder
6. Click Save
7. Your site will be live at: `https://yourusername.github.io/pendle-calculator/`

### Option 2: Vercel (Also Easy)

1. Create a Vercel account at vercel.com
2. Install Vercel CLI: `npm i -g vercel`
3. In the `website` folder, run: `vercel`
4. Follow the prompts
5. Your site will be live automatically!

### Option 3: Netlify

1. Create a Netlify account at netlify.com
2. Drag and drop the `website` folder to Netlify's dashboard
3. Your site will be live instantly!

## Local Testing

To test locally before deploying:

1. Open terminal in the `website` folder
2. Run a simple HTTP server:
   - Python 3: `python3 -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
   - Node.js: `npx http-server`
3. Open browser to `http://localhost:8000`

## File Structure

```
website/
├── index.html      # Main HTML structure
├── style.css       # Retro styling with Pendle colors
├── calculator.js   # Core calculation logic (ported from Python)
├── script.js       # UI interactions and event handlers
└── README.md       # This file
```

## Usage

1. Fill in all configuration parameters
2. Hover over ℹ️ icons for parameter explanations
3. Click "Calculate" to see results
4. Use "Save Config" to download your configuration
5. Use "Load Config" to restore a saved configuration

## Notes

- All calculations run in your browser (no server needed)
- Your data stays on your computer (privacy-friendly)
- Works offline after first load

## Color Palette

The website uses Pendle Finance's official color palette:
- **Primary**: PT Green (#1BE3C2), YT Blue (#7AB7FF), Pendle Blue (#6079FF)
- **Backgrounds**: Water colors (dark blues)
- **Text**: Mono colors (grays)
- **Accents**: Success, Error, Warning, Gold colors

## Future Enhancements

- [ ] Timing sweep visualization with charts
- [ ] Export results to CSV
- [ ] Shareable configuration links
- [ ] Mobile-responsive improvements

