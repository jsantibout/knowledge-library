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
  mode: "manga" | "coloring" | string;
  imageCount: number;
  answer: string;
  sources: Array<{
    label: string;
    title: string;
    url: string;
    section: string;
  }>;
  images: string[];
  error?: string;
}

interface HealthStatus {
  ok: boolean;
  index_dir: string;
  collection: string;
  embed_model: string;
  openai_model?: string;
  llm_enabled: boolean;
}

const safeArr = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
const len = (x: unknown): number => (Array.isArray(x) ? x.length : 0);

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check backend health on component mount
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch((err) => {
        console.error('Health check failed:', err),
          setHealthStatus(null);
      });
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
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
      setErrorMsg(error?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSearchResults([]);
    setVisualizeResponse(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, k: 5 }),
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Ask failed: ${response.status} ${txt}`);
      }
      const data = await response.json();
      setAskResponse({
        query: data.query ?? "",
        answer: data.answer ?? "",
        sources: safeArr(data.sources),
      });
    } catch (error: any) {
      console.error('Ask failed:', error);
      setErrorMsg(error?.message || "Ask failed.");
      setAskResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualize = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSearchResults([]);
    setAskResponse(null);

    try {
      const response = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          mode: visualizeMode,
          imageCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Ensure safe state on error
        setVisualizeResponse({
          success: false,
          mode: visualizeMode,
          imageCount: 0,
          answer: "",
          sources: [],
          images: [],
          error: data?.error || "Visualization failed.",
        });
        setErrorMsg(data?.error || "Visualization failed.");
        return;
      }

      setVisualizeResponse({
        success: !!data.success,
        mode: data.mode ?? visualizeMode,
        imageCount: Array.isArray(data.images) ? data.images.length : data.imageCount ?? 0,
        answer: data.answer ?? "",
        sources: safeArr(data.sources),
        images: safeArr<string>(data.images),
      });
    } catch (error: any) {
      console.error("Visualize failed:", error);
      setErrorMsg(error?.message || "Visualization failed.");
      // Safe fallback object
      setVisualizeResponse({
        success: false,
        mode: visualizeMode,
        imageCount: 0,
        answer: "",
        sources: [],
        images: [],
        error: error?.message || "Visualization failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'search') {
      handleSearch();
    } else if (activeTab === 'ask') {
      handleAsk();
    } else if (activeTab === 'visualize') {
      handleVisualize();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-teal)] flex items-center justify-center shadow-lg">
              <span className="text-2xl">🧬</span>
            </div>
            <div className="text-left">
              <h1 className="text-scientific-title youth-accent">
                SpaceBio Knowledge Library
              </h1>
              <p className="text-scientific-caption text-[var(--foreground-secondary)] mt-1">
                Research • Discover • Learn
              </p>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-scientific-subtitle mb-6">
              Unlock NASA bioscience research through AI-powered educational manga and coloring books designed to inspire the next generation of scientists
            </p>
            
            {/* Mission Statement Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[var(--border-subtle)] bg-white/50 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-coral)]"></span>
                Scientific Research
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[var(--border-subtle)] bg-white/50 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-yellow)]"></span>
                AI-Powered Learning
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[var(--border-subtle)] bg-white/50 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-purple)]"></span>
                Youth Education
              </span>
            </div>
          </div>
          
          {/* Health Status */}
          {healthStatus && (
            <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm ${
              healthStatus.ok 
                ? 'status-connected' 
                : 'status-disconnected'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${healthStatus.ok ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-sm font-medium">
                  System {healthStatus.ok ? 'Online' : 'Offline'}
                </span>
              </div>
              {healthStatus.llm_enabled && (
                <>
                  <div className="w-1 h-1 rounded-full bg-current opacity-50"></div>
                  <span className="text-xs font-medium opacity-75">AI Ready</span>
                </>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Research Mode Navigation */}
        <div className="flex justify-center mb-8">
          <div className="glass-effect rounded-2xl p-2 shadow-lg">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'search'
                    ? 'bg-[var(--accent-blue)] text-[var(--foreground)] shadow-md transform scale-105'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)]'
                }`}
              >
                <span className="text-lg">🔍</span>
                <span>Search</span>
                {activeTab === 'search' && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[var(--accent-coral)] rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('ask')}
                className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'ask'
                    ? 'bg-[var(--accent-teal)] text-[var(--foreground)] shadow-md transform scale-105'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)]'
                }`}
              >
                <span className="text-lg">🤖</span>
                <span>Ask AI</span>
                {activeTab === 'ask' && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[var(--accent-coral)] rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('visualize')}
                className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'visualize'
                    ? 'bg-[var(--accent-purple)] text-[var(--foreground)] shadow-md transform scale-105'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)]'
                }`}
              >
                <span className="text-lg">🎨</span>
                <span>Visualize</span>
                {activeTab === 'visualize' && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[var(--accent-coral)] rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mode Description */}
        <div className="text-center mb-8">
          <div className="max-w-md mx-auto">
            {activeTab === 'search' && (
              <p className="text-scientific-body text-[var(--foreground-secondary)]">
                <span className="font-semibold text-[var(--accent-blue)]">Scientific Search:</span> Find relevant NASA bioscience research documents using semantic search
              </p>
            )}
            {activeTab === 'ask' && (
              <p className="text-scientific-body text-[var(--foreground-secondary)]">
                <span className="font-semibold text-[var(--accent-teal)]">AI Research Assistant:</span> Ask questions and get comprehensive answers backed by scientific sources
              </p>
            )}
            {activeTab === 'visualize' && (
              <p className="text-scientific-body text-[var(--foreground-secondary)]">
                <span className="font-semibold text-[var(--accent-purple)]">Educational Visualizer:</span> Generate manga panels or coloring books to make science accessible and fun
              </p>
            )}
          </div>
        </div>

        {/* Research Query Interface */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-12">
          <div className="scientific-card p-6">
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    activeTab === 'search' 
                      ? "Search NASA bioscience research documents..." 
                      : activeTab === 'ask'
                      ? "Ask a question about space biology research..."
                      : "Describe what you'd like to learn about for educational visualization..."
                  }
                  className="input-scientific text-lg py-4 pr-12"
                  disabled={loading}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <span className="text-lg">×</span>
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className={`btn-scientific-primary px-8 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                  loading ? 'animate-pulse' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="loading-spinner"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>
                      {activeTab === 'search' ? '🔍' : activeTab === 'ask' ? '🤖' : '🎨'}
                    </span>
                    <span>
                      {activeTab === 'search' ? 'Search' : activeTab === 'ask' ? 'Ask AI' : 'Visualize'}
                    </span>
                  </div>
                )}
              </button>
            </div>
            
            {/* Visualize-specific controls */}
            {activeTab === 'visualize' && (
              <div className="flex flex-wrap gap-6 items-center justify-center pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <label className="text-scientific-caption font-semibold text-[var(--foreground)]">
                    Art Style:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVisualizeMode('manga')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        visualizeMode === 'manga'
                          ? 'bg-[var(--accent-purple)] text-white shadow-md'
                          : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--hover-overlay)]'
                      }`}
                    >
                      📚 Manga Style
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisualizeMode('coloring')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        visualizeMode === 'coloring'
                          ? 'bg-[var(--accent-purple)] text-white shadow-md'
                          : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--hover-overlay)]'
                      }`}
                    >
                      🎨 Coloring Book
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-scientific-caption font-semibold text-[var(--foreground)]">
                    Images:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setImageCount(num)}
                        className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                          imageCount === num
                            ? 'bg-[var(--accent-coral)] text-white shadow-md transform scale-110'
                            : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--hover-overlay)]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="scientific-card max-w-md mx-auto p-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="loading-spinner w-12 h-12"></div>
                  <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-[var(--accent-coral)] rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
                </div>
                <div className="text-center">
                  <h3 className="text-scientific-body font-semibold text-[var(--foreground)] mb-2">
                    {activeTab === 'search' ? '🔍 Analyzing Research Database' : 
                     activeTab === 'ask' ? '🤖 AI Processing Your Question' : 
                     '🎨 Creating Educational Visuals'}
                  </h3>
                  <p className="text-scientific-caption text-[var(--foreground-secondary)]">
                    {activeTab === 'search' ? 'Searching through NASA bioscience documents...' : 
                     activeTab === 'ask' ? 'Generating comprehensive research-backed answer...' : 
                     'Crafting manga panels and coloring pages...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!loading && searchResults.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue)] flex items-center justify-center">
                <span className="text-lg text-white">🔍</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Research Documents Found
                </h2>
                <p className="text-scientific-caption text-[var(--foreground-secondary)]">
                  {searchResults.length} relevant NASA bioscience {searchResults.length === 1 ? 'document' : 'documents'}
                </p>
              </div>
            </div>
            
            <div className="scientific-grid">
              {searchResults.map((result, index) => (
                <div key={index} className="scientific-card group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-blue)] transition-colors leading-tight">
                        {result.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-[var(--accent-blue)] bg-opacity-10 text-[var(--accent-blue)] border border-[var(--accent-blue)] border-opacity-20">
                          {result.section}
                        </span>
                        <span className="text-xs text-[var(--foreground-secondary)]">
                          Document #{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-scientific-body text-[var(--foreground-secondary)] mb-4 leading-relaxed">
                    {result.snippet}...
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--foreground-secondary)] font-medium">
                      NASA Research Archive
                    </span>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:bg-opacity-10 transition-all group-hover:transform group-hover:translate-x-1"
                    >
                      <span>View Source</span>
                      <span className="text-xs">→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask Response */}
        {!loading && askResponse && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-teal)] flex items-center justify-center">
                <span className="text-lg text-white">🤖</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  AI Research Assistant Response
                </h2>
                <p className="text-scientific-caption text-[var(--foreground-secondary)]">
                  Comprehensive analysis backed by scientific sources
                </p>
              </div>
            </div>
            
            {/* Main AI Response in Manga-style Panel */}
            <div className="manga-panel mb-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-teal)] to-[var(--accent-blue)] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg text-white">🤖</span>
                </div>
                <div className="flex-1">
                  <div className="manga-speech-bubble">
                    <div className="text-scientific-body text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                      {askResponse.answer}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[var(--foreground-secondary)] italic">
                  AI Research Assistant • Powered by Scientific Knowledge Base
                </span>
              </div>
            </div>
            
            {/* Sources Section */}
            {askResponse.sources.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)] bg-opacity-20 flex items-center justify-center">
                    <span className="text-sm">📚</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    Scientific Sources ({askResponse.sources.length})
                  </h3>
                </div>
                
                <div className="scientific-grid">
                  {askResponse.sources.map((source, index) => (
                    <div key={index} className="scientific-card group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-[var(--accent-teal)] bg-opacity-15 text-[var(--accent-teal)]">
                              {source.label}
                            </span>
                            <span className="text-xs text-[var(--foreground-secondary)]">
                              Source #{index + 1}
                            </span>
                          </div>
                          <h4 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-teal)] transition-colors leading-tight">
                            {source.title}
                          </h4>
                          <span className="text-sm text-[var(--foreground-secondary)] mt-1 block">
                            {source.section}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                        <span className="text-xs text-[var(--foreground-secondary)] font-medium">
                          Referenced in AI Response
                        </span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--accent-teal)] hover:bg-[var(--accent-teal)] hover:bg-opacity-10 transition-all group-hover:transform group-hover:translate-x-1"
                        >
                          <span>Read Full Paper</span>
                          <span className="text-xs">→</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visualize Results */}
        {!loading && visualizeResponse && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-purple)] flex items-center justify-center">
                <span className="text-lg text-white">🎨</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Educational {visualizeResponse.mode === 'manga' ? 'Manga Panels' : 'Coloring Pages'} Generated
                </h2>
                <p className="text-scientific-caption text-[var(--foreground-secondary)]">
                  {visualizeResponse.images.length} custom {visualizeResponse.mode === 'manga' ? 'manga-style illustrations' : 'coloring book pages'} for youth education
                </p>
              </div>
            </div>
            
            {/* Educational Context */}
            <div className="manga-panel mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-coral)] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg text-white">👩‍🔬</span>
                </div>
                <div className="flex-1">
                  <div className="manga-speech-bubble">
                    <div className="text-scientific-body text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                      {visualizeResponse.answer}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right mt-4">
                <span className="text-xs text-[var(--foreground-secondary)] italic">
                  Educational Context • Designed for Young Scientists
                </span>
              </div>
            </div>
            
            {/* Generated Images Gallery */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-coral)] bg-opacity-20 flex items-center justify-center">
                  <span className="text-sm">{visualizeResponse.mode === 'manga' ? '📚' : '🖍️'}</span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {visualizeResponse.mode === 'manga' ? 'Manga Story Panels' : 'Interactive Coloring Pages'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visualizeResponse.images.map((image, index) => (
                  <div key={index} className="scientific-card group overflow-hidden">
                    <div className="relative">
                      <img
                        src={`data:image/png;base64,${image}`}
                        alt={`Generated educational ${visualizeResponse.mode} ${index + 1}`}
                        className="w-full h-auto rounded-lg transition-transform group-hover:scale-105"
                        style={{ 
                          border: visualizeResponse.mode === 'manga' 
                            ? '3px solid var(--foreground)' 
                            : '2px dashed var(--accent-coral)',
                          borderRadius: '12px'
                        }}
                      />
                      {visualizeResponse.mode === 'manga' && (
                        <div className="absolute top-2 left-2 bg-[var(--accent-coral)] text-white px-2 py-1 rounded-lg text-xs font-bold">
                          Panel {index + 1}
                        </div>
                      )}
                      {visualizeResponse.mode === 'coloring' && (
                        <div className="absolute top-2 right-2 bg-[var(--accent-yellow)] text-[var(--foreground)] px-2 py-1 rounded-lg text-xs font-bold">
                          Color Me! 🖍️
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-[var(--foreground)] text-sm">
                            {visualizeResponse.mode === 'manga' ? `Manga Panel ${index + 1}` : `Coloring Page ${index + 1}`}
                          </h4>
                          <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                            {visualizeResponse.mode === 'manga' 
                              ? 'Educational story illustration' 
                              : 'Interactive learning activity'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 rounded-lg bg-[var(--accent-blue)] bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center transition-colors">
                            <span className="text-sm">💾</span>
                          </button>
                          <button className="w-8 h-8 rounded-lg bg-[var(--accent-purple)] bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center transition-colors">
                            <span className="text-sm">🔍</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sources for Visualizations */}
            {visualizeResponse.sources.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)] bg-opacity-20 flex items-center justify-center">
                    <span className="text-sm">📖</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    Scientific Sources for Educational Content ({visualizeResponse.sources.length})
                  </h3>
                </div>
                
                <div className="scientific-grid">
                  {visualizeResponse.sources.map((source, index) => (
                    <div key={index} className="scientific-card group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-[var(--accent-purple)] bg-opacity-15 text-[var(--accent-purple)]">
                              {source.label}
                            </span>
                            <span className="text-xs text-[var(--foreground-secondary)]">
                              Visualization Source #{index + 1}
                            </span>
                          </div>
                          <h4 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-purple)] transition-colors leading-tight">
                            {source.title}
                          </h4>
                          <span className="text-sm text-[var(--foreground-secondary)] mt-1 block">
                            {source.section}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                        <span className="text-xs text-[var(--foreground-secondary)] font-medium">
                          Used in Educational Visualization
                        </span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--accent-purple)] hover:bg-[var(--accent-purple)] hover:bg-opacity-10 transition-all group-hover:transform group-hover:translate-x-1"
                        >
                          <span>Original Research</span>
                          <span className="text-xs">→</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visualization Error (if any) */}
            {visualizeResponse.error && (
              <div className="mt-4 p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {visualizeResponse.error}
              </div>
            )}
          </div>
        )}

        {/* No Results State */}
        {!loading && searchResults.length === 0 && !askResponse && !visualizeResponse && query && (
          <div className="text-center py-16">
            <div className="scientific-card max-w-md mx-auto p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--background-secondary)] flex items-center justify-center">
                  <span className="text-2xl opacity-50">🔍</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                    No Results Found
                  </h3>
                  <p className="text-scientific-caption text-[var(--foreground-secondary)] mb-4">
                    We couldn't find any NASA bioscience research matching your query.
                  </p>
                  <div className="text-xs text-[var(--foreground-secondary)]">
                    <p className="mb-2"><strong>Try:</strong></p>
                    <ul className="text-left space-y-1">
                      <li>• Different keywords or phrases</li>
                      <li>• More general terms</li>
                      <li>• Scientific terminology variations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
