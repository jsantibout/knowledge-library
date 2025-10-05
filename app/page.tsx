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
    // Check backend health on component mount
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setAskResponse(null);
    
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
    if (activeTab === 'search') {
      handleSearch();
    } else if (activeTab === 'ask') {
      handleAsk();
    } else if (activeTab === 'visualize') {
      handleVisualize();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            SpaceBio Knowledge Library
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Search and query NASA bioscience research documents
          </p>
          
          {/* Health Status */}
          {healthStatus && (
            <div className={`mt-4 p-3 rounded-lg ${
              healthStatus.ok 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${healthStatus.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  Backend {healthStatus.ok ? 'Connected' : 'Disconnected'}
                  {healthStatus.llm_enabled && ' • LLM Enabled'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Search Documents
            </button>
            <button
              onClick={() => setActiveTab('ask')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'ask'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Ask AI
            </button>
            <button
              onClick={() => setActiveTab('visualize')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'visualize'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🎨 Visualize
            </button>
          </div>
        </div>

        {/* Search/Ask/Visualize Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'search' 
                  ? "Search for documents..." 
                  : activeTab === 'ask'
                  ? "Ask a question about space biology..."
                  : "Ask a question to generate educational images..."
              }
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : activeTab === 'search' ? 'Search' : activeTab === 'ask' ? 'Ask' : 'Visualize'}
            </button>
          </div>
          
          {/* Visualize-specific controls */}
          {activeTab === 'visualize' && (
            <div className="mt-4 flex gap-4 items-center justify-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Style:</label>
                <select
                  value={visualizeMode}
                  onChange={(e) => setVisualizeMode(e.target.value as 'manga' | 'coloring')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="manga">Manga</option>
                  <option value="coloring">Coloring Book</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Images:</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={imageCount}
                  onChange={(e) => setImageCount(parseInt(e.target.value) || 1)}
                  className="w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}
        </form>

        {/* Results */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {activeTab === 'search' ? 'Searching documents...' : 
               activeTab === 'ask' ? 'Generating answer...' : 
               'Generating educational images...'}
            </p>
          </div>
        )}

        {/* Search Results */}
        {!loading && searchResults.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {result.title}
                    </h3>
                    <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded">
                      {result.section}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {result.snippet}...
                  </p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    View Source →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask Response */}
        {!loading && askResponse && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              AI Response
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-900 dark:text-white">
                  {askResponse.answer}
                </p>
              </div>
            </div>
            
            {askResponse.sources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Sources ({askResponse.sources.length})
                </h3>
                <div className="space-y-3">
                  {askResponse.sources.map((source, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {source.label}
                          </span>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {source.title}
                          </h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {source.section}
                          </span>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                        >
                          View →
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
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Generated Educational Images ({visualizeResponse.images.length})
            </h2>
            
            {/* Answer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-900 dark:text-white">
                  {visualizeResponse.answer}
                </p>
              </div>
            </div>
            
            {/* Generated Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {visualizeResponse.images.map((image, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <img
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated educational image ${index + 1}`}
                    className="w-full h-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {visualizeResponse.mode === 'manga' ? 'Manga Panel' : 'Coloring Page'} {index + 1}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Sources */}
            {visualizeResponse.sources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Sources ({visualizeResponse.sources.length})
                </h3>
                <div className="space-y-3">
                  {visualizeResponse.sources.map((source, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {source.label}
                          </span>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {source.title}
                          </h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {source.section}
                          </span>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && searchResults.length === 0 && !askResponse && !visualizeResponse && query && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-300">
              No results found. Try a different query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
