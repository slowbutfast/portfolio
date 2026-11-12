## Source material

- **User Directives (2026-11-12)**:
  - *"looks good. i'll probably change this to a video. can vercel natively host media (e.g., videos and photos) so that I can display it on the vercel deployment?"*
  - *"the email should be `gregory.lazatin2006@gmail.com`"*
  - *"this is the google drive URL: `https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/view?usp=drive_link`. can you display the resume in an embedded view within the about me/contact page, along with a link as well (or however you decide is best to link to the resume google drive link along with the embedded view)"*
  - *"the link to my linkedin is `https://www.linkedin.com/in/gregory-lazatin/`"*
  - *"concise abbreviations should be fine here. then you can have the full title in the actual card/hover view/ etc. if the viewer wants to learn more about those projects individually. and this is mainly so that the node view isn't cluttered"*
  - *"can you make them pinned right below the title, as well as possibly making them clickable as you hover over a project? i envision when you hover over a node on the page, it'll display the floating pop-up with media, and then two easily clickable links to the github repo and the vercel deployment/live demo. and instead of `Live Demo` can you rename that button to `Visit`?"*
  - *"this won't be a patch, but rather a new openspec change in and of itself."*

- **Evaluator Audit 1 (2026-11-12)**:
  - *"A recruiter lands on a name and a white shape. The graph renders in about 450ms and looks striking. The nodes are labeled with kebab-case repo slugs (`pict-climate-risk-viz-chatbot`, `agentic-resume-builder`), and nothing on screen says 'software engineer.' The tagline only appears inside the About modal... The browser tab still reads `SYS.PORTFOLIO // NODE GRAPH SPECIMEN`... That's the string a recruiter sees in bookmarks, tab lists, and link previews."*
  - *"The hover card is instant and shows the media, title, summary, and tags. But clicking outside it closes it, and the hover card itself cannot be interacted with."*

- **Evaluator Audit 2 (2026-11-12)**:
  - *"In `ProjectDrawer`, clicking a project defaults to Media, leaving the GitHub repository and Live App links buried under a secondary 'Link' tab."*
  - *"The completely naked top bar collides with cards and giant numerals ('04') when scrolling Grid view."*
  - *"On mobile screens (390px), the interactive force graph is cramped, long labels collide, and the inspector card floats awkwardly mid-screen."*

### Raised but not acted on

- **Complete removal of interactive physics graph on mobile**: Evaluator suggested defaulting to Grid view on mobile screens. We maintain the graph mode accessible at all times via the header view toggle and bottom sheet inspector rather than deleting canvas mode on mobile.
- **Third-party resume hosting / heavy PDF.js bundle**: Evaluated `pdfjs-dist` (~450KB bundle increase). Click-to-load Google Drive preview (`/preview`) preserves zero bundle overhead while keeping the direct link as primary.
- **Full-card clickability on touch devices**: Touch devices have no hover state; mobile users tap nodes directly to open the bottom sheet inspector, avoiding double-tap ambiguity.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| `shortTitle` | Mandatory concise human string on `ProjectData` used for graph canvas node rendering (e.g., `Resume Builder`) | An optional property, or altering the canonical full title in metadata or inspector |
| `Visit ↗` | Action link navigating directly to the live production deployment or interactive web demo | Opening an internal preview tab or simulated terminal |
| `Code ↗` | Action link navigating directly to the project's source code repository on GitHub | Displaying an inline code viewer or AST inspection tree |
| Candidate Profile | Dedicated data model (`src/data/profile.ts`) managing personal bio, contact endpoints, canonical tagline, and resume links | Storing personal contact data in `projects.ts` or project catalog |
| Progressive Scrim | Subtle background gradient fade (`from-bg via-bg/80 to-transparent backdrop-blur-[2px]`) under the top bar | An opaque top bar background box or bordered pill navigation wrapper |
| Click-to-load Embed | Rendering an `<iframe>` only after deliberate user interaction (e.g. clicking "Preview Resume") | Auto-loading external iframes on initial page load or modal mount |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| Google Drive Embed & Access Documentation | Google Drive file preview can be embedded using `https://drive.google.com/file/d/<id>/preview`. File requires General Access set to "Anyone with the link can view"; `usp=drive_link` in URL does NOT prove public access | Google Terms of Service | 2026-11-12 |
| MDN Content Security Policy: `frame-src` | Controls valid sources for nested browsing contexts such as `<iframe>`. Missing entry causes browser console security block when `default-src 'self'` is specified | W3C / MDN Open Doc | 2026-11-12 |
| MDN Iframe Sandbox Directive | `sandbox="allow-scripts allow-same-origin allow-popups"` provides isolation while allowing Google Drive's interactive viewer scripts to execute | W3C / MDN Open Doc | 2026-11-12 |
| Vercel Static Asset CDN & Caching | Static files compiled by Vite to `dist/assets/` or served from `public/` are served with edge immutable caching (`Cache-Control: public, max-age=31536000, immutable`) | Vercel Platform Specs | 2026-11-12 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Google Drive `/preview` in sandboxed `iframe` (click-to-load) | Adopted | Zero-dependency document view for recruiter resume review without external PDF JS bundles; lazy-loaded for privacy & performance | 2026-11-12 |
| React-PDF / PDF.js | Rejected | Adds ~450KB to JS bundle size; unnecessary when Google Drive preview iframe handles multi-page rendering | 2026-11-12 |
| CSS pointer-events on hover card | Adopted | Allows direct clicking on `Code ↗` and `Visit ↗` while maintaining canvas hit-testing | 2026-11-12 |
| Dedicated `profile.ts` module | Adopted | Decouples personal candidate identity from project catalog models | 2026-11-12 |

## Patterns adopted

- **Card Hover Retention Zone & Transfer**: Pointer leaving a node enters a 150ms grace timeout. Moving pointer into `NodeHoverCard` cancels the dismissal timer (`clearTimeout`). Pointer departure from the card restarts the 150ms timeout. Active node dragging immediately closes the hover card.
- **Progressive Header Scrim**: Top bar gradient mask allowing content to scroll underneath without text illegibility or hard-bordered chrome.
- **Sticky Header Action Elevation**: Placing `Code ↗` and `Visit ↗` buttons inside the sticky inspector header, guaranteeing discoverability regardless of tab selection or scroll position.
- **Dynamic Viewport Units**: Using `dvh` (`max-h-[85dvh]`) for mobile bottom sheets to prevent mobile browser URL bar clipping.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| Project runtime is React 19.3 | True | Inspected `package.json` (`react: ^19.0.0`, lockfile resolved `19.3.0`) | 2026-11-12 | stable |
| Vercel hosts MP4 media natively | True | Inspected `transcribe-plus` bundled MP4 asset and `vercel.json` immutable caching header | 2026-11-12 | stable |
| CSP blocks Google Drive preview by default | True | Inspected `vercel.json` CSP string: `default-src 'self'` without `frame-src` blocks external iframes | 2026-11-12 | stable |
| Node labels currently use raw IDs | True | Inspected `src/physics/graphSimulation.ts` L90: `label: n.id` | 2026-11-12 | stable |
| Hover card currently ignores pointer | True | Inspected `src/components/NodeHoverCard.tsx` L34: `pointer-events-none` | 2026-11-12 | stable |
| Vite dev server does not serve vercel.json headers | True | Tested against local dev server; headers require production build + edge emulator or Vercel preview | 2026-11-12 | stable |

## Unverified assumptions

| Assumption | What checking costs |
| :--- | :--- |
| Google Drive file link has public link sharing enabled ("anyone with link can view") | Manual owner check in Google Drive UI before public release |
| Mobile bottom sheet swipe gesture is intuitive without heavy animation libraries | Verified through standard CSS/DOM touch scrolling and overflow containment |

## Superseded claims

| What was believed | Why it was wrong | What replaced it |
| :--- | :--- | :--- |
| Node graph needs full titles everywhere | Long titles (`pict-climate-risk-viz-chatbot`) cause label collisions on small screens | Mandatory `shortTitle` on all projects for graph nodes; full titles in cards and inspector |
| Project action buttons belong in the 'Link' tab | Recruiters missed GitHub and demo links because media tab opened first | Elevated `Code ↗` and `Visit ↗` pinned right below title in sticky header and hover card |
| Action buttons named 'Live Demo' | User requested shorter, cleaner verb 'Visit' | Renamed to `Visit ↗` |
| Contact data belongs in `projects.ts` | Conflates project metadata with candidate identity | Dedicated `src/data/profile.ts` capability |

## Links out

- [portfolio_ux_candidate_experience_plan.md](../../../portfolio_ux_candidate_experience_plan.md)
- [vercel.json](../../vercel.json)
