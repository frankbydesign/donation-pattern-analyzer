import React, { useState, useCallback } from 'react';

/**
 * ScenarioPanel - Scenario modeling panel with adjustable parameters
 * Allows users to model retention and recurring growth scenarios
 */
const ScenarioPanel = ({
  onRun,
  initialRetention = 45,
  initialRecurringGrowth = 10,
  isLoading = false,
  className = ''
}) => {
  const [retention, setRetention] = useState(initialRetention);
  const [recurringGrowth, setRecurringGrowth] = useState(initialRecurringGrowth);
  const [hasChanges, setHasChanges] = useState(false);

  const handleRetentionChange = useCallback((e) => {
    setRetention(Number(e.target.value));
    setHasChanges(true);
  }, []);

  const handleRecurringGrowthChange = useCallback((e) => {
    setRecurringGrowth(Number(e.target.value));
    setHasChanges(true);
  }, []);

  const handleRunScenario = useCallback(() => {
    if (onRun) {
      onRun({
        retention,
        recurringGrowth,
        timestamp: new Date().toISOString()
      });
    }
    setHasChanges(false);
  }, [onRun, retention, recurringGrowth]);

  const handleReset = useCallback(() => {
    setRetention(initialRetention);
    setRecurringGrowth(initialRecurringGrowth);
    setHasChanges(false);
  }, [initialRetention, initialRecurringGrowth]);

  // Calculate projected impact (simplified example)
  const projectedRetentionImpact = ((retention - 45) / 45 * 100).toFixed(1);
  const projectedRecurringImpact = ((recurringGrowth - 10) / 10 * 100).toFixed(1);

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm p-6 ${className}`}
      role="region"
      aria-labelledby="scenario-panel-title"
    >
      <header className="mb-6">
        <h3
          id="scenario-panel-title"
          className="text-lg font-semibold text-slate-900 flex items-center gap-2"
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
          Scenario Modeling
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Adjust parameters to project future outcomes
        </p>
      </header>

      <div className="space-y-6">
        {/* Retention Rate Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="retention-slider"
              className="text-sm font-medium text-slate-700"
            >
              Retention Rate
            </label>
            <output
              htmlFor="retention-slider"
              className="text-sm font-mono font-semibold text-indigo-600"
            >
              {retention}%
            </output>
          </div>

          <input
            id="retention-slider"
            type="range"
            min="20"
            max="80"
            step="1"
            value={retention}
            onChange={handleRetentionChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-valuemin={20}
            aria-valuemax={80}
            aria-valuenow={retention}
            aria-valuetext={`${retention} percent`}
          />

          <div className="flex justify-between text-xs text-slate-400">
            <span>20%</span>
            <span className="text-emerald-600 font-medium">Benchmark: 45%</span>
            <span>80%</span>
          </div>

          {retention !== 45 && (
            <p className={`text-xs ${Number(projectedRetentionImpact) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {Number(projectedRetentionImpact) >= 0 ? '+' : ''}{projectedRetentionImpact}% vs benchmark
            </p>
          )}
        </div>

        {/* Recurring Growth Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="recurring-growth-slider"
              className="text-sm font-medium text-slate-700"
            >
              Recurring Donor Growth
            </label>
            <output
              htmlFor="recurring-growth-slider"
              className="text-sm font-mono font-semibold text-indigo-600"
            >
              {recurringGrowth}%
            </output>
          </div>

          <input
            id="recurring-growth-slider"
            type="range"
            min="-20"
            max="50"
            step="1"
            value={recurringGrowth}
            onChange={handleRecurringGrowthChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-valuemin={-20}
            aria-valuemax={50}
            aria-valuenow={recurringGrowth}
            aria-valuetext={`${recurringGrowth} percent growth`}
          />

          <div className="flex justify-between text-xs text-slate-400">
            <span>-20%</span>
            <span className="text-emerald-600 font-medium">Current: 10%</span>
            <span>+50%</span>
          </div>

          {recurringGrowth !== 10 && (
            <p className={`text-xs ${Number(projectedRecurringImpact) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {Number(projectedRecurringImpact) >= 0 ? '+' : ''}{projectedRecurringImpact}% vs current rate
            </p>
          )}
        </div>

        {/* Projected Impact Summary */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 mb-2">
            Projected Impact
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Est. Revenue Impact</p>
              <p className={`font-mono font-semibold ${retention >= 45 ? 'text-emerald-600' : 'text-red-600'}`}>
                {retention >= 45 ? '+' : ''}{((retention - 45) * 0.5 + (recurringGrowth - 10) * 0.3).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500">Donor Base Change</p>
              <p className={`font-mono font-semibold ${retention >= 45 ? 'text-emerald-600' : 'text-red-600'}`}>
                {retention >= 45 ? '+' : ''}{((retention - 45) * 0.8).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRunScenario}
            disabled={isLoading}
            className={`
              flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              ${isLoading
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
            disabled={isLoading || (!hasChanges && retention === initialRetention && recurringGrowth === initialRecurringGrowth)}
            className="px-4 py-2.5 rounded-lg font-medium text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reset to default values"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPanel;
