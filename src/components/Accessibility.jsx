import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

/**
 * Accessibility Context for managing global a11y settings
 */
const AccessibilityContext = createContext({
  highContrast: false,
  reducedMotion: false,
  fontSize: 'normal',
  toggleHighContrast: () => {},
  toggleReducedMotion: () => {},
  setFontSize: () => {}
});

export const useAccessibility = () => useContext(AccessibilityContext);

/**
 * AccessibilityProvider - Provides accessibility settings throughout the app
 */
export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  // Load saved preferences
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('a11y-high-contrast') === 'true';
    const savedReducedMotion = localStorage.getItem('a11y-reduced-motion') === 'true';
    const savedFontSize = localStorage.getItem('a11y-font-size') || 'normal';

    setHighContrast(savedHighContrast);
    setReducedMotion(savedReducedMotion);
    setFontSize(savedFontSize);

    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

    if (prefersReducedMotion && !localStorage.getItem('a11y-reduced-motion')) {
      setReducedMotion(true);
    }
    if (prefersHighContrast && !localStorage.getItem('a11y-high-contrast')) {
      setHighContrast(true);
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const html = document.documentElement;

    if (highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }

    if (reducedMotion) {
      html.classList.add('reduced-motion');
    } else {
      html.classList.remove('reduced-motion');
    }

    html.dataset.fontSize = fontSize;
  }, [highContrast, reducedMotion, fontSize]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => {
      const newValue = !prev;
      localStorage.setItem('a11y-high-contrast', String(newValue));
      return newValue;
    });
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion(prev => {
      const newValue = !prev;
      localStorage.setItem('a11y-reduced-motion', String(newValue));
      return newValue;
    });
  }, []);

  const handleSetFontSize = useCallback((size) => {
    setFontSize(size);
    localStorage.setItem('a11y-font-size', size);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        reducedMotion,
        fontSize,
        toggleHighContrast,
        toggleReducedMotion,
        setFontSize: handleSetFontSize
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * SkipLink - Allows keyboard users to skip to main content
 */
export const SkipLink = ({ targetId = 'main-content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
};

/**
 * HighContrastToggle - Toggle button for high contrast mode
 */
export const HighContrastToggle = ({ className = '' }) => {
  const { highContrast, toggleHighContrast } = useAccessibility();

  return (
    <button
      onClick={toggleHighContrast}
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg
        text-sm font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${highContrast
          ? 'bg-slate-900 text-white hover:bg-slate-800'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }
        ${className}
      `}
      aria-pressed={highContrast}
      aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <span className="hidden sm:inline">
        {highContrast ? 'Normal' : 'High Contrast'}
      </span>
    </button>
  );
};

/**
 * AccessibilityPanel - Full accessibility settings panel
 */
const AccessibilityPanel = ({ isOpen, onClose }) => {
  const {
    highContrast,
    reducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize
  } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-panel-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h2
              id="a11y-panel-title"
              className="text-xl font-semibold text-slate-900"
            >
              Accessibility Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close accessibility settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Settings */}
        <div className="p-6 space-y-6">
          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="high-contrast-toggle"
                className="font-medium text-slate-900"
              >
                High Contrast Mode
              </label>
              <p className="text-sm text-slate-500">
                Increase contrast for better visibility
              </p>
            </div>
            <button
              id="high-contrast-toggle"
              role="switch"
              aria-checked={highContrast}
              onClick={toggleHighContrast}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                ${highContrast ? 'bg-indigo-600' : 'bg-slate-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${highContrast ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="reduced-motion-toggle"
                className="font-medium text-slate-900"
              >
                Reduce Motion
              </label>
              <p className="text-sm text-slate-500">
                Minimize animations and transitions
              </p>
            </div>
            <button
              id="reduced-motion-toggle"
              role="switch"
              aria-checked={reducedMotion}
              onClick={toggleReducedMotion}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                ${reducedMotion ? 'bg-indigo-600' : 'bg-slate-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${reducedMotion ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Font Size */}
          <div>
            <label className="font-medium text-slate-900 block mb-2">
              Text Size
            </label>
            <div className="flex gap-2" role="radiogroup" aria-label="Text size options">
              {['small', 'normal', 'large', 'x-large'].map((size) => (
                <button
                  key={size}
                  role="radio"
                  aria-checked={fontSize === size}
                  onClick={() => setFontSize(size)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                    ${fontSize === size
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }
                  `}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="font-medium text-slate-900 mb-3">Keyboard Shortcuts</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Navigate tabs</dt>
                <dd className="font-mono text-slate-900">Tab / Shift+Tab</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Activate buttons</dt>
                <dd className="font-mono text-slate-900">Enter / Space</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Close dialogs</dt>
                <dd className="font-mono text-slate-900">Escape</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Skip to content</dt>
                <dd className="font-mono text-slate-900">Tab (first focus)</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * FocusVisible - Custom hook for focus-visible polyfill behavior
 */
export const useFocusVisible = () => {
  const [hadKeyboardEvent, setHadKeyboardEvent] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.altKey || e.ctrlKey) return;
      setHadKeyboardEvent(true);
    };

    const onPointerDown = () => {
      setHadKeyboardEvent(false);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onPointerDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('touchstart', onPointerDown, true);
    };
  }, []);

  return hadKeyboardEvent;
};

/**
 * VisuallyHidden - Screen reader only content
 */
export const VisuallyHidden = ({ children, as: Component = 'span' }) => {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
};

/**
 * LiveRegion - Announces dynamic content changes to screen readers
 */
export const LiveRegion = ({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text'
}) => {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
};

export default AccessibilityPanel;
