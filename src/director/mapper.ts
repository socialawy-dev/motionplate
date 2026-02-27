import type { LLMAdapter, Beat, ImageMeta } from './adapter';
import { MAPPER_SYSTEM_PROMPT } from './prompts';

export interface MappedBeat extends Beat {
    imageFilename: string;
    imageReasoning?: string;
}

export interface MapResult {
    mappedBeats: MappedBeat[];
}

export async function mapBeatsToImages(beats: Beat[], images: ImageMeta[], adapter: LLMAdapter): Promise<MapResult> {

    if (images.length === 0) {
        throw new Error("Cannot map beats: No images provided.");
    }

    const beatsJson = JSON.stringify(beats, null, 2);
    const imagesJson = JSON.stringify(images, null, 2);

    const prompt = `Story Beats:\n${beatsJson}\n\nAvailable Images:\n${imagesJson}\n\nAssign exactly one image to each beat. Return ONLY a JSON array.`;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawOutput = await adapter.generateJSON<any>(prompt, undefined, {
            systemPrompt: MAPPER_SYSTEM_PROMPT,
            temperature: 0.2
        });

        // Fail-fast validation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mappingsArray: any[];

        if (rawOutput && !Array.isArray(rawOutput) && Array.isArray(rawOutput.assignments)) {
            mappingsArray = rawOutput.assignments;
        } else if (Array.isArray(rawOutput)) {
            mappingsArray = rawOutput;
        } else {
            throw new Error("Output is not a JSON array.");
        }

        if (mappingsArray.length !== beats.length) {
            throw new Error(`Expected ${beats.length} mappings, but got ${mappingsArray.length}.`);
        }

        const mappedBeats: MappedBeat[] = [];

        for (let i = 0; i < beats.length; i++) {
            // Find mapping for this beat index
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapping = mappingsArray.find((m: any) => m.beatIndex === i);

            if (!mapping) {
                throw new Error(`Missing mapping for beatIndex ${i}.`);
            }
            if (typeof mapping.imageFilename !== 'string') {
                throw new Error(`Mapping for beatIndex ${i} missing valid imageFilename.`);
            }

            // Verify the image exists in the provided images array to prevent hallucinations
            const imageExists = images.some(img => img.filename === mapping.imageFilename);
            if (!imageExists) {
                throw new Error(`LLM hallucinated image filename "${mapping.imageFilename}" that was not in the provided list.`);
            }

            mappedBeats.push({
                ...beats[i],
                imageFilename: mapping.imageFilename,
                imageReasoning: mapping.reasoning
            });
        }

        return { mappedBeats };

    } catch (e) {
        throw new Error(`Mapper failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}
