import { LLMAdapter, GenerateOptions } from '../adapter';

// Dummy stubs for unsupported providers
// Replace this file when you implement OpenAI
export const openAIAdapter: LLMAdapter = {
    name: 'OpenAI',
    type: 'cloud',
    isAvailable: async () => false,
    generate: async () => { throw new Error('Not implemented'); },
    generateJSON: async () => { throw new Error('Not implemented'); }
};
