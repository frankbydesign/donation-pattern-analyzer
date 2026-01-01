import React, { useState } from 'react';
import './styles/index.css';
import './styles/accessibility.css';

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

// Hooks
import useDataLoader from './hooks/useDataLoader';

/**
 * Donation Pattern Analyzer - Main Application
 * Helps nonprofits understand donor behavior and make data-driven decisions
 */
function App() {
  // Load donor data
  const { isLoading, error, data } = useDataLoader();

  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isA11yPanelOpen, setIsA11yPanelOpen] = useState(false);
  const [scenarioResults, setScenarioResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleRunScenario = (params) => {
    console.log('Running scenario with:', params);
    // Calculate projected impact based on scenario parameters
    const baseRevenue = 500000;
    const retentionImpact = ((params.retention - 45) / 100) * baseRevenue * 0.6;
    const recurringImpact = (params.recurringGrowth / 100) * baseRevenue * 0.3;
    setScenarioResults({
      ...params,
      projectedRevenue: baseRevenue + retentionImpact + recurringImpact,
      retentionImpact,
      recurringImpact
    });
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

            <div className="header-actions flex items-center gap-3">
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
                className="glossary-button inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold">?</span>
                Glossary
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b border-slate-200 px-6" aria-label="Dashboard navigation">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-1">
              {[
                { id: 'overview', label: 'Executive Summary' },
                { id: 'health', label: 'Donor Health' },
                { id: 'patterns', label: 'Giving Patterns' },
                { id: 'scenarios', label: 'What-If Analysis' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-600 font-medium">Loading donor data...</p>
                <p className="text-sm text-slate-500 mt-2">Fetching analytics and insights</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Failed to Load Data</h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Only show when data is loaded */}
          {!isLoading && !error && data && (
            <>
          {/* Welcome Message */}
          <section className="mb-8">
            <InsightSummary
              title="Welcome to Donor Analytics"
              summary="This dashboard helps you understand your donor base through data-driven insights. Analyze retention rates, identify at-risk donors, run what-if scenarios, and make informed decisions to strengthen your fundraising strategy."
              variant="info"
              icon="📊"
            >
              <p className="text-sm text-slate-600 mt-2">
                Hover over <GlossaryTooltip termKey="retention">underlined terms</GlossaryTooltip> for quick definitions,
                or open the Glossary for the complete reference guide.
              </p>
            </InsightSummary>
          </section>

          {/* Key Metrics Grid */}
          <section className="metrics-grid mb-8">
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

          {/* Scenario Panel */}
          <section className="scenario-section mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              What-If Analysis
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScenarioPanel
                onRun={handleRunScenario}
                initialRetention={52}
                initialRecurringGrowth={15}
              />

              {scenarioResults ? (
                <div className="chart-container bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Projected Impact</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Base Revenue</span>
                      <span className="font-semibold text-slate-900">$500,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-slate-600">
                        <GlossaryTooltip termKey="retention">Retention</GlossaryTooltip> Impact
                      </span>
                      <span className={`font-semibold ${scenarioResults.retentionImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scenarioResults.retentionImpact >= 0 ? '+' : ''}${Math.round(scenarioResults.retentionImpact).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-slate-600">
                        <GlossaryTooltip termKey="recurringRate">Recurring</GlossaryTooltip> Impact
                      </span>
                      <span className={`font-semibold ${scenarioResults.recurringImpact >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {scenarioResults.recurringImpact >= 0 ? '+' : ''}${Math.round(scenarioResults.recurringImpact).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-indigo-100 rounded-lg border-2 border-indigo-200">
                      <span className="font-medium text-indigo-900">Projected Revenue</span>
                      <span className="text-xl font-bold text-indigo-600">
                        ${Math.round(scenarioResults.projectedRevenue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    Run at {new Date(scenarioResults.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="chart-container bg-white rounded-lg border border-slate-200 border-dashed p-6 flex items-center justify-center">
                  <p className="text-slate-400 text-center">
                    Adjust the sliders and click "Run Scenario" to see projected impact
                  </p>
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
            </>
          )}
        </main>

        {/* Modals */}
        <Glossary isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />
        <AccessibilityPanel isOpen={isA11yPanelOpen} onClose={() => setIsA11yPanelOpen(false)} />
      </div>
    </AccessibilityProvider>
  );
}

export default App;
