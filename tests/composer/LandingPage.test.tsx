import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import LandingPage from '../../src/composer/LandingPage';
import { useProjectStore } from '../../src/store/project';

describe('LandingPage', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        useProjectStore.setState({
            recentProjects: [],
            refreshProjectList: vi.fn(),
            loadProjectById: vi.fn(),
            createNewProject: vi.fn(),
            clearRecentProjects: vi.fn(),
        });
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('displays the New Project card always', async () => {
        const root = createRoot(container);
        root.render(<LandingPage />);
        await new Promise(r => setTimeout(r, 0));

        const newCard = document.querySelector('[data-testid="new-project-card"]');
        expect(newCard).not.toBeNull();
        expect(newCard?.textContent).toContain('New Project');

        root.unmount();
    });

    it('displays up to 8 recent projects', async () => {
        const mockProjects = Array.from({ length: 10 }, (_, i) => ({
            id: `proj-${i}`,
            title: `Project ${i}`,
            plateCount: i,
            createdAt: Date.now() - i * 1000,
            updatedAt: Date.now() - i * 1000,
            hasThumbnail: false,
        }));

        useProjectStore.setState({ recentProjects: mockProjects });

        const root = createRoot(container);
        root.render(<LandingPage />);
        await new Promise(r => setTimeout(r, 0));

        const projectCards = document.querySelectorAll('[data-testid="recent-project-card"]');
        expect(projectCards.length).toBe(8);
        expect(container.textContent).toContain('Project 0');
        expect(container.textContent).toContain('Project 7');
        expect(container.textContent).not.toContain('Project 8');

        root.unmount();
    });

    it('calls loadProjectById when a project card is clicked', async () => {
        const mockLoad = vi.fn();
        const mockProjects = [
            { id: 'proj-1', title: 'Test Project', plateCount: 1, createdAt: 0, updatedAt: 0 }
        ];

        useProjectStore.setState({
            recentProjects: mockProjects,
            loadProjectById: mockLoad
        });

        const root = createRoot(container);
        root.render(<LandingPage />);
        await new Promise(r => setTimeout(r, 0));

        const card = document.querySelector('[data-testid="recent-project-card"]') as HTMLDivElement;
        card.click();

        expect(mockLoad).toHaveBeenCalledWith('proj-1');

        root.unmount();
    });

    it('calls clearRecentProjects when Clear all projects button is clicked and confirmed', async () => {
        const mockClear = vi.fn();
        const mockProjects = [
            { id: 'proj-1', title: 'Test Project', plateCount: 1, createdAt: 0, updatedAt: 0 }
        ];

        // Mock window.confirm to return true
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        useProjectStore.setState({
            recentProjects: mockProjects,
            clearRecentProjects: mockClear
        });

        const root = createRoot(container);
        root.render(<LandingPage />);
        await new Promise(r => setTimeout(r, 0));

        const buttons = document.querySelectorAll('button');
        const clearBtn = Array.from(buttons).find(b => b.textContent?.includes('Clear all projects'));

        expect(clearBtn).toBeDefined();
        clearBtn!.click();

        expect(confirmSpy).toHaveBeenCalledWith('Delete ALL saved projects permanently? This cannot be undone.');
        expect(mockClear).toHaveBeenCalled();

        confirmSpy.mockRestore();
        root.unmount();
    });

    it('does not call clearRecentProjects when Clear all projects button is clicked but cancelled', async () => {
        const mockClear = vi.fn();
        const mockProjects = [
            { id: 'proj-1', title: 'Test Project', plateCount: 1, createdAt: 0, updatedAt: 0 }
        ];

        // Mock window.confirm to return false
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        useProjectStore.setState({
            recentProjects: mockProjects,
            clearRecentProjects: mockClear
        });

        const root = createRoot(container);
        root.render(<LandingPage />);
        await new Promise(r => setTimeout(r, 0));

        const buttons = document.querySelectorAll('button');
        const clearBtn = Array.from(buttons).find(b => b.textContent?.includes('Clear all projects'));

        expect(clearBtn).toBeDefined();
        clearBtn!.click();

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockClear).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
        root.unmount();
    });

    it('does not display clear button when there are no recent projects', async () => {
        const root = createRoot(container);
        root.render(<LandingPage />);
        await new Promise(r => setTimeout(r, 0));

        const buttons = document.querySelectorAll('button');
        const clearBtn = Array.from(buttons).find(b => b.textContent?.includes('Clear all projects'));

        expect(clearBtn).toBeUndefined();

        root.unmount();
    });

    it('calls createNewProject when New Project card is clicked', async () => {
        const mockCreate = vi.fn();
        useProjectStore.setState({ createNewProject: mockCreate });

        const root = createRoot(container);
        root.render(<LandingPage />);
        await new Promise(r => setTimeout(r, 0));

        const newCard = document.querySelector('[data-testid="new-project-card"]') as HTMLDivElement;
        newCard.click();

        expect(mockCreate).toHaveBeenCalled();

        root.unmount();
    });

    it('calls loadExampleProject when Load Prologue Example card is clicked', async () => {
        const mockLoadExample = vi.fn();
        useProjectStore.setState({ loadExampleProject: mockLoadExample });

        const root = createRoot(container);
        root.render(<LandingPage />);
        await new Promise(r => setTimeout(r, 0));

        const exampleCard = document.querySelector('[data-testid="load-example-card"]') as HTMLDivElement;
        expect(exampleCard).not.toBeNull();
        exampleCard.click();

        expect(mockLoadExample).toHaveBeenCalled();

        root.unmount();
    });
});
