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
import {
  ExecutiveSummary,
  DonorHealth,
  GivingPatterns,
  TemporalTrends,
  ConcentrationRisk
} from './components/sections';
import { DateRangeFilter, FilterStatus } from './components/filters';
import { DonorListPanel } from './components/panels';

// Hooks
import useDataLoader from './hooks/useDataLoader';

// Utilities
import { calculateBaselineMetrics, calculateScenarioImpact } from './utils/scenarioUtils';

/**
 * Donation Pattern Analyzer - Main Application
 * Helps nonprofits understand donor behavior and make data-driven decisions
 */
function App() {
  console.log('[APP] Component render started');

  // Load donor data
  const { isLoading, error, data } = useDataLoader();

  console.log('[APP] After useDataLoader:', { isLoading, error, hasData: !!data });

  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isA11yPanelOpen, setIsA11yPanelOpen] = useState(false);
  const [scenarioResults, setScenarioResults] = useState(null);
  const [activeTab, setActiveTab] = useState('executive');
  const [baselinePeriod, setBaselinePeriod] = useState('last_year');

  // Calculate latest gift date from data
  console.log('[APP] Before latestDataDate useMemo');
  const latestDataDate = React.useMemo(() => {
    console.log('[APP] Inside latestDataDate useMemo, data:', {
      hasData: !!data,
      hasLayer1: !!data?.layer1,
      hasDonors: !!data?.layer1?.donors
    });
    if (!data?.layer1?.donors) return null;

    let latestDate = null;
    data.layer1.donors.forEach(donor => {
      if (!donor.gifts) return;
      donor.gifts.forEach(gift => {
        const giftDate = new Date(gift.date);
        if (!latestDate || giftDate > latestDate) {
          latestDate = giftDate;
        }
      });
    });

    return latestDate;
  }, [data]);

  // Calculate baseline metrics from actual data
  console.log('[APP] Before baselineMetrics useMemo');
  const baselineMetrics = React.useMemo(() => {
    console.log('[APP] Inside baselineMetrics useMemo, data:', {
      hasData: !!data,
      hasLayer1: !!data?.layer1,
      hasLayer2: !!data?.layer2,
      baselinePeriod
    });
    if (!data?.layer1 || !data?.layer2) return null;

    console.log('[APP] About to call calculateBaselineMetrics');
    const result = calculateBaselineMetrics(data.layer1, data.layer2, baselinePeriod);
    console.log('[APP] calculateBaselineMetrics result:', result);
    return result;
  }, [data, baselinePeriod]);

  const handleRunScenario = (params) => {
    if (!baselineMetrics) return;

    // Calculate projected impact using real baseline data
    const results = calculateScenarioImpact(
      baselineMetrics,
      params.retention,
      params.recurringPct
    );

    setScenarioResults({
      ...params,
      ...results,
      timestamp: params.timestamp
    });
  };

  const handlePeriodChange = (newPeriod) => {
    setBaselinePeriod(newPeriod);
    // Clear scenario results when period changes
    setScenarioResults(null);
  };

  console.log('[APP] Before return, state:', {
    isLoading,
    hasError: !!error,
    hasData: !!data,
    activeTab,
    hasBaselineMetrics: !!baselineMetrics
  });

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

            <div className="header-actions flex flex-wrap items-center gap-2 sm:gap-4">
              <DateRangeFilter />

              <div className="hidden sm:block h-6 w-px bg-slate-300"></div>

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
                <span className="hidden sm:inline">Glossary</span>
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b border-slate-200 px-6" aria-label="Dashboard navigation">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-1 overflow-x-auto" role="tablist">
              {[
                { id: 'executive', label: 'Executive Summary' },
                { id: 'concentration', label: 'Concentration Risk' },
                { id: 'health', label: 'Donor Health' },
                { id: 'patterns', label: 'Giving Patterns' },
                { id: 'trends', label: 'Temporal Trends' },
                { id: 'scenarios', label: 'What-If Analysis' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
              {/* Tab Content */}
              {activeTab === 'executive' && (
                <>
                  {console.log('[APP] Rendering ExecutiveSummary')}
                  <ExecutiveSummary />
                </>
              )}

              {activeTab === 'concentration' && (
                <>
                  {console.log('[APP] Rendering ConcentrationRisk')}
                  <ConcentrationRisk />
                </>
              )}

              {activeTab === 'health' && (
                <>
                  {console.log('[APP] Rendering DonorHealth')}
                  <DonorHealth />
                </>
              )}

              {activeTab === 'patterns' && (
                <>
                  {console.log('[APP] Rendering GivingPatterns')}
                  <GivingPatterns />
                </>
              )}

              {activeTab === 'trends' && (
                <>
                  {console.log('[APP] Rendering TemporalTrends')}
                  <TemporalTrends />
                </>
              )}

              {activeTab === 'scenarios' && (
                <div className="space-y-6">
                  <FilterStatus mode="independent" />
                  <section className="scenario-section">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      <ScenarioPanel
                        onRun={handleRunScenario}
                        onPeriodChange={handlePeriodChange}
                        baseline={baselineMetrics}
                        selectedPeriod={baselinePeriod}
                        isLoading={isLoading}
                      />

                      {scenarioResults ? (
                        <div className="chart-container bg-white rounded-lg border border-slate-200 shadow-sm">
                          {/* Header */}
                          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-900">Projected Impact on Next Year's Revenue</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Based on {baselineMetrics?.period} patterns
                            </p>
                          </div>

                          <div className="p-6 space-y-4">
                            {/* Base Revenue */}
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <span className="text-sm text-slate-600">Base Revenue</span>
                              <span className="font-mono font-semibold text-slate-900">
                                ${scenarioResults.baseRevenue.toLocaleString()}
                              </span>
                            </div>

                            {/* Retention Impact with Explanation */}
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">
                                  <GlossaryTooltip termKey="retention">Retention</GlossaryTooltip> Impact
                                </span>
                                <span className={`font-mono font-bold text-lg ${scenarioResults.retentionImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {scenarioResults.retentionImpact >= 0 ? '+' : ''}${scenarioResults.retentionImpact.toLocaleString()}
                                </span>
                              </div>
                              {scenarioResults.details?.retention && (
                                <p className="text-xs text-emerald-800 leading-relaxed">
                                  Retaining <span className="font-semibold">{Math.abs(scenarioResults.details.retention.additionalDonors)} additional donors</span>
                                  {' '}at their average gift of ${scenarioResults.details.retention.avgGift.toFixed(0)} would add this to <span className="font-semibold">next year's</span> revenue.
                                </p>
                              )}
                            </div>

                            {/* Recurring Impact with Explanation */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">
                                  <GlossaryTooltip termKey="recurringRate">Recurring</GlossaryTooltip> Impact
                                </span>
                                <span className={`font-mono font-bold text-lg ${scenarioResults.recurringImpact >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {scenarioResults.recurringImpact >= 0 ? '+' : ''}${scenarioResults.recurringImpact.toLocaleString()}
                                </span>
                              </div>
                              {scenarioResults.details?.recurring && (
                                <p className="text-xs text-blue-800 leading-relaxed">
                                  Converting <span className="font-semibold">{Math.abs(scenarioResults.details.recurring.additionalDonors)} donors</span>
                                  {' '}to monthly giving at average of ${scenarioResults.details.recurring.avgMonthlyGift.toFixed(0)}/month would add this to <span className="font-semibold">next year's annual</span> revenue.
                                </p>
                              )}
                            </div>

                            {/* Projected Revenue - Prominent */}
                            <div className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border-2 border-indigo-300 shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-indigo-900">Projected Revenue</span>
                                <span className="text-2xl font-bold text-indigo-600">
                                  ${scenarioResults.projectedRevenue.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs text-indigo-700 leading-relaxed">
                                Your baseline plus projected improvements from the scenarios above.
                              </p>
                            </div>

                            {/* Net Change Indicator */}
                            {scenarioResults.baseRevenue && (
                              <div className="pt-3 border-t border-slate-200">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600">Total Projected Change</span>
                                  <span className={`font-mono font-semibold ${(scenarioResults.projectedRevenue - scenarioResults.baseRevenue) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {(scenarioResults.projectedRevenue - scenarioResults.baseRevenue) >= 0 ? '+' : ''}
                                    ${(scenarioResults.projectedRevenue - scenarioResults.baseRevenue).toLocaleString()}
                                    {' '}({(((scenarioResults.projectedRevenue - scenarioResults.baseRevenue) / scenarioResults.baseRevenue) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-slate-500 text-center pt-2">
                              Scenario run at {new Date(scenarioResults.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="chart-container bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-slate-500 font-medium mb-1">Ready to Model Scenarios</p>
                            <p className="text-sm text-slate-400">
                              Adjust the sliders and click "Run Scenario" to see projected impact
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </main>

        {/* Modals */}
        <Glossary isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />
        <AccessibilityPanel isOpen={isA11yPanelOpen} onClose={() => setIsA11yPanelOpen(false)} />
        <DonorListPanel />

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-12 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-slate-500 text-center">
              {latestDataDate ? (
                <>Data as of {latestDataDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</>
              ) : (
                <>Loading data...</>
              )}
            </p>
          </div>
        </footer>
      </div>
    </AccessibilityProvider>
  );
}

export default App;
