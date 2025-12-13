import React, { useState } from 'react';
import './styles/index.css';

// Components
import InsightSummary, { InsightSummaryGroup } from './components/InsightSummary';
import Glossary, { GlossaryTooltip, GLOSSARY } from './components/Glossary';
import ScenarioPanel from './components/ScenarioPanel';
import Tour from './components/Tour';
import AccessibilityPanel, {
  AccessibilityProvider,
  SkipLink,
  HighContrastToggle
} from './components/Accessibility';

/**
 * Example App demonstrating the new components
 */
function App() {
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isA11yPanelOpen, setIsA11yPanelOpen] = useState(false);
  const [scenarioResults, setScenarioResults] = useState(null);

  const handleRunScenario = (params) => {
    console.log('Running scenario with:', params);
    setScenarioResults(params);
  };

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-slate-50">
        <SkipLink targetId="main-content" />

        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Donor Analytics Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Sample Nonprofit Organization
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Tour autoStart={false} />
              <HighContrastToggle />
              <button
                onClick={() => setIsA11yPanelOpen(true)}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                aria-label="Accessibility settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
              <button
                onClick={() => setIsGlossaryOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold">?</span>
                Glossary
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
          {/* Insight Summaries */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Key Insights
            </h2>
            <InsightSummaryGroup columns={2}>
              <InsightSummary
                title="Retention Performance"
                summary="Your donor retention rate of 52% exceeds the sector benchmark of 45%. This indicates strong donor engagement and suggests your stewardship efforts are effective."
                variant="success"
                icon="+"
              />
              <InsightSummary
                title="Concentration Risk Alert"
                summary="Your top 10 donors account for 48% of total revenue. While within acceptable range, consider diversification strategies to reduce dependency."
                variant="warning"
                icon="!"
              >
                <p className="text-sm text-slate-600">
                  Learn more about{' '}
                  <GlossaryTooltip termKey="concentrationRisk">
                    concentration risk
                  </GlossaryTooltip>
                </p>
              </InsightSummary>
            </InsightSummaryGroup>
          </section>

          {/* Scenario Panel Demo */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              What-If Analysis
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScenarioPanel
                onRun={handleRunScenario}
                initialRetention={52}
                initialRecurringGrowth={15}
              />

              {scenarioResults && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Scenario Results</h3>
                  <pre className="text-sm bg-slate-50 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(scenarioResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </section>

          {/* Glossary Terms Demo */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Understanding Metrics
            </h2>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <p className="text-slate-600 leading-relaxed">
                Key metrics to track include{' '}
                <GlossaryTooltip termKey="retention">retention rate</GlossaryTooltip>,{' '}
                <GlossaryTooltip termKey="lapseRisk">lapse risk</GlossaryTooltip>,{' '}
                and{' '}
                <GlossaryTooltip termKey="rfm">RFM scoring</GlossaryTooltip>.
                Understanding these metrics helps you make data-driven decisions
                about your fundraising strategy.
              </p>
            </div>
          </section>
        </main>

        {/* Modals */}
        <Glossary isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />
        <AccessibilityPanel isOpen={isA11yPanelOpen} onClose={() => setIsA11yPanelOpen(false)} />
      </div>
    </AccessibilityProvider>
  );
}

export default App;
