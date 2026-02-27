# Fix for renderer.ts

— Add one line at the top of applyOverlayTransition:

Find this function (around line 88):
```typescript
function applyOverlayTransition(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    plate: Plate,
    plateIdx: number,
    localTime: number,
): void {
    const transition = plate.transition ?? 'cut';
    if (transition === 'cut') return;
```
Replace with:
```typescript
function applyOverlayTransition(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    plate: Plate,
    plateIdx: number,
    localTime: number,
    nextPlateTransition?: string,
): void {
    const transition = plate.transition ?? 'cut';
    if (transition === 'cut') return;
    if (isCompositeTransition(transition)) return;

    const td = plate.transitionDuration ?? 1.0;
    const plateDur = plate.duration;
    const transFn = getTransition(transition);

    // Fade IN at the start (only if not the first plate)
    if (localTime < td && plateIdx > 0) {
        const tp = localTime / td;
        const v = transFn(tp);

        if (transition === 'fadeThroughWhite') {
            ctx.fillStyle = `rgba(255,255,255,${1 - v})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (transition === 'fadeThroughBlack') {
            ctx.fillStyle = `rgba(0,0,0,${1 - v})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (transition === 'lightBleed') {
            const flashAlpha = 1 - v;
            if (flashAlpha > 0) {
                ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            const fadeAlpha = 1 - v;
            if (fadeAlpha > 0.005) {
                ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    // Fade OUT at the end — but skip if the NEXT plate uses a composite transition
    // (the next plate's transition-IN will handle the blend)
    if (localTime > plateDur - td) {
        if (nextPlateTransition && isCompositeTransition(nextPlateTransition as TransitionName)) {
            // Next plate's composite will handle this — do nothing
        } else {
            const tp = (plateDur - localTime) / td;
            const alpha = Math.max(0, Math.min(1, tp));
            ctx.fillStyle = `rgba(0,0,0,${1 - alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    ctx.globalAlpha = 1;
}
```
Then update the call site in renderFrame — find the overlay transition call (in the standard path, around line 170):

```typescript
    // 3. Overlay transition
    applyOverlayTransition(ctx, canvas, plate, plateIdx, localTime);
```
Replace with:

```typescript
    // 3. Overlay transition
    const nextPlate = spec.plates[plateIdx + 1];
    applyOverlayTransition(ctx, canvas, plate, plateIdx, localTime, nextPlate?.transition);
```
Also need TransitionName in the import. Update the top import line:

```typescript
import type { Sequence, Plate, PlateAtTime, PostEffectName, TransitionName } from '../spec/schema';
```