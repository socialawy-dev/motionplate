import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import ProjectPicker from '../../src/composer/ProjectPicker';
import { useProjectStore } from '../../src/store/project';

vi.mock('../../src/store/persistence', () => ({
    estimateStorageUsed: vi.fn().mockResolvedValue(100),
    formatBytes: vi.fn().mockReturnValue('100 B'),
}));

describe('ProjectPicker', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        useProjectStore.setState({
            recentProjects: [],
            refreshProjectList: vi.fn(),
            loadProjectById: vi.fn(),
            createNewProject: vi.fn(),
            deleteProjectById: vi.fn(),
            loadExample: vi.fn(),
            isLoading: false,
            projectId: 'proj-1',
            spec: { meta: { title: 'Test Project', fps: 30, width: 1280, height: 720, schemaVersion: '1.1.0' }, plates: [] }
        });
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('renders and calls loadExample when Prologue Example is clicked', async () => {
        const mockLoadExample = vi.fn();
        useProjectStore.setState({ loadExample: mockLoadExample });

        const root = createRoot(container);
        root.render(<ProjectPicker />);
        await new Promise(r => setTimeout(r, 0));

        // Open dropdown
        const trigger = container.querySelector('.project-picker__trigger') as HTMLButtonElement;
        trigger.click();
        await new Promise(r => setTimeout(r, 0));

        // Find Prologue Example
        const items = container.querySelectorAll('.project-picker__item');
        const exampleItem = Array.from(items).find(el => el.textContent?.includes('Prologue Example')) as HTMLDivElement;
        expect(exampleItem).toBeDefined();

        // Click it
        exampleItem.click();
        expect(mockLoadExample).toHaveBeenCalledWith('prologue');

        root.unmount();
    });
});
