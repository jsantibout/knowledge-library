'use client';

import { useState, useEffect } from 'react';

interface SearchResult {
  title: string;
  url: string;
  section: string;
  snippet: string;
}

interface AskResponse {
  query: string;
  answer: string;
  sources: Array<{
    label: string;
    title: string;
    url: string;
    section: string;
  }>;
}

interface VisualizeResponse {
  success: boolean;
  mode: string;
  imageCount: number;
  answer: string;
  sources: Array<{
    label: string;
    title: string;
    url: string;
    section: string;
  }>;
  images: string[];
}

interface HealthStatus {
  ok: boolean;
  index_dir: string;
  collection: string;
  embed_model: string;
  openai_model?: string;
  llm_enabled: boolean;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [askResponse, setAskResponse] = useState<AskResponse | null>(null);
  const [visualizeResponse, setVisualizeResponse] = useState<VisualizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'ask' | 'visualize'>('search');
  const [visualizeMode, setVisualizeMode] = useState<'manga' | 'coloring'>('manga');
  const [imageCount, setImageCount] = useState(1);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAskResponse(null);
    setVisualizeResponse(null);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, k: 5 }),
      });
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchResults([]);
    setVisualizeResponse(null);
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, k: 5 }),
      });
      const data = await response.json();
      setAskResponse(data);
    } catch (error) {
      console.error('Ask failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualize = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchResults([]);
    setAskResponse(null);
    try {
      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          mode: visualizeMode,
          imageCount: imageCount
        }),
      });
      const data = await response.json();
      setVisualizeResponse(data);
    } catch (error) {
      console.error('Visualize failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'search') return handleSearch();
    if (activeTab === 'ask') return handleAsk();
    if (activeTab === 'visualize') return handleVisualize();
  };

  return (
    <div className="container-wide mt-6">
      {/* Status + Tabs */}
      <section className="card p-6 sm:p-8">
        {/* Health status */}
        {healthStatus && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="chip" role="status" aria-live="polite">
              <span
                className="dot"
                style={{ background: healthStatus.ok ? '#34d399' : '#ef4444' }}
              />
              <span>
                Backend {healthStatus.ok ? 'Connected' : 'Disconnected'}
                {healthStatus.llm_enabled ? ' • LLM Enabled' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
              <span>Index: <strong className="font-medium">{healthStatus.index_dir || '—'}</strong></span>
              <span>Collection: <strong className="font-medium">{healthStatus.collection || '—'}</strong></span>
              <span>Embed: <strong className="font-medium">{healthStatus.embed_model || '—'}</strong></span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center">
          <div className="segmented">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              aria-pressed={activeTab === 'search'}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ask')}
              aria-pressed={activeTab === 'ask'}
            >
              Ask AI
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('visualize')}
              aria-pressed={activeTab === 'visualize'}
            >
              🎨 Visualize
            </button>
          </div>
        </div>

        {/* Query form */}
        <form onSubmit={handleSubmit} className="mt-6 max-w-2xl mx-auto">
          <label htmlFor="query" className="sr-only">Enter your query</label>
          <div className="flex gap-2">
            <input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'search'
                  ? "Search for documents…"
                  : activeTab === 'ask'
                  ? "Ask a question about space biology…"
                  : "Ask to generate manga or coloring pages…"
              }
              className="input flex-1 bg-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn btn-primary"
            >
              {loading ? 'Working…' : activeTab === 'search' ? 'Search' : activeTab === 'ask' ? 'Ask' : 'Visualize'}
            </button>
          </div>

          {/* Visualize controls */}
          {activeTab === 'visualize' && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Style:
                </label>
                <select
                  value={visualizeMode}
                  onChange={(e) => setVisualizeMode(e.target.value as 'manga' | 'coloring')}
                  className="input py-2 px-3"
                >
                  <option value="manga">Manga</option>
                  <option value="coloring">Coloring Book</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Images:
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={imageCount}
                  onChange={(e) => setImageCount(parseInt(e.target.value) || 1)}
                  className="input w-24 py-2 px-3"
                />
              </div>
            </div>
          )}
        </form>
      </section>

      {/* Loading */}
      {loading && (
        <div className="text-center py-14">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-2 border-[var(--accent-2)] border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">
            {activeTab === 'search'
              ? 'Searching documents…'
              : activeTab === 'ask'
              ? 'Generating answer…'
              : 'Generating educational images…'}
          </p>
        </div>
      )}

      {/* Search Results */}
      {!loading && searchResults.length > 0 && (
        <section className="container-wide mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Search Results ({searchResults.length})</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {searchResults.map((result, i) => (
              <article key={i} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold leading-snug">
                    {result.title}
                  </h3>
                  <span
                    className="text-xs sm:text-sm px-2 py-1 rounded-md"
                    style={{ background: 'var(--subtle)', color: 'var(--fg-muted)' }}
                  >
                    {result.section}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                  {result.snippet}…
                </p>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium"
                  style={{ color: 'var(--accent-2)' }}
                >
                  View Source →
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Ask Response */}
      {!loading && askResponse && (
        <section className="container-wide mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">AI Response</h2>
          <article className="card p-6 sm:p-8 mb-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm sm:text-base">
                {askResponse.answer}
              </p>
            </div>
          </article>

          {askResponse.sources.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-3">Sources ({askResponse.sources.length})</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {askResponse.sources.map((source, i) => (
                  <div key={i} className="panel p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                          {source.label}
                        </span>
                        <h4 className="mt-1 text-sm font-medium">{source.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {source.section}
                        </span>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium"
                        style={{ color: 'var(--accent-2)' }}
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Visualize Results */}
      {!loading && visualizeResponse && (
        <section className="container-wide mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Generated Educational Images ({visualizeResponse.images.length})
          </h2>

          {/* Answer */}
          <article className="card p-6 sm:p-8 mb-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm sm:text-base">
                {visualizeResponse.answer}
              </p>
            </div>
          </article>

          {/* Images grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {visualizeResponse.images.map((image, index) => (
              <figure key={index} className="manga-frame">
                <img
                  src={`data:image/png;base64,${image}`}
                  alt={`Generated educational image ${index + 1}`}
                  className="w-full h-auto rounded-md"
                />
                <figcaption className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {visualizeResponse.mode === 'manga' ? 'Manga Panel' : 'Coloring Page'} {index + 1}
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Sources */}
          {visualizeResponse.sources.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Sources ({visualizeResponse.sources.length})
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {visualizeResponse.sources.map((source, i) => (
                  <div key={i} className="panel p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                          {source.label}
                        </span>
                        <h4 className="mt-1 text-sm font-medium">{source.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {source.section}
                        </span>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium"
                        style={{ color: 'var(--accent-2)' }}
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Empty state */}
      {!loading && searchResults.length === 0 && !askResponse && !visualizeResponse && query && (
        <div className="container-narrow text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">
            No results found. Try a different query.
          </p>
        </div>
      )}
    </div>
  );
}
