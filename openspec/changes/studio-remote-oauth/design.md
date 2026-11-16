---
name: Project Studio Remote Auth
colors:
  primary: "var(--color-accent)"
  secondary: "var(--color-muted)"
  background: "var(--color-bg)"
  surface: "var(--color-surface)"
  text:
    primary: "var(--color-text)"
    muted: "var(--color-muted)"
  border: "var(--color-divider)"
  status:
    success: "#16a34a"
    warning: "#d97706"
    error: "#e5484d"
typography:
  fontFamily:
    sans: "var(--font-sans)"
    mono: "var(--font-mono)"
  scale:
    h1: "0.875rem (14px), uppercase tracking-[0.2em]"
    body: "1rem mobile / 0.875rem desktop"
    caption: "0.75rem (12px), font-mono"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  full: "9999px"
---

## 1. Visual Overview & Philosophy
- **Aesthetic Tone**: Technical drafting / monospace studio utility reusing the existing portfolio CSS tokens (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-accent`, `--color-divider`).
- **Target Surfaces**: Production `/#/studio` auth gate, mid-edit re-authentication banner, `sessionStorage` draft-restore prompt, `503` unconfigured notice, and post-save `studio/catalog` branch/preview link banner across desktop (`>= 1024px`) and mobile (`< 1024px`).

## 2. Color System & Contrast Rationale
Reuses existing portfolio theme tokens (`--color-text` on `--color-bg` / `--color-surface`, `--color-accent` for active/CTA borders) with WCAG AA compliance across both light and dark modes.

## 3. Typography Hierarchy
- **Header (`H1`)**: Monospace uppercase (`text-sm uppercase tracking-[0.2em]`).
- **Controls & Banners**: `text-base sm:text-sm` on inputs (prevents iOS Safari zoom) and `font-mono text-xs` on status pills and branch links.

## 4. Component Anatomy & States
- **Sign-In Card (`401` initial load)**: Centered surface card with `Sign in with GitHub` CTA (`min-h-11` touch target, navigates to `/api/studio/login`), `← Portfolio` exit link, and zero catalog data rendered.
- **Re-Authentication Banner (`401` mid-edit)**: Persists `{ draft, baseRevision }` to `sessionStorage` (`studio_pending_draft`) and displays a top warning banner (`Session expired. Sign in again to save — your unsaved edits are saved locally.`) with `Sign in with GitHub`.
- **Restored Draft Prompt (after OAuth callback)**: When `studio_pending_draft` exists on load, restores `draft` into the editor; if `baseRevision !== revision`, displays a clear warning banner (`Catalog updated on server since you started editing — review before saving`) with a `Discard Restored Draft` option.
- **Unconfigured Notice (`503`)**: Clear read-only notice explaining that remote Studio environment variables are not configured on this deployment.
- **Saved Branch Notice (`PUT 200`)**: Displays target branch (`studio/catalog`) and clickable commit/preview link in the Studio notice bar.

## 5. Responsive Layout & Breakpoints
Preserves the existing responsive `< lg` 3-tab layout (`Projects | Edit | Map & Tags`), `min-h-11` (`>= 44px`) touch targets, and sticky mobile bottom action bar (`pb-[env(safe-area-inset-bottom)]`), keeping Save/Discard active when authenticated in production.

## 6. Interaction, Motion & Sound
`transition-colors duration-150` on buttons and links; no audio triggers in Studio.

## 7. Do's and Don'ts
- **DO** reuse `--color-*` tokens and `min-h-11` mobile touch targets.
- **DO** persist pending `draft` + `baseRevision` to `sessionStorage` before full-page OAuth navigation.
- **DON'T** expose raw server error details, stack traces, or env var names in UI banners.
