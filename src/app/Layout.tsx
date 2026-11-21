import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const LINKS = [
  ['/learn', 'Learn'],
  ['/simulator', 'Simulator'],
  ['/scenarios', 'Scenarios'],
  ['/edit', 'Edit Lab'],
  ['/tools', 'Tools'],
  ['/glossary', 'Glossary'],
] as const;

function useTheme() {
  const [theme, setTheme] = useState<string | null>(() => {
    try {
      return localStorage.getItem('mm-theme');
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    try {
      if (theme) localStorage.setItem('mm-theme', theme);
      else localStorage.removeItem('mm-theme');
    } catch {
      /* storage unavailable */
    }
  }, [theme]);
  const isDark = theme ? theme === 'dark' : !window.matchMedia('(prefers-color-scheme: light)').matches;
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') };
}

export function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d="M16 16 L16 5.5 A10.5 10.5 0 0 1 25 10.7 Z" fill="var(--accent)" opacity="0.85" transform={`rotate(${a} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="4.2" fill="var(--bg)" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { isDark, toggle } = useTheme();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <Logo />
            <span>Manual Mode</span>
          </Link>
          <nav className="nav" aria-label="Main">
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {label}
              </NavLink>
            ))}
          </nav>
          <button className="theme-btn" onClick={toggle} aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
            {isDark ? '☀' : '☾'}
          </button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        Manual Mode: learn your camera by playing with it. Simulated images are illustrations; real results vary by camera and lens.
      </footer>
    </>
  );
}
