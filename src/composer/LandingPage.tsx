import { useEffect } from 'react';
import { useProjectStore } from '../store/project';
import { ProjectThumbnail } from './ProjectThumbnail';

export default function LandingPage() {
    const recentProjects = useProjectStore((s) => s.recentProjects);
    const refreshProjectList = useProjectStore((s) => s.refreshProjectList);
    const loadProjectById = useProjectStore((s) => s.loadProjectById);
    const createNewProject = useProjectStore((s) => s.createNewProject);
    const clearRecentProjects = useProjectStore((s) => s.clearRecentProjects);

    useEffect(() => {
        refreshProjectList();
    }, [refreshProjectList]);

    // limit to 8 recent projects, not including the "New Project" card
    const displayProjects = recentProjects.slice(0, 8);

    const handleClearAll = () => {
        if (window.confirm('Delete ALL saved projects permanently? This cannot be undone.')) {
            clearRecentProjects();
        }
    };

    return (
        <div className="landing-page">
            <div className="landing-page__header">
                <h2>Recent Projects</h2>
                {recentProjects.length > 0 && (
                    <button className="landing-page__clear-btn" onClick={handleClearAll} title="Permanently delete all projects">
                        Clear all projects
                    </button>
                )}
            </div>
            <div className="landing-page__grid">
                <div
                    className="landing-page__card landing-page__card--new"
                    onClick={createNewProject}
                    data-testid="new-project-card"
                >
                    <div className="landing-page__card-thumb">
                        <span>+</span>
                    </div>
                    <div className="landing-page__card-info">
                        <h3>New Project</h3>
                    </div>
                </div>
                <div
                    className="landing-page__card landing-page__card--example"
                    onClick={() => useProjectStore.getState().loadExampleProject()}
                    data-testid="load-example-card"
                >
                    <div className="landing-page__card-thumb">
                        <span>✨</span>
                    </div>
                    <div className="landing-page__card-info">
                        <h3>Load Prologue Example</h3>
                    </div>
                </div>
                {displayProjects.map((p) => (
                    <div
                        key={p.id}
                        className="landing-page__card"
                        onClick={() => loadProjectById(p.id)}
                        data-testid="recent-project-card"
                    >
                        <div className="landing-page__card-thumb">
                            {p.hasThumbnail ? (
                                <ProjectThumbnail projectId={p.id} title={p.title} />
                            ) : (
                                <div className="landing-page__card-placeholder">🎬</div>
                            )}
                        </div>
                        <div className="landing-page__card-info">
                            <h3>{p.title}</h3>
                            <p>{new Date(p.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
