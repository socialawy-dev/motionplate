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

    // Step 3: Build the director prompt with full context
    let systemPrompt = DIRECTOR_SYSTEM_PROMPT
        .replace('{SCHEMA_PLACEHOLDER}', SCHEMA_STRING)
        .replace('{BEATS_PLACEHOLDER}', JSON.stringify(mappedBeats, null, 2))
        .replace('{SCRIPT_PLACEHOLDER}', input.script)
        .replace('{BEAT_COUNT}', String(mappedBeats.length));

    const style = input.style || 'cinematic';
    const styleMap: Record<string, string> = {
        cinematic: `Cinematic style. Favor kenBurns with deliberate pan directions matching emotional movement. Use crossfade as default transition. Pacing should feel slow and intentional — 4-7s plates. Layer vignette + bloom or vignette + particles for atmosphere. Vary zoom direction per beat's emotional register.`,
        documentary: `Documentary style. Favor kenBurns with low endScale (1.05-1.1) and static for key moments. Use crossfade and fadeThroughBlack between sections. Pacing should be observational — 4-6s plates. Keep post effects minimal: vignette on most, fog sparingly. Text should feel like considered narration.`,
        poetic: `Poetic style. Favor drift and slow pulse effects. Heavy use of crossfade and fadeThroughWhite. Pacing should feel dreamlike — 5-8s plates, longer pauses. Layer vignette + bloom + particles for ethereal atmosphere. Every transition should feel like flowing water. Text overlays should be sparse and powerful.`,
        dramatic: `Dramatic style. Mix slow kenBurns builds with sudden cuts at emotional peaks. Use fadeThroughBlack between acts and cut for shock moments. Allow one screenShake at the climactic beat. Pacing should contrast — 6s contemplative plates then 2-3s action plates. chromaticAberration on tense moments.`
    };
    systemPrompt = systemPrompt.replace('{STYLE_PLACEHOLDER}', styleMap[style] || styleMap.cinematic);

    // Step 4: Generate Spec (with Retry Logic)
    console.log(`🎬 [Director] Generating spec sequence...`);
    const generatePrompt = `Generate the sequence.json now. Remember: output EXACTLY ${mappedBeats.length} plates, one per beat. Output ONLY valid JSON, no markdown.`;

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

        const retryPrompt = `${generatePrompt}\n\nWARNING: Your previous attempt failed with:\n${errorMessage}\n\nFix these errors. Output EXACTLY ${mappedBeats.length} plates. Output valid JSON only.`;

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

    // Build image mapping: plates[i] → filename from mappedBeats[i]
    const imageMapping = mappedBeats.map(b => b.imageFilename);

    const reasoning = `Generated ${sequenceOutput.plates.length} plates using ${adapter.name} in '${style}' style. Validation passed.${fallbackError ? ' Required 1 retry.' : ''}`;

    console.log(`🎬 [Director] Successfully generated Sequence!`);

    return {
        sequence: sequenceOutput,
        reasoning,
        confidence,
        imageMapping,
    };
}
