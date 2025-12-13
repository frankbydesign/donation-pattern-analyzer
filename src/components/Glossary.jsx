import React, { useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';

/**
 * GLOSSARY - Definitions for key nonprofit analytics terms
 * Exported for use in tooltips elsewhere in the application
 */
export const GLOSSARY = {
  retention: {
    term: 'Retention Rate',
    definition: 'The percentage of donors who gave in a previous period and gave again in the current period. A key indicator of donor loyalty and engagement effectiveness.',
    formula: '(Donors who gave in both periods / Donors from previous period) × 100',
    benchmark: 'Nonprofit average: 40-45%. Top performers: 60%+',
    importance: 'High'
  },
  lapseRisk: {
    term: 'Lapse Risk',
    definition: 'A predictive score indicating the likelihood that a donor will stop giving. Based on recency of last gift, frequency changes, and historical patterns.',
    formula: 'Composite score using RFM metrics and giving trend analysis',
    benchmark: 'Low risk: 0-30%, Medium: 30-60%, High: 60%+',
    importance: 'Critical'
  },
  concentrationRisk: {
    term: 'Concentration Risk',
    definition: 'The degree to which revenue depends on a small number of donors. High concentration means vulnerability if major donors reduce or stop giving.',
    formula: 'Top 10 donors revenue / Total revenue × 100',
    benchmark: 'Healthy: <30%, Caution: 30-50%, High Risk: >50%',
    importance: 'High'
  },
  rfm: {
    term: 'RFM Score',
    definition: 'A donor segmentation method using three metrics: Recency (how recently they gave), Frequency (how often they give), and Monetary value (how much they give).',
    formula: 'Each dimension scored 1-5, combined into a composite score',
    benchmark: 'Champions: 555, At Risk: low recency scores, Need Attention: declining frequency',
    importance: 'Medium'
  },
  ltv: {
    term: 'Lifetime Value (LTV)',
    definition: 'The total estimated value a donor will contribute over their entire relationship with the organization.',
    formula: 'Average gift × Frequency × Average donor lifespan',
    benchmark: 'Varies significantly by donor segment and organization type',
    importance: 'High'
  },
  churnRate: {
    term: 'Churn Rate',
    definition: 'The percentage of donors who stopped giving in a given period. The inverse of retention rate.',
    formula: '(Lapsed donors / Total donors at start of period) × 100',
    benchmark: 'Average: 55-60%. Top performers: <40%',
    importance: 'High'
  },
  avgGift: {
    term: 'Average Gift Size',
    definition: 'The mean dollar amount of donations, used to track giving capacity and engagement.',
    formula: 'Total donations / Number of gifts',
    benchmark: 'Varies by organization; track trends over time',
    importance: 'Medium'
  },
  recurringRate: {
    term: 'Recurring Donor Rate',
    definition: 'The percentage of donors who give through automated recurring gifts (monthly, quarterly, annually).',
    formula: '(Recurring donors / Total active donors) × 100',
    benchmark: 'Growing importance: aim for 20-30% of donor base',
    importance: 'High'
  }
};

/**
 * GlossaryTooltip - A tooltip wrapper for glossary terms
 */
export const GlossaryTooltip = ({ termKey, children }) => {
  const term = GLOSSARY[termKey];

  if (!term) {
    return children;
  }

  const tooltipContent = (
    <div className="p-2 max-w-xs">
      <p className="font-semibold text-slate-900 mb-1">{term.term}</p>
      <p className="text-sm text-slate-600 mb-2">{term.definition}</p>
      {term.formula && (
        <p className="text-xs text-slate-500 mb-1">
          <span className="font-medium">Formula:</span> {term.formula}
        </p>
      )}
      {term.benchmark && (
        <p className="text-xs text-emerald-700">
          <span className="font-medium">Benchmark:</span> {term.benchmark}
        </p>
      )}
    </div>
  );

  return (
    <Tippy
      content={tooltipContent}
      theme="light"
      interactive={true}
      placement="top"
      animation="fade"
      aria={{
        content: 'describedby',
        expanded: false
      }}
    >
      <span
        className="border-b border-dashed border-slate-400 cursor-help"
        tabIndex={0}
        role="button"
        aria-label={`Definition of ${term.term}`}
      >
        {children}
      </span>
    </Tippy>
  );
};

/**
 * Glossary - Full glossary panel component
 */
const Glossary = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTerms, setExpandedTerms] = useState(new Set());

  const filteredTerms = Object.entries(GLOSSARY).filter(([key, value]) =>
    value.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    value.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTerm = (key) => {
    setExpandedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const importanceColors = {
    Critical: 'bg-red-100 text-red-800',
    High: 'bg-amber-100 text-amber-800',
    Medium: 'bg-blue-100 text-blue-800',
    Low: 'bg-slate-100 text-slate-600'
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2
              id="glossary-title"
              className="text-xl font-semibold text-slate-900"
            >
              Analytics Glossary
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close glossary"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="search"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              aria-label="Search glossary terms"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </header>

        {/* Terms List */}
        <div className="flex-1 overflow-y-auto p-6">
          <ul className="space-y-3" role="list">
            {filteredTerms.map(([key, term]) => (
              <li key={key}>
                <button
                  onClick={() => toggleTerm(key)}
                  className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-expanded={expandedTerms.has(key)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{term.term}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${importanceColors[term.importance]}`}>
                        {term.importance}
                      </span>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${expandedTerms.has(key) ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {expandedTerms.has(key) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-slate-600 text-sm">{term.definition}</p>
                      {term.formula && (
                        <p className="text-xs text-slate-500">
                          <span className="font-semibold">Formula:</span> {term.formula}
                        </p>
                      )}
                      {term.benchmark && (
                        <p className="text-xs text-emerald-700">
                          <span className="font-semibold">Benchmark:</span> {term.benchmark}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {filteredTerms.length === 0 && (
            <p className="text-center text-slate-500 py-8">
              No terms found matching "{searchTerm}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Glossary;
