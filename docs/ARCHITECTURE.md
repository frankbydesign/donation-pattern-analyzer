# Architecture Documentation

**Project:** Donation Pattern Analyzer
**Generated:** 2026-01-01
**Purpose:** Interactive visualization tool for nonprofit donor analytics

---

## File Structure

### Root Configuration
- `package.json` — Node.js dependencies, scripts, and project metadata
- `vite.config.js` — Vite build configuration (React plugin, base path `/donation-pattern-analyzer/`)
- `tailwind.config.js` — Tailwind CSS theme configuration (fonts, colors)
- `postcss.config.js` — PostCSS with Tailwind and Autoprefixer
- `.gitignore` — Excludes node_modules, dist, IDE files, env files

### Source Code (React Application)
- `src/main.jsx` — React entry point, renders `<App />` into `#root`
- `src/App.jsx` — Main application component with tabs, scenarios, glossary, accessibility
- `src/components/InsightSummary.jsx` — Card component for displaying insight summaries
- `src/components/ScenarioPanel.jsx` — Interactive what-if analysis with sliders
- `src/components/Glossary.jsx` — Glossary panel + tooltip wrapper (`GLOSSARY` constant exported)
- `src/components/Tour.jsx` — Onboarding tour using Shepherd.js
- `src/components/Accessibility.jsx` — Accessibility context, settings panel, skip links, high contrast toggle
- `src/components/index.js` — Component re-exports
- `src/utils/export.js` — Export functions for PDF (jsPDF), PPT (PptxGenJS), CSV, JSON, and chart images

### Styles
- `src/styles/index.css` — Main stylesheet with Tailwind layers, component classes (cards, buttons, badges, alerts)
- `src/styles/accessibility.css` — WCAG 2.1 AA compliant styles (high contrast, reduced motion, focus states, print styles, touch targets)

### Data Files
- `donor_data_layer1.json` — Donor-centric data with gift history, anonymity flags
- `donor_data_layer2.json` — Computed insights (RFM scoring, segmentation, retention cohorts, lapse risk)
- `donor_data_layer3.json` — External context (sector benchmarks, Giving USA trends, economic timeline)
- `dataset_anon.csv` — Raw anonymized donation data (source)

### Data Generation Scripts (Python)
- `generate_layer1_from_csv.py` — Converts CSV to Layer 1 donor profiles
- `generate_layer2_insights.py` — Computes RFM scoring, segmentation, pattern detection

### Static Files
- `index.html` — Large standalone HTML file (~31,000+ tokens) with embedded CSS and Chart.js implementation
- `.github/workflows/static.yml` — GitHub Pages deployment workflow (deploys entire repo without build)

---

## Data Flow

### Current State (React App)
**⚠️ CRITICAL:** The React application (`src/App.jsx`) **does NOT currently load or visualize the JSON data files**.

- App.jsx contains only hardcoded UI demonstrations:
  - Static insight cards with hardcoded metrics
  - Scenario calculator with simple formula (retention/recurring impact)
  - No data fetching from Layer 1/2/3 JSON files
  - No Chart.js/react-chartjs-2 chart components

### Data Layer Architecture (Designed but Not Implemented in React)
1. **Layer 1 (Donor Profiles)** — `donor_data_layer1.json`
   - Aggregated by donor from CSV
   - Fields: donor_id, anon_email, is_anonymous, first_gift, last_gift, total_gifts, total_amount, gifts[]
   - Generated via `generate_layer1_from_csv.py`

2. **Layer 2 (Computed Insights)** — `donor_data_layer2.json`
   - RFM scoring (Recency, Frequency, Monetary quintiles 1-5)
   - Segmentation (Champions, At Risk, Lapsed, etc.)
   - Retention cohorts and lapse risk predictions
   - Generated via `generate_layer2_insights.py`

3. **Layer 3 (External Context)** — `donor_data_layer3.json`
   - Sector benchmarks
   - Giving USA trends
   - Economic timeline (2018-2025)

### Dual Implementation Problem
- **index.html** — Standalone HTML/CSS/JS file with Chart.js (likely the working visualization)
- **React app (src/)** — Modern component architecture but incomplete, no data loading or charting yet

**Conclusion:** Data flows from CSV → Layer 1 → Layer 2 → Layer 3, but **React app does not consume it yet**. The `index.html` likely contains the functional implementation.

---

## Chart Implementation

### Dependencies Installed
- `chart.js@^4.4.1` — Core charting library
- `chartjs-plugin-annotation@^3.0.1` — Annotations (lines, boxes, labels)
- `chartjs-plugin-datalabels@^2.2.0` — Data labels on chart elements
- `react-chartjs-2@^5.2.0` — React wrapper for Chart.js

### Current Usage
- **index.html:** Loads Chart.js via CDN (`<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`)
- **React app:** Dependencies installed but **no chart components implemented yet**

### Chart Configuration
- **Centralization:** Unknown in index.html (file too large to fully inspect)
- **React app:** No chart configurations exist yet

### Global Filtering
- **React app:** No global state management (no Redux, Zustand, Context for data)
- **Scenario Panel:** Local state only (`useState` for retention/recurring sliders)
- **No filter propagation mechanism** — would require implementation of:
  - Shared state provider
  - Filter context
  - Chart re-render logic

---

## CSS Architecture

### Framework: Tailwind CSS v3.4.0
- **Methodology:** Utility-first with custom component classes
- **Configuration:** `tailwind.config.js` (IBM Plex fonts, extended colors)
- **Build:** PostCSS + Autoprefixer

### Custom Styles
- **index.css** — Tailwind layers with component classes:
  - `.card`, `.metric-card`, `.btn-*`, `.badge-*`, `.alert-*`
  - Grid utilities (`.grid-auto-fit-200/300/400`)
- **accessibility.css** — Comprehensive a11y styles:
  - `.sr-only` for screen readers
  - Focus styles (`:focus-visible` with 2px indigo outline)
  - High contrast mode (`.high-contrast` HTML class)
  - Reduced motion (`.reduced-motion` HTML class)
  - Responsive breakpoints (mobile-first)
  - Print styles
  - Touch target sizes (44px min for pointer: coarse)
  - Colorblind-safe patterns (`.pattern-primary/secondary/warning/danger`)

### Colors & Spacing
- **Colors:** CSS custom properties in Tailwind config + extended palette
  - Primary: `#4F46E5` (Indigo 600)
  - Secondary: `#10B981` (Emerald 500)
  - Warning: `#F59E0B` (Amber 500)
  - Danger: `#DC2626` (Red 600)
- **Spacing:** Tailwind defaults (rem-based scale)
- **Typography:** IBM Plex Sans (UI), IBM Plex Mono (data/numbers)

### Consistency
- **Good:** Component classes in index.css provide reusable patterns
- **Good:** Accessibility.css is comprehensive and well-documented
- **Mixed:** Inline Tailwind classes throughout components (expected with Tailwind)

---

## Dependencies

### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | DOM rendering |
| chart.js | ^4.4.1 | Data visualization |
| react-chartjs-2 | ^5.2.0 | React wrapper for Chart.js |
| chartjs-plugin-annotation | ^3.0.1 | Chart annotations |
| chartjs-plugin-datalabels | ^2.2.0 | Chart data labels |
| @tippyjs/react | ^4.2.6 | Tooltip library (Glossary) |
| tippy.js | ^6.3.7 | Tooltip positioning engine |
| shepherd.js | ^11.2.0 | Product tour/onboarding |
| jspdf | ^2.5.1 | PDF export |
| html2canvas | ^1.4.1 | DOM to canvas (for exports) |
| pptxgenjs | ^3.12.0 | PowerPoint export |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.0.10 | Build tool |
| @vitejs/plugin-react | ^4.2.1 | React support for Vite |
| tailwindcss | ^3.4.0 | CSS framework |
| postcss | ^8.4.32 | CSS processing |
| autoprefixer | ^10.4.16 | CSS vendor prefixes |
| @types/react | ^18.2.43 | React TypeScript types |
| @types/react-dom | ^18.2.17 | React DOM TypeScript types |

### CDN Dependencies (index.html)
- Chart.js (via jsdelivr CDN)
- Chart.js plugins (via jsdelivr CDN)
- Google Fonts: IBM Plex Sans, IBM Plex Mono

---

## Technical Debt & Risks

### Critical Issues

#### 1. **Dual Implementation Ambiguity**
- **Risk:** Unclear which implementation is canonical (index.html vs React app)
- **Impact:** Maintenance burden, feature drift, unclear source of truth
- **Evidence:** index.html is 31k+ tokens (likely contains full working app), React app is incomplete
- **Recommendation:** Decide on single implementation, archive the other

#### 2. **React App Missing Data Integration**
- **Risk:** App.jsx doesn't load Layer 1/2/3 JSON files
- **Impact:** Cannot display actual donor data, insights, or charts
- **Evidence:** No fetch/import of JSON, no chart components, only hardcoded UI
- **Recommendation:** Implement data loading before adding features

#### 3. **No State Management for Filtering**
- **Risk:** Adding global filters (date range, donor segment) would require extensive refactoring
- **Impact:** Cannot implement cross-chart filtering without architectural changes
- **Evidence:** No Context/Redux/Zustand, each component has isolated state
- **Recommendation:** Add state management before implementing filters

#### 4. **GitHub Pages Deployment Doesn't Build React App**
- **Risk:** Deployment workflow uploads raw source, not built `dist/` folder
- **Impact:** React app not accessible in production
- **Evidence:** `.github/workflows/static.yml` uploads entire repo (`path: '.'`)
- **Recommendation:** Update workflow to run `npm run build` and deploy `dist/`

### Moderate Issues

#### 5. **Hardcoded Values in Scenario Panel**
- **Location:** `src/App.jsx:29-37`, `src/components/ScenarioPanel.jsx:46-47`
- **Issue:** Base revenue ($500k), benchmark retention (45%), impact formulas
- **Impact:** Cannot adapt to different organizations or time periods
- **Recommendation:** Load from config or Layer 2 summary data

#### 6. **No Chart Abstraction**
- **Issue:** No reusable chart wrapper component
- **Impact:** Will lead to duplicated Chart.js configuration code
- **Recommendation:** Create `<Chart />` wrapper before adding multiple charts

#### 7. **Export Utilities Unused**
- **Location:** `src/utils/export.js`
- **Issue:** Comprehensive PDF/PPT export functions but no UI triggers
- **Impact:** Dead code, untested functionality
- **Recommendation:** Add export buttons or remove until needed

#### 8. **Large index.html File**
- **Issue:** 31k+ tokens suggests embedded data or inline code
- **Impact:** Hard to maintain, slow to load, version control bloat
- **Recommendation:** If keeping HTML version, extract data to separate files

### Minor Issues

#### 9. **Incomplete Tab Navigation**
- **Location:** `src/App.jsx:84-104`
- **Issue:** Tabs exist but don't switch content
- **Impact:** Navigation doesn't work
- **Recommendation:** Implement tab content switching

#### 10. **Python Scripts Not Integrated**
- **Issue:** Manual data generation process
- **Impact:** Data updates require manual script execution
- **Recommendation:** Add npm scripts or document workflow

---

## Recommendations

### Immediate Actions (Before Feature Work)

#### 1. **Clarify Implementation Strategy**
- **Decision required:** Choose HTML or React as primary implementation
- **If HTML:** Document as legacy, focus React development, plan migration timeline
- **If React:** Fix deployment workflow, remove/archive index.html

#### 2. **Fix React Deployment**
Update `.github/workflows/static.yml`:
```yaml
- name: Install dependencies
  run: npm ci
- name: Build
  run: npm run build
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: './dist'
```

#### 3. **Implement Data Loading**
Priority order:
- Create data loading module (`src/data/loader.js`)
- Load Layer 1/2/3 JSON files
- Create data context provider
- Wire into App.jsx

#### 4. **Add State Management**
Recommended approach:
- **Option A (Lightweight):** React Context + useReducer for filter state
- **Option B (Scalable):** Zustand for client state management
- **Avoid:** Redux (overkill for this use case)

### Quick Wins

#### 5. **Component Barrel Exports**
- Already exists (`src/components/index.js`) ✅
- Simplifies imports

#### 6. **Accessibility Infrastructure**
- Already comprehensive ✅
- High contrast mode, reduced motion, keyboard nav, WCAG AA compliance

#### 7. **Export Utilities**
- Already built, just need UI triggers
- Add "Export PDF" button to header

### Refactoring Before Feature Work

#### 8. **Create Chart Components**
Before adding multiple charts:
```
src/components/charts/
  Chart.jsx           // Base wrapper for react-chartjs-2
  BarChart.jsx        // Preconfigured bar chart
  LineChart.jsx       // Preconfigured line chart
  DoughnutChart.jsx   // Preconfigured doughnut chart
  chartDefaults.js    // Shared Chart.js config
```

#### 9. **Centralized Data Store**
Proposed structure:
```javascript
// src/store/dataStore.js (using Zustand)
const useDataStore = create((set) => ({
  layer1: null,
  layer2: null,
  layer3: null,
  filters: { dateRange: null, segment: null, status: null },
  setFilters: (filters) => set({ filters }),
  loadData: async () => { /* fetch logic */ }
}))
```

#### 10. **Configuration Extraction**
Move hardcoded values to:
```
src/config/
  metrics.js      // Base revenue, benchmarks
  theme.js        // Chart colors, fonts
  constants.js    // App-wide constants
```

---

## Architectural Patterns

### Current Patterns
- **Component structure:** Functional components with hooks
- **Styling:** Tailwind utility classes + custom component classes
- **State:** Local component state (useState)
- **Props:** Explicit prop passing (no prop drilling yet)
- **Accessibility:** Provider pattern for global a11y settings

### Recommended Patterns for Feature Work
- **Data fetching:** Custom hook (`useData()`) wrapping fetch/import
- **Filtering:** Filter context with reducer for complex state
- **Charts:** Compound component pattern (Chart + Chart.Bar, Chart.Line, etc.)
- **Export:** Render props or hook for export triggers
- **Performance:** React.memo for expensive chart re-renders

---

## Testing Strategy (Not Yet Implemented)

### Recommended Additions
- **Unit tests:** Vitest for utility functions, data transformations
- **Component tests:** React Testing Library for user interactions
- **Visual regression:** Storybook or Chromatic for component library
- **E2E tests:** Playwright for critical user flows

### Current State
- No test framework configured ❌
- No tests written ❌

---

## Build & Deployment

### Current Workflow
1. Push to `main` branch
2. GitHub Actions triggers `.github/workflows/static.yml`
3. Workflow uploads **entire repository** to GitHub Pages
4. **Problem:** React app not built, raw source served

### Recommended Workflow
1. Push to `main`
2. GitHub Actions runs `npm ci && npm run build`
3. Vite builds to `dist/` folder
4. Upload `dist/` to GitHub Pages
5. React app accessible at `frankbydesign.github.io/donation-pattern-analyzer/`

### Local Development
```bash
npm install      # Install dependencies
npm run dev      # Start dev server (localhost:3000)
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## Data Pipeline

### Current (Python Scripts)
```
dataset_anon.csv
  ↓ generate_layer1_from_csv.py
donor_data_layer1.json
  ↓ generate_layer2_insights.py
donor_data_layer2.json
  ↓ (manual creation)
donor_data_layer3.json
```

### Recommended Integration
- Add npm scripts: `"data:layer1": "python3 generate_layer1_from_csv.py"`
- Document data update workflow in README
- Consider Node.js data processing (eliminate Python dependency) if needed

---

## Next Steps for Feature Development

### Phase 1: Foundation (Required Before New Features)
1. Choose primary implementation (HTML or React)
2. Fix deployment workflow
3. Implement data loading in React app
4. Add state management (Context or Zustand)
5. Create reusable Chart components

### Phase 2: Core Features
1. Render actual donor insights from Layer 2
2. Implement chart visualizations (RFM, retention, giving patterns)
3. Wire up export functionality
4. Implement tab navigation with content switching

### Phase 3: Interactivity
1. Date range filter
2. Donor segment filter
3. Cross-chart filtering
4. Drill-down interactions

### Phase 4: Polish
1. Add loading states
2. Error handling
3. Performance optimization (memoization, lazy loading)
4. Add tests

---

**End of Architecture Document**
