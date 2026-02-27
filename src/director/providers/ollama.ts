import type { LLMAdapter, GenerateOptions } from '../adapter';

const DEFAULT_ENDPOINT = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'llama3';

export class OllamaAdapter implements LLMAdapter {
    name = 'Ollama';
    type = 'local' as const;
    private endpoint: string;
    private model: string;

    constructor(endpoint?: string, model?: string) {
        this.endpoint = endpoint || DEFAULT_ENDPOINT;
        this.model = model || DEFAULT_MODEL;
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Trying to hit the base URL to check if daemon is alive
            const baseUrl = new URL(this.endpoint).origin;
            const response = await fetch(baseUrl);
            return response.ok;
        } catch {
            return false;
        }
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestBody: any = {
            model: this.model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: options?.temperature ?? 0.3,
                num_predict: options?.maxTokens // optional
            }
        };

        if (options?.systemPrompt) {
            requestBody.system = options.systemPrompt;
        }

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data.response;
    }

    async generateJSON<T>(prompt: string, schema?: object, options?: GenerateOptions): Promise<T> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestBody: any = {
            model: this.model,
            prompt: prompt,
            stream: false,
            format: schema ? schema : 'json', // If no exact schema passed in Ollama valid format structure, use 'json' 
            options: {
                temperature: options?.temperature ?? 0.1, // Even lower temp for JSON to limit hallucinations
                num_predict: options?.maxTokens
            }
        };

        if (options?.systemPrompt) {
            requestBody.system = options.systemPrompt;
        }

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const textContent = data.response;

        try {
            return JSON.parse(textContent) as T;
        } catch (e) {
            throw new Error(`Failed to parse Ollama output as JSON: ${e instanceof Error ? e.message : 'Unknown error'}\nOutput was: ${textContent}`);
        }
    }
}
