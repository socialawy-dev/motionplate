import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { validateSequence } from '../../src/spec/validator';
import type { Sequence } from '../../src/spec/schema';
import { fileURLToPath } from 'url';

describe('Prologue Example Specification', () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const examplesDir = path.join(__dirname, '../../public/examples/prologue');
    const specPath = path.join(examplesDir, 'sequence.json');

    it('validates against the sequence schema', () => {
        const specContent = fs.readFileSync(specPath, 'utf-8');
        const spec = JSON.parse(specContent) as Sequence;
        const result = validateSequence(spec);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('has exactly 22 image files referenced in the directory', () => {
        for (let i = 1; i <= 22; i++) {
            const num = i.toString().padStart(2, '0');
            const imagePath = path.join(examplesDir, `plate-${num}.png`);
            expect(fs.existsSync(imagePath)).toBe(true);
        }
    });

    it('has exactly 22 plates mapped in the sequence', () => {
        const specContent = fs.readFileSync(specPath, 'utf-8');
        const spec = JSON.parse(specContent) as Sequence;
        expect(spec.plates).toHaveLength(22);
    });
});
