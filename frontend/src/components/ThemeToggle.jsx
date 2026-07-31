import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getStoredTheme, toggleTheme } from '../utils/theme';

/** Playerok-style light/dark switch */
export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'gm_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      className={`relative inline-flex items-center shrink-0 h-8 w-[52px] rounded-full border transition-colors
                  ${isLight
                    ? 'bg-gray-200 border-gray-300'
                    : 'bg-dark-800 border-dark-600'}
                  ${className}`}
      aria-label={isLight ? 'Включить тёмный режим' : 'Включить светлый режим'}
      title={isLight ? 'Тёмный режим' : 'Светлый режим'}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center
                    shadow transition-transform duration-200
                    ${isLight ? 'translate-x-[22px] bg-white text-amber-500' : 'translate-x-0 bg-dark-700 text-[#5B8CFF]'}`}
      >
        {isLight ? <Sun size={14} /> : <Moon size={14} />}
      </span>
    </button>
  );
}
