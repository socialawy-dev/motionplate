import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Prologue Example Data', () => {
    // Determine dir cleanly without referencing globals
    const examplesDir = path.resolve('public/examples/prologue');

    it('has the sequence.json file', () => {
        expect(fs.existsSync(path.join(examplesDir, 'sequence.json'))).toBe(true);
    });

    it('has all 22 image plates', () => {
        for (let i = 1; i <= 22; i++) {
            const num = i.toString().padStart(2, '0');
            expect(fs.existsSync(path.join(examplesDir, `plate-${num}.png`))).toBe(true);
        }
    });

    it('sequence.json has 22 plates and parses correctly', () => {
        const data = fs.readFileSync(path.join(examplesDir, 'sequence.json'), 'utf8');
        const json = JSON.parse(data);
        expect(json.plates.length).toBe(22);
    });
});
