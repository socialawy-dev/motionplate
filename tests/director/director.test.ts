import { describe, it, expect } from 'vitest';
import type { LLMAdapter, DirectorInput } from '../../src/director/adapter';
import { directSequence } from '../../src/director/director';

class MockAdapter implements LLMAdapter {
    name = 'MockAdapter';
    type = 'local' as const;

    // Track consecutive calls for retry logic testing
    generateJSONCallCount = 0;

    async isAvailable() { return true; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    async generate(_prompt: string, _options?: any) {
        return "Mock response";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    async generateJSON<T>(prompt: string, _schema?: object, _options?: any): Promise<T> {
        this.generateJSONCallCount++;

        // Mocks for Parser and Mapper (first 2 calls)
        if (prompt.includes('break it down into visual beats')) {
            return {
                beats: [
                    { text: "Test beat", durationTarget: 4, mood: "calm" }
                ]
            } as T;
        }

        if (prompt.includes('Assign exactly one image to each beat')) {
            return [
                { beatIndex: 0, imageFilename: "test.webp", reasoning: "Test reasoning" }
            ] as T;
        }

        // Orchestrator Generation Calls
        if (this.generateJSONCallCount === 3) {
            // First attempt: return blatantly invalid JSON to trigger retry
            // We return an object that fails schema validation (missing required 'meta' or 'plates')
            return { thisIsInvalid: true } as T;
        }

        if (this.generateJSONCallCount === 4) {
            // Second attempt (retry): return valid sequence spec
            return {
                meta: {
                    title: "Test Sequence",
                    fps: 30,
                    width: 1920,
                    height: 1080,
                    schemaVersion: "1.0.0"
                },
                plates: [
                    {
                        id: "plate1",
                        duration: 4,
                        effect: "static",
                        transition: "cut"
                    }
                ]
            } as T;
        }

        throw new Error('Unexpected generateJSON call');
    }
}

describe('Director Orchestrator', () => {
    it('should successfully orchestrate parsing, mapping, and sequence generation with exactly one retry on invalid schema', async () => {
        const adapter = new MockAdapter();

        const input: DirectorInput = {
            script: "A test script.",
            images: [{ filename: "test.webp" }],
            provider: "MockAdapter"
        };

        const output = await directSequence(input, adapter);

        // Verify the output spec is the corrected one from the second (retry) attempt
        expect(output.sequence.meta.title).toBe("Test Sequence");
        expect(output.sequence.plates.length).toBe(1);

        // The parser + mapper + (1 fail + 1 retry) = 4 calls total to generateJSON
        expect(adapter.generateJSONCallCount).toBe(4);

        // Assert reasoning indicates a retry occurred
        expect(output.reasoning).toContain("Required 1 retry");
    });
});
