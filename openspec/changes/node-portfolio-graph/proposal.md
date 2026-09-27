## Why

Engineers with diverse projects (CLIs, local-first tools, audio signal processors, browser extensions, and web apps) lack a compelling, unified web showcase. Traditional portfolio templates assume every project is a deployed SaaS or static website, which fails for CLI utilities and local-first engines. As documented in `research.md`, several key projects (`open-dungeon`, `sandwave-sim`) intentionally block iframe embedding in production via CSP `frame-ancestors 'none'`, requiring dedicated presentation modes.

This change creates a minimalist, Obsidian-inspired decentralized node graph portfolio where visitors explore projects through equal-weight physics, tag-derived relational links, and tailored preview modalities (including zero-backend terminal simulation and video playback), backed by full keyboard and screen-reader accessibility.

## What Changes

- Scaffold a modern frontend SPA using React 19, Vite 7, TypeScript, Tailwind CSS v4, and `d3-force`.
- Implement a decentralized 2D force simulation on HTML5 Canvas where nodes float buoyantly (weak centering force + strong repulsion), boundary damping, pointer fling inertia, and dynamic hover gravitation waves.
- Introduce dynamic tag-derived edge generation linking projects that share controlled paradigm tags.
- Create an adaptive project inspector drawer supporting a discriminated `Preview` union (interactive terminal emulator, video player, screenshot cards, and external linkouts).
- Build a client-side terminal simulator with status-tag highlighting, history navigation, and pre-scripted project commands (`--schema`, `--list`, `--lint`, or test runs).
- Provide a dual-view interface with an instant "Graph View" / "List View" toggle, deep linking (`#/p/:id`), and accessible DOM navigation.
- Configure SPA rewrites in `vercel.json` for seamless static deployment.


## Capabilities

### New Capabilities
- `graph-simulation`: Decentralized 2D canvas force graph engine using `d3-force` with boundary damping, hover reheat/pinning gravitation waves, and pointer fling inertia.
- `project-catalog`: Data model, compile-time data contract, and tag-derived edge generator for 6 verified projects (OpenDungeon, Agentic Resume Builder, PICT Climate Risk Viz, Transcribe Plus, Sandwave Sim, Attention Max).
- `project-drawer`: Sliding inspection drawer supporting terminal emulation, media playback, architectural notes, and direct external launch.
- `portfolio-controls`: Top-level HUD controls including Graph/List view toggle, tag filter pills, real-time search, and full keyboard/screen-reader navigation.

### Modified Capabilities

*(None - new greenfield repository)*

## Impact

- Repository initialized with React 19, Vite 7, Tailwind v4, and `d3-force`.
- Zero backend dependencies; deploys as a static SPA on Vercel with SPA routing rewrite.
- High performance rendering on desktop and mobile viewports with `prefers-reduced-motion` compliance.
