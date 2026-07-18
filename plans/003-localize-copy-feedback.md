# 003 - Localize copy feedback on the triggering card

- **Status**: DONE
- **Commit**: 90c1c0e
- **Severity**: LOW
- **Category**: State indication
- **Estimated scope**: 2 files, about 55 lines

## Problem

Copy success is communicated only by a fixed toast at the bottom-right, far from the card button that initiated it.

```tsx
// src/pages/references/index.tsx:851 - current
const handleCopyDomain = async (domain: string): Promise<void> => {
    try {
        await copyTextToClipboard(domain);
        setToastMessage("已复制域名");
    } catch {
        setToastMessage("复制失败，请手动复制域名");
    }
};
```

```tsx
// src/pages/references/index.tsx:676 - current
<button
    type="button"
    className="reference-card__action"
    onClick={handleCopyClick}
    aria-label={`复制 ${item.primaryDomain} 域名`}
>
    <IconCopy />
    复制
</button>
```

## Target

Keep the existing live-region toast for global accessibility, and also change only the triggering button to a check icon plus `已复制` for 800ms. Crossfade the button content over 160ms using opacity and `filter: blur(2px)`; never blur more than 2px.

```css
.reference-card__action-content {
  opacity: 1;
  filter: blur(0);
  transition:
    opacity var(--motion-duration-fast) var(--motion-ease-out-quart),
    filter var(--motion-duration-fast) var(--motion-ease-out-quart);
}

.reference-card__action-content--changing {
  opacity: 0;
  filter: blur(2px);
}
```

Under reduced motion, remove blur and keep an opacity-only 120ms change. Failure must never show the success state.

## Repo conventions to follow

- Reuse `--motion-duration-fast` and `--motion-ease-out-quart`.
- Retain the existing `reference-toast` transition and `role="status"` at `src/pages/references/index.tsx:1098`.
- Preserve the current asynchronous clipboard fallback and error message.

## Steps

1. Add `copiedDomain` state and a dedicated 800ms reset timer in `ReferencesPage`; clear it during unmount and before another copy.
2. Set `copiedDomain` only after `copyTextToClipboard(domain)` succeeds.
3. Pass `isCopied` into `ReferenceCard` and render a stable content wrapper containing either the current copy icon/text or a new check icon/`已复制` label.
4. Add a brief changing phase or equivalent two-step state so opacity reaches zero before content swaps, then returns to one. Keep each leg within the shared 160ms token.
5. Add reduced-motion rules that remove blur and positional movement but retain opacity feedback.

## Boundaries

- Do NOT remove the toast or its live-region semantics.
- Do NOT copy automatically, alter clipboard contents, or change error behavior.
- Do NOT animate card size; reserve enough button width so `复制` and `已复制` do not shift adjacent actions.
- Do NOT add a dependency.

## Verification

- **Mechanical**: run `CI=true pnpm run build`; it must exit successfully.
- **Feel check**: copy domains from several reference cards in quick succession.
  - Only the latest triggering button reports `已复制`.
  - The button width and card layout remain stable.
  - Failure shows only the failure toast and never the check state.
  - At 10% playback, the content swap has no double-exposure; blur peaks at 2px.
  - Reduced motion uses opacity only.
- **Done when**: copy confirmation is visible next to its cause while the existing accessible global status remains correct.
