import { useEffect, useState } from 'react';
import { loadProjectThumbnail } from '../store/persistence';

interface ProjectThumbnailProps {
    projectId: string;
    title: string;
}

export function ProjectThumbnail({ projectId, title }: ProjectThumbnailProps) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        let objectUrl: string | null = null;

        loadProjectThumbnail(projectId).then((loadedUrl) => {
            if (active && loadedUrl) {
                objectUrl = loadedUrl;
                setUrl(loadedUrl);
            } else if (loadedUrl) {
                // If unmounted before load finished, clean up immediately
                URL.revokeObjectURL(loadedUrl);
            }
        });

        return () => {
            active = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [projectId]);

    if (!url) {
        return <div className="landing-page__card-placeholder">🎬</div>;
    }

    return <img src={url} alt={title} />;
}
