import { LLMAdapter, Beat } from './adapter';
import { PARSER_SYSTEM_PROMPT } from './prompts';

export interface ParseResult {
    beats: Beat[];
}

export async function parseScript(script: string, adapter: LLMAdapter): Promise<ParseResult> {
    const prompt = `Analyze the following script and break it down into visual beats:\n\n${script}\n\nReturn ONLY a JSON array.`;

    try {
        const rawOutput = await adapter.generateJSON<any>(prompt, undefined, {
            systemPrompt: PARSER_SYSTEM_PROMPT,
            temperature: 0.2
        });

        // Fail-fast validation
        let beatsArray: any[];

        // Handle case where LLM wraps array in an object: { "beats": [...] }
        if (rawOutput && !Array.isArray(rawOutput) && Array.isArray(rawOutput.beats)) {
            beatsArray = rawOutput.beats;
        } else if (Array.isArray(rawOutput)) {
            beatsArray = rawOutput;
        } else {
            throw new Error("Output is not a JSON array.");
        }

        const beats: Beat[] = beatsArray.map((b: any, index: number) => {
            if (typeof b.text !== 'string') {
                throw new Error(`Beat at index ${index} is missing or has invalid "text" field.`);
            }
            if (typeof b.durationTarget !== 'number') {
                throw new Error(`Beat at index ${index} is missing or has invalid "durationTarget" field.`);
            }
            return {
                text: b.text,
                durationTarget: b.durationTarget,
                mood: b.mood,
                camera: b.camera
            };
        });

        if (beats.length === 0) {
            throw new Error("Parsed zero beats from the script.");
        }

        return { beats };
    } catch (e) {
        throw new Error(`Parser failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}
