import React, { useEffect, useCallback, useState } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

/**
 * Tour configuration with step definitions
 */
export const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Donor Analytics',
    text: 'This dashboard helps you understand your donor base, identify trends, and make data-driven decisions. Let\'s take a quick tour!',
    attachTo: { element: 'header', on: 'bottom' },
    classes: 'shepherd-theme-custom',
    buttons: [
      {
        text: 'Skip Tour',
        action: 'cancel',
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Start Tour',
        action: 'next',
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'navigation',
    title: 'Dashboard Navigation',
    text: 'Use these tabs to navigate between different insight categories: Executive Summary, Donor Health, Giving Patterns, and more.',
    attachTo: { element: 'nav', on: 'bottom' },
    buttons: [
      {
        text: 'Back',
        action: 'back',
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'metrics',
    title: 'Key Metrics',
    text: 'These metric cards show your most important KPIs at a glance. Color-coded borders indicate performance: green for healthy, amber for caution, red for attention needed.',
    attachTo: { element: '.metrics-grid', on: 'bottom' },
    buttons: [
      {
        text: 'Back',
        action: 'back',
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'charts',
    title: 'Interactive Charts',
    text: 'Charts are interactive! Hover to see detailed data, click legend items to show/hide data series, and look for guidance text explaining what to look for.',
    attachTo: { element: '.chart-container', on: 'top' },
    buttons: [
      {
        text: 'Back',
        action: 'back',
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'glossary',
    title: 'Understanding Terms',
    text: 'Look for dotted underlines under terms - hover over them to see definitions. You can also open the full glossary for comprehensive explanations.',
    attachTo: { element: 'header', on: 'bottom' },
    buttons: [
      {
        text: 'Back',
        action: 'back',
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Next',
        action: 'next',
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'export',
    title: 'Export Your Insights',
    text: 'Ready to share? Export your dashboard as a PDF report or PowerPoint presentation. Individual charts can be exported as images.',
    attachTo: { element: '.header-actions', on: 'bottom' },
    buttons: [
      {
        text: 'Back',
        action: 'back',
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Finish',
        action: 'complete',
        classes: 'shepherd-button-primary'
      }
    ]
  }
];

/**
 * Custom Tour styles
 */
const tourStyles = `
  .shepherd-theme-custom {
    --shepherd-bg: #ffffff;
    --shepherd-text: #0F172A;
    --shepherd-border: #E2E8F0;
    --shepherd-header-bg: #F8FAFC;
  }

  .shepherd-element {
    background: var(--shepherd-bg);
    border-radius: 8px;
    border: 1px solid var(--shepherd-border);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 400px;
    z-index: 10000;
  }

  .shepherd-has-title .shepherd-content .shepherd-header {
    background: var(--shepherd-header-bg);
    padding: 1rem 1.25rem;
    border-radius: 8px 8px 0 0;
    border-bottom: 1px solid var(--shepherd-border);
  }

  .shepherd-title {
    color: var(--shepherd-text);
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .shepherd-text {
    color: #475569;
    font-size: 0.9375rem;
    line-height: 1.6;
    padding: 1rem 1.25rem;
  }

  .shepherd-footer {
    padding: 0.75rem 1.25rem 1.25rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .shepherd-button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
  }

  .shepherd-button-primary {
    background: #4F46E5;
    color: white;
  }

  .shepherd-button-primary:hover {
    background: #4338CA;
  }

  .shepherd-button-secondary {
    background: transparent;
    color: #64748B;
    border: 1px solid #E2E8F0;
  }

  .shepherd-button-secondary:hover {
    background: #F8FAFC;
    color: #475569;
  }

  .shepherd-modal-overlay-container {
    background: rgba(15, 23, 42, 0.4);
  }

  .shepherd-arrow::before {
    background: var(--shepherd-bg);
    border: 1px solid var(--shepherd-border);
  }

  /* Progress dots */
  .shepherd-progress {
    display: flex;
    gap: 0.375rem;
    justify-content: center;
    padding-bottom: 0.5rem;
  }

  .shepherd-progress-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #E2E8F0;
    transition: background 0.2s ease;
  }

  .shepherd-progress-dot.active {
    background: #4F46E5;
  }

  /* Accessibility improvements */
  .shepherd-button:focus {
    outline: 2px solid #4F46E5;
    outline-offset: 2px;
  }

  .shepherd-element:focus {
    outline: none;
  }

  @media (max-width: 640px) {
    .shepherd-element {
      max-width: calc(100vw - 2rem);
      margin: 1rem;
    }
  }
`;

/**
 * Creates and configures a Shepherd tour instance
 * @param {Object} options - Tour configuration options
 * @returns {Shepherd.Tour}
 */
export const createTour = (options = {}) => {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: {
        enabled: true
      },
      scrollTo: {
        behavior: 'smooth',
        block: 'center'
      },
      modalOverlayOpeningPadding: 8,
      modalOverlayOpeningRadius: 8
    },
    ...options
  });

  // Add steps with button action handlers
  TOUR_STEPS.forEach((step, index) => {
    const stepConfig = { ...step };

    // Replace action strings with actual functions
    if (stepConfig.buttons) {
      stepConfig.buttons = stepConfig.buttons.map(button => ({
        ...button,
        action: () => {
          if (button.action === 'next') tour.next();
          else if (button.action === 'back') tour.back();
          else if (button.action === 'cancel') tour.cancel();
          else if (button.action === 'complete') tour.complete();
        }
      }));
    }

    // Add progress indicator
    stepConfig.when = {
      show: function () {
        const currentIndex = tour.steps.indexOf(tour.currentStep);
        const footer = this.el.querySelector('.shepherd-footer');

        if (footer && !footer.querySelector('.shepherd-progress')) {
          const progress = document.createElement('div');
          progress.className = 'shepherd-progress';
          progress.setAttribute('role', 'progressbar');
          progress.setAttribute('aria-valuenow', currentIndex + 1);
          progress.setAttribute('aria-valuemin', 1);
          progress.setAttribute('aria-valuemax', tour.steps.length);

          tour.steps.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = `shepherd-progress-dot ${i <= currentIndex ? 'active' : ''}`;
            progress.appendChild(dot);
          });

          footer.insertBefore(progress, footer.firstChild);
        }
      }
    };

    tour.addStep(stepConfig);
  });

  return tour;
};

/**
 * Tour Component - Provides onboarding tour functionality
 */
const Tour = ({
  autoStart = false,
  onComplete,
  onCancel,
  storageKey = 'donation-analyzer-tour-completed'
}) => {
  const [tour, setTour] = useState(null);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  // Check if user has completed tour before
  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    setHasSeenTour(completed === 'true');
  }, [storageKey]);

  // Initialize tour
  useEffect(() => {
    // Add custom styles
    const styleElement = document.createElement('style');
    styleElement.textContent = tourStyles;
    document.head.appendChild(styleElement);

    const tourInstance = createTour();

    tourInstance.on('complete', () => {
      localStorage.setItem(storageKey, 'true');
      setHasSeenTour(true);
      onComplete?.();
    });

    tourInstance.on('cancel', () => {
      onCancel?.();
    });

    setTour(tourInstance);

    return () => {
      styleElement.remove();
      tourInstance.complete();
    };
  }, [storageKey, onComplete, onCancel]);

  // Auto-start tour for new users
  useEffect(() => {
    if (tour && autoStart && !hasSeenTour) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        tour.start();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [tour, autoStart, hasSeenTour]);

  const startTour = useCallback(() => {
    tour?.start();
  }, [tour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasSeenTour(false);
  }, [storageKey]);

  return (
    <>
      {/* Tour trigger button */}
      <button
        onClick={startTour}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Start guided tour"
        title="Take a guided tour"
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="hidden sm:inline">Take Tour</span>
      </button>
    </>
  );
};

// Export utility for manually starting tour from anywhere
export const useTour = () => {
  const [tour, setTour] = useState(null);

  useEffect(() => {
    const tourInstance = createTour();
    setTour(tourInstance);

    return () => {
      tourInstance.complete();
    };
  }, []);

  return {
    start: () => tour?.start(),
    next: () => tour?.next(),
    back: () => tour?.back(),
    cancel: () => tour?.cancel(),
    complete: () => tour?.complete(),
    isActive: tour?.isActive() ?? false
  };
};

export default Tour;
