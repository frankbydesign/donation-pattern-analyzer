import React, { useState, useCallback, useMemo } from 'react';
import { getBaselinePeriodOptions } from '../utils/scenarioUtils';

/**
 * ScenarioPanel - Enhanced What-If Analysis with real data and clear explanations
 * Allows users to model retention and recurring giving improvements with full context
 */
const ScenarioPanel = ({
  onRun,
  onPeriodChange,
  baseline = null,
  selectedPeriod = 'last_year',
  isLoading = false,
  className = ''
}) => {
  // Initialize sliders with current actual values from baseline
  const currentRetention = baseline?.currentRetention || 45;
  const currentRecurringPct = baseline?.currentRecurringPct || 10;

  const [retention, setRetention] = useState(currentRetention);
  const [recurringPct, setRecurringPct] = useState(currentRecurringPct);
  const [hasChanges, setHasChanges] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [lastRunValues, setLastRunValues] = useState(null);

  // Update sliders ONLY when baseline period changes, NOT after running scenarios
  React.useEffect(() => {
    if (baseline && selectedPeriod !== lastRunValues?.period) {
      setRetention(baseline.currentRetention);
      setRecurringPct(baseline.currentRecurringPct);
      setHasChanges(false);
      setLastRunValues({ period: selectedPeriod, retention: baseline.currentRetention, recurringPct: baseline.currentRecurringPct });
    }
  }, [baseline, selectedPeriod, lastRunValues]);

  const handleRetentionChange = useCallback((e) => {
    setRetention(Number(e.target.value));
    setHasChanges(true);
  }, []);

  const handleRecurringPctChange = useCallback((e) => {
    setRecurringPct(Number(e.target.value));
    setHasChanges(true);
  }, []);

  const handleRunScenario = useCallback(() => {
    if (onRun && baseline) {
      onRun({
        retention,
        recurringPct,
        timestamp: new Date().toISOString()
      });
      // Keep sliders at their current positions - DON'T reset
      setHasChanges(false); // Just mark that we've run with current values
      setLastRunValues({ period: selectedPeriod, retention, recurringPct });
    }
  }, [onRun, retention, recurringPct, baseline, selectedPeriod]);

  const handleReset = useCallback(() => {
    setRetention(currentRetention);
    setRecurringPct(currentRecurringPct);
    setHasChanges(false);
  }, [currentRetention, currentRecurringPct]);

  const periodOptions = useMemo(() => getBaselinePeriodOptions(), []);

  // Calculate potential impact estimates
  const retentionDelta = retention - currentRetention;
  const recurringDelta = recurringPct - currentRecurringPct;

  const estimatedRetainedDonors = baseline
    ? Math.round((retentionDelta / 100) * baseline.lapsedDonorCount)
    : 0;

  const estimatedRecurringDonors = baseline
    ? Math.round((recurringDelta / 100) * baseline.donorCount)
    : 0;

  if (!baseline) {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm p-6 ${className}`}>
        <p className="text-slate-500">Loading baseline data...</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}
      role="region"
      aria-labelledby="scenario-panel-title"
    >
      {/* Header with Context */}
      <header className="px-6 pt-6 pb-4 border-b border-slate-100">
        <h3
          id="scenario-panel-title"
          className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-2"
        >
          <svg
            className="w-5 h-5 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          What-If Analysis
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          Model how improvements to donor retention and recurring giving could affect <span className="font-semibold">next year's revenue</span>.
          Projections are based on patterns from your selected baseline period.
        </p>
      </header>

      <div className="p-6 space-y-6">
        {/* Baseline Period Selector */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <label htmlFor="baseline-period" className="block text-sm font-medium text-slate-700 mb-2">
            Baseline Period (for pattern analysis)
          </label>
          <select
            id="baseline-period"
            value={selectedPeriod}
            onChange={(e) => onPeriodChange && onPeriodChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-600">
            <span className="font-medium">Baseline patterns: {baseline.period}</span>
            {' '}— ${baseline.totalRevenue.toLocaleString()} from {baseline.donorCount.toLocaleString()} contactable donors
          </p>
          <p className="mt-1 text-xs text-slate-500 italic">
            Projections will estimate <span className="font-semibold">next year's</span> revenue based on these patterns
          </p>
        </div>

        {/* Retention Scenario Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="retention-slider" className="text-sm font-semibold text-slate-900">
                Retention Rate Scenario
              </label>
              <output
                htmlFor="retention-slider"
                className="text-base font-mono font-bold text-indigo-600"
              >
                {currentRetention.toFixed(1)}% → {retention}%
              </output>
            </div>

            <input
              id="retention-slider"
              type="range"
              min="20"
              max="80"
              step="0.5"
              value={retention}
              onChange={handleRetentionChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-valuemin={20}
              aria-valuemax={80}
              aria-valuenow={retention}
              aria-valuetext={`${retention} percent retention`}
            />

            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>20%</span>
              <span className="text-emerald-600 font-medium">Benchmark: 40-45%</span>
              <span>80%</span>
            </div>
          </div>

          <div className="text-sm text-slate-600 space-y-1">
            <p>
              <span className="font-medium">Your current retention is {currentRetention.toFixed(1)}%.</span>
              {' '}Sector benchmark is 40-45% (top performers: 60%+).
            </p>
            {baseline.lapsedDonorCount > 0 && (
              <p className="text-xs">
                Each 1% improvement could retain approximately{' '}
                <span className="font-medium">{Math.round(baseline.lapsedDonorCount / 100)} donors</span>
                {' '}from the {baseline.lapsedDonorCount} who lapsed.
              </p>
            )}
          </div>

          {retentionDelta !== 0 && (
            <div className={`mt-3 p-3 rounded-lg ${retentionDelta > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-orange-50 border border-orange-200'}`}>
              <p className={`text-sm font-medium ${retentionDelta > 0 ? 'text-emerald-900' : 'text-orange-900'}`}>
                {retentionDelta > 0 ? 'Improvement' : 'Reduction'}: {Math.abs(retentionDelta).toFixed(1)}%
              </p>
              <p className={`text-xs mt-1 ${retentionDelta > 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                Could {retentionDelta > 0 ? 'retain' : 'lose'}{' '}
                <span className="font-semibold">{Math.abs(estimatedRetainedDonors)} additional donors</span>
                {' '}at avg gift of ${baseline.avgGift.toFixed(0)}
              </p>
            </div>
          )}
        </div>

        {/* Recurring Giving Scenario Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="recurring-pct-slider" className="text-sm font-semibold text-slate-900">
                Monthly Donors Scenario
              </label>
              <output
                htmlFor="recurring-pct-slider"
                className="text-base font-mono font-bold text-indigo-600"
              >
                {currentRecurringPct.toFixed(1)}% → {recurringPct}%
              </output>
            </div>

            <input
              id="recurring-pct-slider"
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={recurringPct}
              onChange={handleRecurringPctChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-valuemin={0}
              aria-valuemax={50}
              aria-valuenow={recurringPct}
              aria-valuetext={`${recurringPct} percent monthly donors`}
            />

            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span className="text-emerald-600 font-medium">Target: 20-30%</span>
              <span>50%</span>
            </div>
          </div>

          <div className="text-sm text-slate-600 space-y-1">
            <p>
              <span className="font-medium">Currently {currentRecurringPct.toFixed(1)}% of donors give monthly</span>
              {' '}({baseline.monthlyDonorCount} of {baseline.donorCount} donors).
            </p>
            <p className="text-xs">
              Each 1% increase converts approximately{' '}
              <span className="font-medium">{Math.round(baseline.donorCount / 100)} donors</span>
              {' '}to recurring giving.
            </p>
          </div>

          {recurringDelta !== 0 && (
            <div className={`mt-3 p-3 rounded-lg ${recurringDelta > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}>
              <p className={`text-sm font-medium ${recurringDelta > 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                {recurringDelta > 0 ? 'Increase' : 'Decrease'}: {Math.abs(recurringDelta).toFixed(1)}%
              </p>
              <p className={`text-xs mt-1 ${recurringDelta > 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                Could convert{' '}
                <span className="font-semibold">{Math.abs(estimatedRecurringDonors)} donors</span>
                {' '}to monthly giving at avg of ${baseline.avgMonthlyGift.toFixed(0)}/month
              </p>
            </div>
          )}
        </div>

        {/* Key Assumptions Display */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Key Assumptions
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Average Gift</p>
              <p className="font-mono font-semibold text-slate-900">${baseline.avgGift.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Avg Monthly Gift</p>
              <p className="font-mono font-semibold text-slate-900">${baseline.avgMonthlyGift.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Lapsed Donors</p>
              <p className="font-mono font-semibold text-slate-900">{baseline.lapsedDonorCount}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Current Monthly Donors</p>
              <p className="font-mono font-semibold text-slate-900">{baseline.monthlyDonorCount}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRunScenario}
            disabled={isLoading || !baseline}
            className={`
              flex-1 px-4 py-3 rounded-lg font-medium text-sm
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              ${isLoading || !baseline
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : hasChanges
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }
            `}
            aria-label="Run scenario analysis"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running...
              </span>
            ) : (
              <>Run Scenario</>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading || (!hasChanges && retention === currentRetention && recurringPct === currentRecurringPct)}
            className="px-5 py-3 rounded-lg font-medium text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reset to current values"
          >
            Reset to Current
          </button>
        </div>

        {/* Methodology Section */}
        <div className="border-t border-slate-200 pt-4">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            aria-expanded={showMethodology}
          >
            <svg
              className={`w-4 h-4 transition-transform ${showMethodology ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            How this is calculated
          </button>

          {showMethodology && (
            <div className="mt-3 pl-6 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <span className="font-medium">Retention Impact:</span> Assumes retained donors continue giving at their historical average gift amount.
                The calculation estimates how many additional donors from those who lapsed would be retained based on the improvement in retention rate.
              </p>
              <p>
                <span className="font-medium">Recurring Conversion:</span> Assumes converted donors give monthly (12x per year) at the average monthly gift amount observed in your data.
                The calculation estimates how many additional donors would convert to monthly giving based on the percentage point increase.
              </p>
              <p className="text-slate-500 italic">
                These are planning estimates based on historical patterns. Actual results depend on program implementation effectiveness, donor engagement strategies, and external factors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioPanel;
