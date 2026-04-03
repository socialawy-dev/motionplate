import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AudioPanel from '../../src/composer/AudioPanel';
import { useProjectStore } from '../../src/store/project';

// Mock Web Audio API
class MockAudioContext {
    decodeAudioData() {
        return Promise.resolve({
            getChannelData: () => new Float32Array([0.1, -0.2, 0.3]),
            length: 3,
        });
    }
}
(globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;

// Mock window.URL
const mockCreateObjectURL = vi.fn(() => 'blob:test-audio-url');
const mockRevokeObjectURL = vi.fn();
(globalThis as unknown as { URL: { createObjectURL: typeof mockCreateObjectURL, revokeObjectURL: typeof mockRevokeObjectURL } }).URL.createObjectURL = mockCreateObjectURL;
(globalThis as unknown as { URL: { createObjectURL: typeof mockCreateObjectURL, revokeObjectURL: typeof mockRevokeObjectURL } }).URL.revokeObjectURL = mockRevokeObjectURL;

describe('AudioPanel', () => {
    beforeEach(() => {
        useProjectStore.getState().resetProject();
        vi.clearAllMocks();
    });

    it('renders Add Audio button initially', () => {
        render(<AudioPanel />);
        expect(screen.getByText('+ Add Audio')).toBeInTheDocument();
    });

    it('adds audio to the store and renders controls', async () => {
        render(<AudioPanel />);
        const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mpeg' });

        // Find the hidden input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(fileInput, { target: { files: [file] } });

        // Store should be updated
        expect(useProjectStore.getState().spec.audio?.src).toBe('test.mp3');

        // Should show the controls now
        await waitFor(() => {
            expect(screen.getByText('test.mp3')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Remove audio' })).toBeInTheDocument();
    });

    it('removes audio when the remove button is clicked', async () => {
        render(<AudioPanel />);
        const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mpeg' });
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText('test.mp3')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Remove audio' }));

        await waitFor(() => {
            expect(screen.getByText('+ Add Audio')).toBeInTheDocument();
        });
        expect(useProjectStore.getState().spec.audio).toBeUndefined();
    });

    it('updates volume via slider', async () => {
        render(<AudioPanel />);
        useProjectStore.getState().setAudio(new File([''], 'test.mp3', { type: 'audio/mpeg' }));

        await waitFor(() => {
            expect(screen.getByText('test.mp3')).toBeInTheDocument();
        });

        const volumeSlider = screen.getAllByRole('slider')[0];
        fireEvent.change(volumeSlider, { target: { value: '0.5' } });

        expect(useProjectStore.getState().spec.audio?.volume).toBe(0.5);
    });

    it('toggles mute correctly', async () => {
        render(<AudioPanel />);
        useProjectStore.getState().setAudio(new File([''], 'test.mp3', { type: 'audio/mpeg' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument();
        });

        const muteButton = screen.getByRole('button', { name: 'Mute' });
        fireEvent.click(muteButton);

        // Volume should be 0 now
        expect(useProjectStore.getState().spec.audio?.volume).toBe(0);

        // Now it's an unmute button
        const unmuteButton = screen.getByRole('button', { name: 'Unmute' });
        fireEvent.click(unmuteButton);

        // Volume should be restored to 1.0
        expect(useProjectStore.getState().spec.audio?.volume).toBe(1.0);
    });
});
