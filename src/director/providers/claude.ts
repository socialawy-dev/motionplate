import { LLMAdapter, GenerateOptions } from '../adapter';

// Dummy stubs for unsupported providers
// Replace this file when you implement Claude
export const claudeAdapter: LLMAdapter = {
    name: 'Claude',
    type: 'cloud',
    isAvailable: async () => false,
    generate: async () => { throw new Error('Not implemented'); },
    generateJSON: async () => { throw new Error('Not implemented'); }
};
