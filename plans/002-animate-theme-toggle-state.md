# 002 - Animate the theme toggle state locally

- **Status**: DONE
- **Commit**: 90c1c0e
- **Severity**: LOW
- **Category**: State indication / feedback
- **Estimated scope**: 2 files, about 30 lines

## Problem

The page colors transition, but the sun and moon SVGs are replaced immediately and the button has no press-scale confirmation.

```tsx
// src/components/theme-toggle/index.tsx:33 - current
<span className="theme-toggle__icon" aria-hidden>
    {isDark ? <IconSun /> : <IconMoon />}
</span>
```

```css
/* src/App.css:512 - current */
.theme-toggle {
    transition:
        color var(--motion-duration-fast) var(--motion-ease-out-quart),
        border-color var(--motion-duration-fast) var(--motion-ease-out-quart),
        background-color var(--motion-duration-fast) var(--motion-ease-out-quart),
        transform var(--motion-duration-fast) var(--motion-ease-out-quart);
}
```

## Target

Provide immediate press feedback and a compact state-change entrance on the new icon.

```css
.theme-toggle:active {
  transform: scale(0.97);
}

.theme-toggle__icon {
  animation: theme-icon-enter var(--motion-duration-fast)
    var(--motion-ease-out-quart) both;
}

@keyframes theme-icon-enter {
  from { opacity: 0; transform: scale(0.92) rotate(-12deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}
```

Use a React `key` derived from `preference` so only an intentional theme change runs the icon entrance. Under reduced motion, use `opacity 120ms var(--motion-ease-out-quart)` with no scale or rotation.

## Repo conventions to follow

- Reuse `--motion-duration-fast` and `--motion-ease-out-quart` from `src/App.css:352`.
- Match the existing `scale(0.97)` press language used by `.reference-card__action:active` in `src/pages/references/index.css`.
- Keep the current button, title, `aria-label`, and `aria-pressed` semantics.

## Steps

1. Add `key={preference}` to `.theme-toggle__icon` in `src/components/theme-toggle/index.tsx`.
2. Add `:active` scale feedback and the icon entrance keyframes in `src/App.css`.
3. In the global reduced-motion block, disable scale and rotation while retaining a 120ms opacity entrance.
4. Gate any hover translation on the theme button behind `(hover: hover) and (pointer: fine)`; keyboard focus must not translate the button.

## Boundaries

- Do NOT animate the entire header or page to explain theme state.
- Do NOT alter theme persistence, `meta[name=theme-color]`, or color tokens.
- Do NOT add bounce or exceed 160ms.

## Verification

- **Mechanical**: run `CI=true pnpm run build`; it must exit successfully.
- **Feel check**: toggle themes repeatedly on desktop and mobile.
  - Press scale is visible but subtle and releases immediately.
  - The incoming icon never renders from `scale(0)` and settles in 160ms.
  - The header does not shift as SVG sizes differ.
  - At 10% playback, no old and new icon double-exposure remains after the transition.
  - Reduced motion retains only the 120ms fade.
- **Done when**: the local icon clearly communicates the theme state change without making the global color transition feel slower.
