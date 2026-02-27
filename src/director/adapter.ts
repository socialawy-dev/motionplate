import type { Sequence } from '../spec/schema';

export interface GenerateOptions {
    temperature?: number;    // 0-1, default 0.3 for spec generation
    maxTokens?: number;      // default 4096
    systemPrompt?: string;   // Director system prompt
}

export interface LLMAdapter {
    name: string;
    type: 'cloud' | 'local';

    // Check if provider is available (API key set, server running, etc.)
    isAvailable(): Promise<boolean>;

    // Generate a completion from a prompt
    generate(prompt: string, options?: GenerateOptions): Promise<string>;

    // Generate structured JSON output
    generateJSON<T>(prompt: string, schema?: object, options?: GenerateOptions): Promise<T>;
}

export interface ImageMeta {
    filename: string;
    description?: string;
    width?: number;
    height?: number;
}

export interface Beat {
    text: string;           // The narrative prose for this beat
    durationTarget: number; // Suggested duration in seconds
    mood?: string;          // Extracted mood keywords (e.g., "tense", "calm")
    camera?: string;        // Suggested camera movement based on script
}

export interface DirectorInput {
    script: string;          // Raw text (the prose)
    images: ImageMeta[];     // { filename, width, height, description? }
    style?: 'cinematic' | 'documentary' | 'poetic' | 'dramatic';
    duration?: number;       // Target total duration in seconds
    provider: string;        // Which adapter to use
}

export interface DirectorOutput {
    sequence: Sequence;      // Valid sequence.json spec
    reasoning: string;       // Why the AI made these choices
    confidence: number;      // 0-1 self-assessed quality
    imageMapping: string[];  // imageMapping[i] = filename for plates[i]
}
