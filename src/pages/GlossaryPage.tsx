import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GLOSSARY } from '../content/glossary';

export default function GlossaryPage() {
  const [q, setQ] = useState('');
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' });
  }, [hash]);
  const items = [...GLOSSARY]
    .sort((a, b) => a.term.localeCompare(b.term))
    .filter((g) => !q || (g.term + ' ' + g.def).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page page-narrow">
      <div className="eyebrow">Reference</div>
      <h1>Glossary</h1>
      <input type="text" placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search glossary" style={{ width: '100%', padding: '10px 14px', marginBottom: 20 }} />
      <dl style={{ display: 'grid', gap: 4, margin: 0 }}>
        {items.map((g) => (
          <div key={g.id} id={g.id} className="card" style={{ padding: '12px 16px', outline: hash === `#${g.id}` ? '2px solid var(--accent)' : undefined }}>
            <dt style={{ fontWeight: 700 }}>{g.term}</dt>
            <dd style={{ margin: '2px 0 0', color: 'var(--muted)' }}>{g.def}</dd>
          </div>
        ))}
        {items.length === 0 && <p className="muted">No matches.</p>}
      </dl>
    </div>
  );
}
