import { useState } from 'react';
import { useProjectStore } from '../store/project';
import { useSettingsStore } from '../store/settings';
import { directSequence } from '../director/director';
import { GeminiAdapter } from '../director/providers/gemini';
import { OllamaAdapter } from '../director/providers/ollama';
import { claudeAdapter } from '../director/providers/claude';
import { openAIAdapter } from '../director/providers/openai';
import type { DirectorInput, DirectorOutput } from '../director/adapter';

export default function DirectorPanel() {
    const images = useProjectStore((s) => s.images);
    const setSpec = useProjectStore((s) => s.setSpec);
    const setActiveMode = useSettingsStore((s) => s.setActiveMode);

    const [script, setScript] = useState('');
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [style, setStyle] = useState<'cinematic' | 'documentary' | 'poetic' | 'dramatic'>('cinematic');

    const [loading, setLoading] = useState(false);
    const [progressText, setProgressText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DirectorOutput | null>(null);

    const handleDirect = async () => {
        if (!script.trim()) {
            setError('Please enter a script.');
            return;
        }
        if (images.length === 0) {
            setError('Please upload images in the Compose tab before using the Director.');
            return;
        }

        setError(null);
        setResult(null);
        setLoading(true);
        setProgressText('Initializing...');

        try {
            let adapter;
            if (provider === 'gemini') {
                adapter = new GeminiAdapter(apiKey);
            } else if (provider === 'ollama') {
                adapter = new OllamaAdapter();
            } else if (provider === 'claude') {
                adapter = claudeAdapter;
            } else {
                adapter = openAIAdapter;
            }

            setProgressText('Checking availability...');
            const available = await adapter.isAvailable();
            if (!available && provider === 'gemini') {
                throw new Error('Adapter not available. Ensure you provided a valid API key.');
            } else if (!available && provider === 'ollama') {
                throw new Error('Ollama not available. Is the Ollama daemon running on localhost:11434?');
            }

            const input: DirectorInput = {
                script,
                images: images.map(img => ({
                    filename: img.file.name,
                    width: img.img.naturalWidth,
                    height: img.img.naturalHeight
                })),
                style,
                provider: adapter.name
            };

            setProgressText(`Directing sequence using ${adapter.name}... (Parsing -> Mapping -> Generating -> Validating)`);

            const output = await directSequence(input, adapter);
            setResult(output);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error during direction');
        } finally {
            setLoading(false);
            setProgressText('');
        }
    };

    const handleAccept = () => {
        if (result) {
            setSpec(result.sequence);
            setResult(null);
            setActiveMode('compose');
        }
    };

    if (images.length === 0) {
        return (
            <div className="panel panel--fullscreen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state">
                    <p className="empty-state__icon">🖼️</p>
                    <p className="empty-state__text">Please add images in the Compose tab first.</p>
                </div>
            </div>
        );
    }

    if (result) {
        const platesCount = result.sequence.plates.length;
        const totalDuration = result.sequence.plates.reduce((sum, p) => sum + p.duration, 0);
        const effectsUsed = Array.from(new Set(result.sequence.plates.map(p => p.effect))).join(', ');

        return (
            <div className="panel panel--fullscreen" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', overflowY: 'auto' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Review Sequence</h2>
                <div style={{ background: '#1c1c1c', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <p><strong>Plates:</strong> {platesCount}</p>
                    <p><strong>Total Duration:</strong> {totalDuration.toFixed(2)}s</p>
                    <p><strong>Effects Used:</strong> {effectsUsed}</p>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#2a2a2a', borderRadius: '4px' }}>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', fontStyle: 'italic' }}>
                            {result.reasoning}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn--primary"
                        onClick={handleAccept}
                        style={{ padding: '0.75rem 2rem' }}
                    >
                        Accept & Compose
                    </button>
                    <button
                        className="btn btn--secondary"
                        onClick={handleDirect}
                        style={{ padding: '0.75rem 2rem' }}
                    >
                        Regenerate
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="panel panel--fullscreen" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>AI Director</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Script / Plot text</label>
                    <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Paste your story script or narration here..."
                        style={{ width: '100%', minHeight: '150px', padding: '0.75rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                        disabled={loading}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Provider</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                            disabled={loading}
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="ollama">Ollama (Local)</option>
                            <option value="claude" disabled>Anthropic Claude (Stub)</option>
                            <option value="openai" disabled>OpenAI (Stub)</option>
                        </select>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Style Directive</label>
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value as 'cinematic' | 'documentary' | 'poetic' | 'dramatic')}
                            style={{ width: '100%', padding: '0.5rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                            disabled={loading}
                        >
                            <option value="cinematic">Cinematic (Slow drift, crossfades)</option>
                            <option value="documentary">Documentary (Static shots, pans)</option>
                            <option value="poetic">Poetic (Dreamy, lots of fades)</option>
                            <option value="dramatic">Dramatic (High contrast, cuts, shake)</option>
                        </select>
                    </div>
                </div>

                {provider === 'gemini' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Gemini API Key (Session only)</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            style={{ width: '100%', padding: '0.5rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                            disabled={loading}
                        />
                    </div>
                )}

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.3)', color: '#ff6b6b', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <button
                    className="btn btn--primary"
                    onClick={handleDirect}
                    disabled={loading || !script.trim()}
                    style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
                >
                    {loading ? 'Working...' : 'Direct Sequence'}
                </button>

                {loading && (
                    <div style={{ textAlign: 'center', color: '#00dc82', marginTop: '1rem' }}>
                        <span className="app__logo-icon" style={{ display: 'inline-block', animation: 'spin 2s linear infinite', marginRight: '0.5rem' }}>⬡</span>
                        {progressText}
                    </div>
                )}

            </div>
        </div>
    );
}
