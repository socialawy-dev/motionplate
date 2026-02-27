import type { TextConfig, TextPosition } from '../spec/schema';

// Arabic Unicode block — used for RTL auto-detection
const ARABIC_RE = /[\u0600-\u06FF]/;

/**
 * Detects whether a string contains Arabic characters.
 * Used to automatically enable RTL rendering.
 */
function isRTL(text: string): boolean {
    return ARABIC_RE.test(text);
}

/**
 * Word-wraps text to fit within `maxWidthPx` pixels using the current ctx font.
 */
function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidthPx: number,
): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidthPx) {
            if (current) lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

/**
 * Calculates the Y position of the first text line.
 */
function resolveY(
    position: TextPosition,
    canvasHeight: number,
    totalTextHeight: number,
    fontSize: number,
    lineHeight: number,
): number {
    const lineH = fontSize * lineHeight;
    switch (position) {
        case 'top':
            return 60;
        case 'bottom':
            return canvasHeight - totalTextHeight - 40;
        case 'center':
        default:
            return (canvasHeight - totalTextHeight) / 2 + lineH / 2;
    }
}

/**
 * Text overlay renderer — P1-21 / P1-22
 *
 * Renders word-wrapped text onto the canvas with fade-in/out and optional RTL.
 */
export function renderText(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    text: string,
    progress: number,
    config: TextConfig = {},
): void {
    const {
        fontSize = 28,
        fontFamily = 'Georgia, serif',
        color = '#ffffff',
        position = 'center',
        fadeIn = 0.15,
        fadeOut = 0.15,
        maxWidth = 0.8,
        shadow = true,
        lineHeight = 1.5,
    } = config;

    // Compute alpha
    let alpha = 1;
    if (progress < fadeIn) alpha = progress / fadeIn;
    else if (progress > 1 - fadeOut) alpha = (1 - progress) / fadeOut;
    alpha = Math.max(0, Math.min(1, alpha));
    if (alpha < 0.005) return;

    const rtl = isRTL(text);
    const maxWidthPx = canvas.width * maxWidth;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.direction = rtl ? 'rtl' : 'ltr';
    ctx.textAlign = rtl ? 'right' : 'center';
    ctx.textBaseline = 'middle';

    if (shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
    }

    const lines = wrapText(ctx, text, maxWidthPx);
    const lineH = fontSize * lineHeight;
    const totalTextHeight = lines.length * lineH;

    let y = resolveY(position as TextPosition, canvas.height, totalTextHeight, fontSize, lineHeight);
    const x = rtl ? canvas.width * (1 - (1 - maxWidth) / 2) : canvas.width / 2;

    for (const line of lines) {
        ctx.fillText(line, x, y);
        y += lineH;
    }

    ctx.restore();
}

export { isRTL, wrapText };
