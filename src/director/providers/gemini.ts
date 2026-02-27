import { LLMAdapter, GenerateOptions } from '../adapter';

// Default Gemini model
const GEMINI_MODEL = 'gemini-2.5-flash';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiAdapter implements LLMAdapter {
    name = 'Gemini';
    type = 'cloud' as const;
    private apiKey: string;

    constructor(apiKey?: string) {
        // Attempt to get API key from env if available (e.g., in Node/Vite tests)
        this.apiKey = apiKey || import.meta.env?.VITE_GEMINI_API_KEY || '';
    }

    async isAvailable(): Promise<boolean> {
        return !!this.apiKey;
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const payload = this.buildPayload(prompt, options);

        const response = await fetch(`${API_URL}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return this.extractText(data);
    }

    async generateJSON<T>(prompt: string, schema?: object, options?: GenerateOptions): Promise<T> {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const payload = this.buildPayload(prompt, options);

        // Enforce JSON output formatting for Gemini
        payload.generationConfig = {
            ...payload.generationConfig,
            responseMimeType: 'application/json',
        };

        if (schema) {
            payload.generationConfig.responseSchema = schema;
        }

        const response = await fetch(`${API_URL}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const textContent = this.extractText(data);

        try {
            return JSON.parse(textContent) as T;
        } catch (e) {
            throw new Error(`Failed to parse Gemini output as JSON: ${e instanceof Error ? e.message : 'Unknown error'}\nOutput was: ${textContent}`);
        }
    }

    // Helper to build the request specific to Gemini
    private buildPayload(prompt: string, options?: GenerateOptions): any {
        const contents: any[] = [];

        // Add system instruction if provided
        let systemInstruction;
        if (options?.systemPrompt) {
            systemInstruction = {
                parts: [{ text: options.systemPrompt }]
            };
        }

        // Add user prompt
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });

        return {
            contents,
            systemInstruction,
            generationConfig: {
                temperature: options?.temperature ?? 0.3,
                maxOutputTokens: options?.maxTokens ?? 8192,
            }
        };
    }

    // Helper to safely extract response from Gemini payload
    private extractText(data: any): string {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text === undefined || text === null) {
            throw new Error('Unexpected empty response from Gemini API');
        }
        return text;
    }
}
