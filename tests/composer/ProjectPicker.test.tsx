import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectPicker from '../../src/composer/ProjectPicker';
import { useProjectStore } from '../../src/store/project';
import * as persistence from '../../src/store/persistence';

describe('ProjectPicker - Load Example', () => {
    beforeEach(() => {
        // Reset store and mocks
        useProjectStore.setState({ recentProjects: [], images: [] });
        vi.restoreAllMocks();

        // Mock persistence since indexedDB is not in jsdom
        vi.spyOn(persistence, 'estimateStorageUsed').mockResolvedValue(0);
        vi.spyOn(persistence, 'listProjects').mockResolvedValue([]);
    });

    it('should have a button to load the prologue example which triggers the store action', async () => {
        const loadExampleSpy = vi.fn().mockResolvedValue(undefined);
        useProjectStore.setState({ loadExampleProject: loadExampleSpy });

        render(<ProjectPicker />);

        // Open dropdown
        const trigger = screen.getByRole('button', { name: 'Project menu' });
        fireEvent.click(trigger);

        // Find and click the load example button
        const exampleBtn = await screen.findByRole('button', { name: 'Load Prologue Example' });
        expect(exampleBtn).toBeDefined();

        fireEvent.click(exampleBtn);

        // Expect the store action to have been called with 'prologue'
        expect(loadExampleSpy).toHaveBeenCalledWith('prologue');
    });
});
