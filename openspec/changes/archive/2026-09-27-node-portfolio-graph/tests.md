## Automated Tests

- `npm run test:unit` (Vitest):
  - `src/physics/graphSimulation.test.ts` (Headless Physics Unit Test):
    - Initializes the `d3-force` simulation in Node at 1440x900 and 390x844 without a DOM canvas.
    - Runs 300 ticks:
      - Asserts all 6 nodes maintain at least 60px center-to-center clearance.
      - Asserts all 6 nodes remain bounded within $[20, width - 20]$ and $[20, height - 20]$ without wall sticking.
      - Asserts `open-dungeon` does not sit at the centroid ($|x - w/2| > 40$ or $|y - h/2| > 40$).
      - Asserts simulation stabilizes (`alpha < 0.005`) within 300 ticks.
  - `src/utils/graphTopology.test.ts`:
    - Verifies that the tag-derived topology produces exactly the 9 pinned edge pairs.
    - Verifies isolated node behavior when no paradigm tags match.
    - Verifies edge labels accurately reflect the shared paradigm tags.
  - `src/data/projects.test.ts`:
    - Verifies all project IDs are unique non-empty strings.
    - Verifies that every `video` or `screenshot` `src` points to a file that exists on disk under `public/`.
    - Verifies that every command chip in `terminalDemo.commands` resolves to a valid entry with output lines and exit code.
  - `src/utils/terminalCommandResolver.test.ts`:
    - Verifies per-project command resolution returns captured output and exit code.
    - Verifies unknown commands return exit code 127 with available suggestions.
    - Verifies history navigation boundaries.
- `npm run test:e2e` (Playwright):
  - Desktop & Mobile load: Verifies page mounts with zero console errors.
  - List View interaction: Verifies toggling to List View renders 6 cards, and clicking a card opens the ProjectDrawer.
  - Terminal demo execution: Verifies clicking a command chip in the terminal emulator executes and displays output lines.
  - Tag filtering: Verifies clicking the 'LLM' tag pill assigns `data-dimmed="true"` on non-matching project buttons in `<nav aria-label="Projects">` while keeping matching projects un-dimmed.
  - Deep linking: Verifies navigating to `#/p/open-dungeon` automatically mounts the OpenDungeon drawer on load; verifies closing the drawer clears the hash; verifies `#/p/bogus` loads without crashing.
- `npm run typecheck && npm run build`: Strict TypeScript compilation and Vite 7 production bundle build exit code 0.

## Manual Verification

- **Decentralized Dispersion Verification**:
  - **WHEN** the page is opened at desktop (1440x900) or mobile (390x844) viewport
  - **THEN** all 6 nodes float buoyantly across the viewport area with at least 60px clearance, with OpenDungeon floating freely rather than trapped as a central hub.
- **Fling Momentum and Glide**:
  - **WHEN** the user drags a node across the canvas and releases the pointer with speed
  - **THEN** the node coasts smoothly across the canvas with visible gliding deceleration (decay 0.18) and does NOT abruptly freeze upon release, even if the cursor remains over the node.
- **Hover Gravitation Wave**:
  - **WHEN** the pointer moves over a node in idle state
  - **THEN** the hovered node pins securely under the cursor without jitter, connected neighbors gently pull toward it ($F_{pull} = \alpha \times 0.08 \times (dist - 120)$), and unhovering smoothly unpins the node and settles the layout.
- **Accessible Focus Mirroring**:
  - **WHEN** a sighted keyboard user presses `Tab` to navigate through the projects
  - **THEN** the active DOM focus element mirrors a high-contrast focus ring directly onto the corresponding canvas node and pans the camera into view.
- **Prefers Reduced Motion**:
  - **WHEN** the operating system or browser has `prefers-reduced-motion: reduce` active
  - **THEN** the force simulation is paused immediately and nodes are rendered in a clean static geometric ring.
