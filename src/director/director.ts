import type { LLMAdapter, DirectorInput, DirectorOutput } from './adapter';
import { parseScript } from './parser';
import { mapBeatsToImages } from './mapper';
import { DIRECTOR_SYSTEM_PROMPT } from './prompts';
import { validateSequence } from '../spec/validator';
import type { Sequence } from '../spec/schema';
import schemaData from '../../schemas/sequence.schema.json';

// We inject the entire JSON Schema as a string into the prompt
const SCHEMA_STRING = JSON.stringify(schemaData, null, 2);

export async function directSequence(input: DirectorInput, adapter: LLMAdapter): Promise<DirectorOutput> {
    console.log(`🎬 [Director] Starting direction with ${adapter.name}...`);

    // Step 1: Parse
    console.log(`🎬 [Director] Parsing script...`);
    const { beats } = await parseScript(input.script, adapter);
    console.log(`🎬 [Director] Extracted ${beats.length} beats.`);

    // Step 2: Map
    console.log(`🎬 [Director] Mapping beats to ${input.images.length} available images...`);
    const { mappedBeats } = await mapBeatsToImages(beats, input.images, adapter);
    console.log(`🎬 [Director] Mapped all beats successfully.`);

    // Step 3: Compile final system prompt
    let systemPrompt = DIRECTOR_SYSTEM_PROMPT.replace('{SCHEMA_PLACEHOLDER}', SCHEMA_STRING);
    systemPrompt = systemPrompt.replace('{BEATS_PLACEHOLDER}', JSON.stringify(mappedBeats, null, 2));

    const style = input.style || 'cinematic';
    const styleMap: Record<string, string> = {
        cinematic: 'Use slow drift, slight ken burns. Prefer crossfades over hard cuts unless tension requires it. Pacing should feel deliberate.',
        documentary: 'Use more static shots or slow pans. Occasional hard cuts. Focus on the subject.',
        poetic: 'Use lots of crossfades and slow fades. Drift effects work well. Dreamy pacing.',
        dramatic: 'High contrast between slow burns and sudden screen shakes or fast cuts when action hits.'
    };
    const styleInstruction = styleMap[style] || styleMap.cinematic;
    systemPrompt = systemPrompt.replace('{STYLE_PLACEHOLDER}', styleInstruction);

    // Step 4: Generate Spec (with Retry Logic)
    console.log(`🎬 [Director] Generating spec sequence...`);
    const generatePrompt = `Generate the sequence.json now. Remember: The output MUST EXACTLY validate against the provided JSON schema. Output ONLY valid JSON, do not include markdown blocks.`;

    let sequenceOutput: Sequence | null = null;
    let fallbackError: string | null = null;
    let confidence = 0.8; // Base guess

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawJsonOutput = await adapter.generateJSON<any>(generatePrompt, undefined, {
            systemPrompt: systemPrompt
        });

        const validation = validateSequence(rawJsonOutput);

        if (validation.valid) {
            sequenceOutput = rawJsonOutput as Sequence;
        } else {
            throw new Error(`Schema validation failed:\n${validation.errors.join('\n')}`);
        }

    } catch (e) {
        // Step 5: Failed first try. Execute exactly ONE retry appending the error.
        const errorMessage = e instanceof Error ? e.message : 'Unknown validation/parsing error';
        console.warn(`⚠️ [Director] Initial generation failed: ${errorMessage}. Attempting 1 retry...`);
        fallbackError = errorMessage;
        confidence -= 0.3; // Penalty for retry

        const retryPrompt = `${generatePrompt}\n\nWARNING: Your previous attempt failed with the following errors:\n${errorMessage}\n\nPlease fix these specific errors and output a perfectly valid JSON object matching the exact schema requirements.`;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const retryJsonOutput = await adapter.generateJSON<any>(retryPrompt, undefined, {
                systemPrompt: systemPrompt,
                temperature: 0.1 // Drop temperature further for retry
            });

            const validation = validateSequence(retryJsonOutput);
            if (validation.valid) {
                sequenceOutput = retryJsonOutput as Sequence;
            } else {
                throw new Error(`Schema validation failed again:\n${validation.errors.join('\n')}`);
            }
        } catch (retryError) {
            throw new Error(`Director completely failed after retry.\nOriginal Error: ${errorMessage}\nRetry Error: ${retryError instanceof Error ? retryError.message : 'Unknown'}`);
        }
    }

    if (!sequenceOutput) {
        throw new Error("Critical failure: sequenceOutput is null despite no throw.");
    }

    // Step 6: Fixup & Return
    // Provide some default dummy reasoning if the adapter structure doesn't support reasoning side-channels
    const reasoning = `Completed generation of ${sequenceOutput.plates.length} plates using ${adapter.name} targeting a '${style}' style. Validation passed. ${fallbackError ? 'Required 1 retry.' : ''}`;

    console.log(`🎬 [Director] Successfully generated Sequence!`);

    return {
        sequence: sequenceOutput,
        reasoning,
        confidence
    };
}
