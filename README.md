# donation-pattern-analyzer

An interactive visualization tool that surfaces hidden patterns in nonprofit donor data to support executive decision-making.

## Purpose

Nonprofit leaders often have years of donation data but lack the cognitive bandwidth to hold thousands of transactions in working memory simultaneously. This tool bridges that gap—computing patterns, identifying risks, and contextualizing performance against sector benchmarks and economic conditions.

The goal isn't just visualization. It's *augmented cognition*: enabling a nonprofit executive to ask questions they wouldn't have known to ask.

## What It Does

The tool analyzes donor data across five insight categories:

1. **Concentration & Risk** — How dependent is revenue on a small number of major donors?
2. **Donor Base Health** — Are we acquiring new donors? Retaining existing ones? Who's at risk of lapsing?
3. **Giving Behavior** — What patterns exist in how people give (recurring, one-time, increasing, decreasing)?
4. **Temporal Dynamics** — When do donations cluster? How has seasonality shifted over time?
5. **External Context** — How does performance compare to sector benchmarks and economic conditions?

## Architecture

The system uses a three-layer data structure:

- **Layer 1: Donor-Centric Data** — Raw transactions transformed into donor profiles with derived metrics (cadence, trend, status)
- **Layer 2: Computed Insights** — Pre-calculated pattern detection including RFM scoring, segmentation, retention cohorts, and lapse risk
- **Layer 3: External Context** — Sector benchmarks, Giving USA trends, and economic timeline (2018–2025)

This separation allows the visualization layer to focus on presentation and interaction rather than computation.

## Development Approach

This project was built using AI-assisted development (Claude Code), with my role focused on:

- Defining the insight taxonomy and what patterns matter to nonprofit leadership
- Designing the data architecture and layer structure
- Translating domain knowledge (nonprofit fundraising) into computational requirements
- Iterating on design decisions as the build progressed

I'm transparent about this because it reflects how I believe computational media will increasingly be created—through human-AI collaboration where domain expertise and design thinking guide technical execution.

## Context

This is a portfolio piece for my application to UC Santa Cruz's Computational Media PhD program. My research interest is in how AI systems scaffold human decision-making, particularly for adults navigating complex choices.

This project is a small-scale demonstration of that idea: computational media that doesn't just display information, but changes what a person is capable of understanding and deciding.

## Data

The visualization uses anonymized donation data from an actual nonprofit organization. All personally identifiable information has been removed.

## Live Demo

[View the tool](https://frankbydesign.github.io/donation-pattern-analyzer/)

## Author

Frank Brockmann  
[Portfolio](https://frankbydesign.github.io/frankbrockmann/) | [LinkedIn](https://linkedin.com/in/frankbrockmann)
