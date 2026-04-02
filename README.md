# 🎮 Platanus Hack 26: Arcade Challenge

At [Platanus Hack 26](https://hack.platan.us) we will have an arcade machine. While we could put some cool retro games on it, it is way better if it can be turned into a challenge.

**Your mission:** Build the best arcade game using Phaser 3 (JS Game Lib) that will run on our physical arcade machine!

---

## 🏆 Prizes

**🥇 First Place:**
- 💵 **$250 USD in cash**
- 🎟️ **A slot to participate in Platanus Hack**
- 🎮 **Your game featured on the arcade machine**

**🥈 Second Place:**
- 💵 **$100 USD in cash**
- 🎮 **Your game featured on the arcade machine**

---

## 📋 Restrictions

Your game must comply with these technical restrictions:

### Size Limit
- ✅ **Maximum 50KB after minification** (before gzip)
- The game code is automatically minified - focus on writing good code

### Code Restrictions
- ✅ **Pure vanilla JavaScript only** - No `import` or `require` statements
- ✅ **No external URLs** - No `http://`, `https://`, or `//` (except `data:` URIs for base64)
- ✅ **No network calls** - No `fetch`, `XMLHttpRequest`, or similar APIs
- ✅ **Sandboxed environment** - Game runs in an iframe with no internet access
- ✅ **No direct browser storage required** - `/26/arcade` exposes a parent bridge so you can persist JSON without `allow-same-origin`

### What You CAN Use
- ✅ **Phaser 3** (v3.87.0) - Loaded externally via CDN (not counted in size limit)
- ✅ **Base64-encoded images** - Using `data:` URIs
- ✅ **Procedurally generated graphics** - Using Phaser's Graphics API
- ✅ **Generated audio tones** - Using Phaser's Web Audio API
- ✅ **Canvas-based rendering and effects**

# 🕹️ Controls

Your game will run on a real arcade cabinet with physical joysticks and buttons!

![Arcade Button Layout](https://hack.platan.us/assets/images/arcade/button-layout.webp)

## Arcade Button Mapping

The arcade cabinet sends specific key codes when buttons are pressed:

**Player 1:**
- **Joystick**: `P1U`, `P1D`, `P1L`, `P1R` (Up, Down, Left, Right)
- **Joystick Diagonals**: `P1DL`, `P1DR` (Down-Left, Down-Right)
- **Action Buttons**: `P1A`, `P1B`, `P1C` (top row) / `P1X`, `P1Y`, `P1Z` (bottom row)
- **Start**: `START1`

**Player 2:**
- **Joystick**: `P2U`, `P2D`, `P2L`, `P2R`
- **Joystick Diagonals**: `P2DL`, `P2DR`
- **Action Buttons**: `P2A`, `P2B`, `P2C` / `P2X`, `P2Y`, `P2Z`
- **Start**: `START2`

## Testing Locally

For local testing, you can map these arcade buttons to keyboard keys. The mapping supports **multiple keyboard keys per arcade button** (useful for alternatives like WASD + Arrow Keys). See `game.js` for the complete `ARCADE_CONTROLS` mapping template.

By default:
- Player 1 uses **WASD** (joystick) and **U/I/O/J/K/L** (action buttons)
- Player 2 uses **Arrow Keys** (joystick) and **R/T/Y/F/G/H** (action buttons)

💡 **Tip**: Keep controls simple - design for joystick + 1-2 action buttons for the best arcade experience!

## 💾 `/26/arcade` Storage Bridge

When your game runs inside the `/26/arcade` player, the iframe gets a global `window.platanusArcadeStorage` bridge backed by the parent page's `localStorage`.

### Available methods

```js
const save = await window.platanusArcadeStorage.get('save-state');
await window.platanusArcadeStorage.set('save-state', { level: 3, lives: 2 });
await window.platanusArcadeStorage.remove('save-state');
```

- `get(key, options?)` returns `{ found: boolean, value: any }`
- `set(key, value, options?)` stores JSON-compatible data
- `remove(key, options?)` deletes the stored value

### Contract

- Keys must match `[A-Za-z0-9._:/-]` and be 1-128 characters long
- Values must be JSON-compatible and fit within the 64 KiB bridge payload limit
- Storage is isolated by challenge, game, and version by default
- Older saves are **not** read automatically by new releases
- To opt into a previous version explicitly, pass its version slug:

```js
const previous = await window.platanusArcadeStorage.get('save-state', {
  version: 'v1-space-balance-fix',
});
```

Use that explicit read once, migrate what you need, and then write the new save back with the default current-version namespace. The bridge exists so the iframe can stay on `sandbox="allow-scripts"` and still persist player data.

---

## ⏰ Deadline & Submission

**Deadline:** Sunday, November 10, 2025 at 23:59 (Santiago time)

### How to Submit

Submitting your project is easy:

1. **Save your changes** - Make sure `game.js`, `metadata.json`, and `cover.png` are ready
   - **Important:** Your game must include a custom `cover.png` file showcasing your game
   - The cover must be a PNG, exactly `800x600` pixels, and `500 KB` or less
2. **Git push** - Push your code to your repository:
   ```bash
   git add .
   git commit -m "Final submission"
   git push
   ```
3. **Hit Submit** - Click the submit button in the development UI
   - The starter will stage your files, create a release commit, create a git tag, push both to GitHub, and call the arcade backend release endpoint automatically
   - By default it targets `https://hack.platan.us/api/26/arcade/releases`

That's it! 🎉

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```
This starts a server at `http://localhost:3001` with live restriction checking.

### 3. Build Your Game
- **Edit `game.js`** - Write your arcade game code
- **Update `metadata.json`** - Set your game name and description
- **Create `cover.png`** - Design a custom PNG cover image for your game that is exactly `800x600` pixels and `500 KB` or less
- **Watch the dev server** - It shows live updates on file size and restrictions

---

## 🤖 Vibecoding Your Game

This challenge is designed for **vibecoding** - building your game with AI assistance!

### What We've Set Up For You

- **`AGENTS.md`** - Pre-configured instructions so your IDE (Cursor, Windsurf, etc.) understands the challenge
- **`docs/phaser-quick-start.md`** - Quick reference guide for Phaser 3
- **`docs/phaser-api.md`** - Comprehensive Phaser 3 API documentation

Your AI agent already knows:
- ✅ All the challenge restrictions
- ✅ How to use Phaser 3 effectively
- ✅ Best practices for staying under 50KB
- ✅ What files to edit (`game.js` and `metadata.json` only)

### How to Vibecode

Simply tell your AI assistant what game you want to build! For example:

> "Create a Space Invaders clone with colorful enemies"
> 
> "Build a flappy bird style game with procedural graphics"
> 
> "Make a breakout game with power-ups"

Your AI will handle the implementation, keeping everything within the restrictions automatically!
