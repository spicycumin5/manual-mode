import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY } from '../content/glossary';

export function Callout({ kind = 'note', title, children }: { kind?: 'note' | 'tip' | 'warn'; title?: string; children: ReactNode }) {
  return (
    <div className={`callout ${kind === 'note' ? '' : kind}`}>
      {title && <span className="callout-title">{title}</span>}
      {children}
    </div>
  );
}

export function Try({ children }: { children: ReactNode }) {
  return (
    <Callout kind="tip" title="Try it">
      {children}
    </Callout>
  );
}

export function Mistakes({ children }: { children: ReactNode }) {
  return (
    <Callout kind="warn" title="Common mistakes">
      {children}
    </Callout>
  );
}

/** Inline glossary term with a hover/focus definition. */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY.find((g) => g.id === id);
  if (!entry) return <>{children}</>;
  return (
    <span
      className="term"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children ?? entry.term}
      {open && (
        <span className="term-tip" role="tooltip">
          <strong>{entry.term}.</strong> {entry.def}{' '}
          <Link to={`/glossary#${entry.id}`}>Glossary →</Link>
        </span>
      )}
    </span>
  );
}
