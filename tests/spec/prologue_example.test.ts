import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { validateSequence } from '../../src/spec/validator';

describe('Prologue Example Data', () => {
  it('has exactly 22 images that exist', () => {
    for (let i = 1; i <= 22; i++) {
      // eslint-disable-next-line no-undef
      const p = path.join(process.cwd() || '', 'public/examples/prologue', `plate-${String(i).padStart(2, '0')}.png`);
      expect(fs.existsSync(p)).toBe(true);
    }
  });

  it('sequence.json validates against schema', () => {
    // eslint-disable-next-line no-undef
    const jsonPath = path.join(process.cwd() || '', 'public/examples/prologue/sequence.json');
    const content = fs.readFileSync(jsonPath, 'utf8');
    const obj = JSON.parse(content);

    const result = validateSequence(obj);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);

    // Check plate count matches
    expect(obj.plates.length).toBe(22);
  });
});
