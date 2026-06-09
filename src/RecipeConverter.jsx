import { useState, useRef, useEffect } from 'react';

const MODES = [
  { id: 'jain', label: 'Jain' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'both', label: 'Jain + Vegan' },
];

const MODE_LABEL = { jain: 'Jain', vegan: 'Vegan', both: 'Jain + Vegan' };

const CUISINE_NORMALIZE = {
  // Indian
  'indian': 'Indian', 'north indian': 'Indian', 'south indian': 'Indian',
  'punjabi': 'Indian', 'gujarati': 'Indian', 'rajasthani': 'Indian',
  'bengali': 'Indian', 'maharashtrian': 'Indian', 'kerala': 'Indian',
  'tamil': 'Indian', 'hyderabadi': 'Indian', 'mughlai': 'Indian',
  'andhra': 'Indian', 'biryani': 'Indian', 'karnataka': 'Indian',
  // Italian
  'italian': 'Italian', 'sicilian': 'Italian', 'roman': 'Italian',
  // Mexican
  'mexican': 'Mexican', 'tex-mex': 'Mexican', 'latin american': 'Mexican',
  // Chinese
  'chinese': 'Chinese', 'cantonese': 'Chinese', 'sichuan': 'Chinese',
  'szechuan': 'Chinese', 'hunan': 'Chinese', 'dim sum': 'Chinese',
  // Japanese
  'japanese': 'Japanese', 'sushi': 'Japanese', 'ramen': 'Japanese',
  // Thai
  'thai': 'Thai',
  // Mediterranean
  'mediterranean': 'Mediterranean', 'greek': 'Mediterranean',
  'turkish': 'Mediterranean', 'lebanese': 'Mediterranean',
  'moroccan': 'Mediterranean',
  // American
  'american': 'American', 'southern': 'American', 'bbq': 'American',
  'soul food': 'American',
  // Middle Eastern
  'middle eastern': 'Middle Eastern', 'arabic': 'Middle Eastern',
  'persian': 'Middle Eastern', 'iranian': 'Middle Eastern',
  'israeli': 'Middle Eastern',
  // Korean
  'korean': 'Korean',
  // Vietnamese
  'vietnamese': 'Vietnamese',
};

function normalizeCuisine(raw) {
  const lower = raw.toLowerCase().trim();
  return CUISINE_NORMALIZE[lower] ?? raw;
}

function extractMeta(text) {
  const nameMatch = text.match(/^\*\*(.+?)\*\*/m);
  const cuisineMatch = text.match(/\*\*Cuisine:\*\*\s*(.+)/);
  return {
    name: nameMatch ? nameMatch[1] : 'Saved Recipe',
    cuisine: cuisineMatch ? normalizeCuisine(cuisineMatch[1].trim()) : 'Other',
  };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderOutput(text) {
  return text.split('\n').map((line, i) => {
    if (/^\*\*(.+)\*\*$/.test(line)) {
      return <div key={i} className="out-heading">{line.slice(2, -2)}</div>;
    }
    if (line.includes('**')) {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <div key={i} className="out-line">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </div>
      );
    }
    if (line === '') return <div key={i} className="out-spacer" />;
    return <div key={i} className="out-line">{line}</div>;
  });
}

async function streamConvert(messages, mode, onChunk) {
  const res = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, mode }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `server error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') break;
      try {
        const { text, error: streamErr } = JSON.parse(data);
        if (streamErr) throw new Error(streamErr);
        if (text) { full += text; onChunk(text); }
      } catch { /* ignore malformed */ }
    }
  }
  return full;
}

export default function RecipeConverter() {
  const [tab, setTab] = useState('convert');
  const [mode, setMode] = useState('jain');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]); // [{role, content}]
  const [refineInput, setRefineInput] = useState('');
  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [servings, setServings] = useState('');
  const refineRef = useRef(null);

  useEffect(() => {
    fetch('/api/recipes').then(r => r.json()).then(setSaved).catch(() => {});
  }, []);

  const convert = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOutput('');
    setError('');
    setJustSaved(false);
    setRefineInput('');

    const userMsg = { role: 'user', content: input.trim() };
    const messages = [userMsg];

    try {
      let full = '';
      const full_result = await streamConvert(
        messages,
        mode,
        chunk => setOutput(prev => prev + chunk)
      );
      full = full_result;
      setHistory([userMsg, { role: 'assistant', content: full }]);
    } catch (err) {
      setError(err.message || 'something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const refine = async (overrideMsg) => {
    const text = overrideMsg ?? refineInput;
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    setJustSaved(false);

    const userMsg = { role: 'user', content: text.trim() };
    const messages = [...history, userMsg];

    try {
      setOutput('');
      const full = await streamConvert(
        messages,
        mode,
        chunk => setOutput(prev => prev + chunk)
      );
      setHistory([...messages, { role: 'assistant', content: full }]);
      if (!overrideMsg) setRefineInput('');
    } catch (err) {
      setError(err.message || 'something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const scaleServings = () => {
    if (!servings || loading) return;
    refine(`Scale this recipe to serve ${servings} people`);
    setServings('');
  };

  const saveRecipe = async () => {
    const { name, cuisine } = extractMeta(output);
    const recipe = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cuisine, mode, content: output }),
    }).then(r => r.json());
    setSaved(prev => [recipe, ...prev]);
    setJustSaved(true);
  };

  const deleteRecipe = async (id) => {
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    setSaved(prev => prev.filter(r => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const cuisines = ['all', ...new Set(saved.map(r => r.cuisine))];
  const filtered = saved.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCuisine = cuisineFilter === 'all' || r.cuisine === cuisineFilter;
    return matchSearch && matchCuisine;
  });

  const handleInputKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); convert(); }
  };

  const handleRefineKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); refine(); }
  };

  const hasOutput = output.length > 0;
  const canRefine = history.length >= 2 && !loading;

  return (
    <div className="rc-root">
      <header className="rc-header">
        <span className="rc-logo">recipe<span className="rc-dot">.</span>convert</span>
      </header>

      <nav className="rc-tabs">
        <button className={`rc-tab${tab === 'convert' ? ' active' : ''}`} onClick={() => setTab('convert')}>
          Convert
        </button>
        <button className={`rc-tab${tab === 'saved' ? ' active' : ''}`} onClick={() => setTab('saved')}>
          Saved Recipes
          {saved.length > 0 && <span className="rc-badge">{saved.length}</span>}
        </button>
      </nav>

      <main className="rc-main">
        {tab === 'convert' && (
          <>
            <p className="rc-subtitle">
              Type a dish name or paste a full recipe — we'll make it Jain, Vegan, or both.
            </p>

            <div className="rc-section">
              <label className="rc-label">Choose your diet</label>
              <div className="rc-modes">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    className={`rc-mode-btn${mode === m.id ? ' active' : ''}`}
                    onClick={() => !loading && setMode(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rc-section">
              <label className="rc-label">Your recipe or dish</label>
              <div className="rc-input-wrap">
                <textarea
                  className="rc-textarea"
                  placeholder="e.g. pasta, pad thai, lasagna..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleInputKey}
                  disabled={loading}
                  spellCheck={false}
                  autoComplete="off"
                  rows={3}
                />
                <div className="rc-input-bar">
                  <span className="rc-hint">shift + enter for new line</span>
                  <button
                    className={`rc-convert-btn${loading ? ' busy' : ''}`}
                    onClick={convert}
                    disabled={loading || !input.trim()}
                  >
                    {loading && !canRefine
                      ? <span className="rc-dots"><span /><span /><span /></span>
                      : 'Convert →'}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="rc-error">⚠ {error}</div>}

            {hasOutput && (
              <div className="rc-section">
                <div className="rc-output-header">
                  <label className="rc-label">Result</label>
                  <div className="rc-output-actions">
                    <button className="rc-print-btn" onClick={() => window.print()}>
                      Print
                    </button>
                    <button
                      className={`rc-save-btn${justSaved ? ' saved' : ''}`}
                      onClick={saveRecipe}
                      disabled={justSaved || loading}
                    >
                      {justSaved ? '✓ Saved' : '+ Save Recipe'}
                    </button>
                  </div>
                </div>
                <div id="print-area" className="rc-output">{renderOutput(output)}</div>
              </div>
            )}

            {hasOutput && (
              <div className="rc-section">
                <label className="rc-label">Scale Servings</label>
                <div className="rc-scale-row">
                  <span className="rc-scale-label">Scale to</span>
                  <input
                    className="rc-scale-input"
                    type="number"
                    min={1}
                    max={100}
                    placeholder="4"
                    value={servings}
                    onChange={e => setServings(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && scaleServings()}
                    disabled={loading}
                  />
                  <span className="rc-scale-label">servings</span>
                  <button
                    className="rc-scale-btn"
                    onClick={scaleServings}
                    disabled={loading || !servings}
                  >
                    {loading ? <span className="rc-dots"><span /><span /><span /></span> : 'Scale →'}
                  </button>
                </div>
              </div>
            )}

            {(hasOutput || canRefine) && (
              <div className="rc-section">
                <label className="rc-label">Not quite right? Refine it</label>
                <div className="rc-input-wrap">
                  <textarea
                    ref={refineRef}
                    className="rc-textarea rc-textarea--short"
                    placeholder="e.g. make it less spicy, add more protein, simpler instructions..."
                    value={refineInput}
                    onChange={e => setRefineInput(e.target.value)}
                    onKeyDown={handleRefineKey}
                    disabled={loading}
                    spellCheck={false}
                    rows={2}
                  />
                  <div className="rc-input-bar">
                    <span className="rc-hint">shift + enter for new line</span>
                    <button
                      className={`rc-convert-btn${loading ? ' busy' : ''}`}
                      onClick={refine}
                      disabled={loading || !refineInput.trim()}
                    >
                      {loading && canRefine
                        ? <span className="rc-dots"><span /><span /><span /></span>
                        : 'Refine →'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'saved' && (
          <>
            <div className="rc-saved-controls">
              <input
                className="rc-search"
                type="text"
                placeholder="Search saved recipes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="rc-cuisine-select"
                value={cuisineFilter}
                onChange={e => setCuisineFilter(e.target.value)}
              >
                {cuisines.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All cuisines' : c}</option>
                ))}
              </select>
            </div>

            {filtered.length === 0 && (
              <div className="rc-empty">
                {saved.length === 0
                  ? 'No saved recipes yet. Convert something and tap "Save Recipe"!'
                  : 'No recipes match your filters.'}
              </div>
            )}

            <div className="rc-cards">
              {filtered.map(r => (
                <div key={r.id} className="rc-card">
                  <div className="rc-card-top">
                    <div className="rc-card-name">{r.name}</div>
                    <button className="rc-delete-btn" onClick={() => deleteRecipe(r.id)} title="Delete">✕</button>
                  </div>
                  <div className="rc-card-meta">
                    <span className={`rc-mode-tag mode-${r.mode}`}>{MODE_LABEL[r.mode]}</span>
                    <span className="rc-cuisine-tag">{r.cuisine}</span>
                    <span className="rc-card-date">{formatDate(r.saved_at)}</span>
                  </div>
                  <button
                    className="rc-expand-btn"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    {expandedId === r.id ? 'Hide recipe ▲' : 'View recipe ▼'}
                  </button>
                  {expandedId === r.id && (
                    <div className="rc-card-content">{renderOutput(r.content)}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="rc-footer">
        jain · vegan · both — your call
      </footer>
    </div>
  );
}
