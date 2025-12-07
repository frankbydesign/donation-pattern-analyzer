#!/usr/bin/env python3
"""
Layer 2 Insights Generator for Donation Pattern Analyzer

This module computes derived insights from Layer 1 raw donor data including:
- RFM (Recency, Frequency, Monetary) analysis with scoring
- Donor lifecycle and retention metrics
- Giving patterns and trends
- Segmentation analysis
- Year-over-year comparisons
- Seasonal patterns
- Risk scoring and predictions
"""

import json
from datetime import datetime, timedelta
from collections import defaultdict
from statistics import mean, median, stdev
import math

def load_layer1_data(filepath="donor_data_layer1.json"):
    """Load Layer 1 donor data from JSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)

def calculate_rfm_scores(donors, reference_date):
    """
    Calculate RFM (Recency, Frequency, Monetary) scores for each donor.
    Scores range from 1-5, with 5 being the best.
    """
    rfm_data = []

    for donor in donors:
        last_gift = datetime.strptime(donor['last_gift'], '%Y-%m-%d')
        recency_days = (reference_date - last_gift).days
        frequency = donor['total_gifts']
        monetary = donor['total_amount']

        rfm_data.append({
            'donor_id': donor['donor_id'],
            'recency_days': recency_days,
            'frequency': frequency,
            'monetary': monetary
        })

    # Calculate percentile-based scores
    recency_values = sorted([d['recency_days'] for d in rfm_data])
    frequency_values = sorted([d['frequency'] for d in rfm_data])
    monetary_values = sorted([d['monetary'] for d in rfm_data])

    def get_quintile_score(value, sorted_values, reverse=False):
        """Get quintile score (1-5) for a value."""
        n = len(sorted_values)
        quintiles = [sorted_values[int(n * i / 5)] for i in range(1, 5)]

        if reverse:  # Lower is better (for recency)
            if value <= quintiles[0]: return 5
            elif value <= quintiles[1]: return 4
            elif value <= quintiles[2]: return 3
            elif value <= quintiles[3]: return 2
            else: return 1
        else:  # Higher is better
            if value >= quintiles[3]: return 5
            elif value >= quintiles[2]: return 4
            elif value >= quintiles[1]: return 3
            elif value >= quintiles[0]: return 2
            else: return 1

    rfm_scores = {}
    for d in rfm_data:
        r_score = get_quintile_score(d['recency_days'], recency_values, reverse=True)
        f_score = get_quintile_score(d['frequency'], frequency_values)
        m_score = get_quintile_score(d['monetary'], monetary_values)

        rfm_scores[d['donor_id']] = {
            'recency_days': d['recency_days'],
            'recency_score': r_score,
            'frequency': d['frequency'],
            'frequency_score': f_score,
            'monetary': round(d['monetary'], 2),
            'monetary_score': m_score,
            'rfm_combined': f"{r_score}{f_score}{m_score}",
            'rfm_total': r_score + f_score + m_score
        }

    return rfm_scores

def segment_donors_by_rfm(rfm_scores):
    """
    Segment donors into meaningful groups based on RFM scores.
    """
    segments = {
        'champions': [],           # High RFM across the board
        'loyal_customers': [],     # High frequency, good monetary
        'potential_loyalists': [], # Recent, moderate frequency
        'recent_customers': [],    # Very recent, low frequency
        'promising': [],           # Recent, low frequency, low monetary
        'need_attention': [],      # Above average but slipping
        'about_to_sleep': [],      # Below average, at risk
        'at_risk': [],             # High value but not recent
        'cant_lose': [],           # Best customers going dormant
        'hibernating': [],         # Low across all metrics
        'lost': []                 # Gone for a long time
    }

    for donor_id, scores in rfm_scores.items():
        r, f, m = scores['recency_score'], scores['frequency_score'], scores['monetary_score']
        total = scores['rfm_total']

        if r >= 4 and f >= 4 and m >= 4:
            segments['champions'].append(donor_id)
        elif f >= 4 and m >= 3:
            if r >= 3:
                segments['loyal_customers'].append(donor_id)
            else:
                segments['cant_lose'].append(donor_id)
        elif r >= 4 and f >= 2 and f <= 3:
            segments['potential_loyalists'].append(donor_id)
        elif r >= 4 and f == 1:
            if m >= 3:
                segments['recent_customers'].append(donor_id)
            else:
                segments['promising'].append(donor_id)
        elif r == 3 and f >= 2:
            segments['need_attention'].append(donor_id)
        elif r == 2 and f >= 2:
            if m >= 3:
                segments['at_risk'].append(donor_id)
            else:
                segments['about_to_sleep'].append(donor_id)
        elif r == 1 and total >= 6:
            segments['hibernating'].append(donor_id)
        else:
            segments['lost'].append(donor_id)

    return segments

def calculate_giving_patterns(donors):
    """
    Analyze giving patterns including seasonality and day-of-week preferences.
    """
    monthly_totals = defaultdict(lambda: {'count': 0, 'amount': 0})
    weekday_totals = defaultdict(lambda: {'count': 0, 'amount': 0})
    yearly_totals = defaultdict(lambda: {'count': 0, 'amount': 0, 'donors': set()})

    for donor in donors:
        for gift in donor.get('gifts', []):
            gift_date = datetime.strptime(gift['date'], '%Y-%m-%d')
            amount = gift['amount']

            # Monthly patterns
            month = gift_date.strftime('%B')
            monthly_totals[month]['count'] += 1
            monthly_totals[month]['amount'] += amount

            # Day of week patterns
            weekday = gift_date.strftime('%A')
            weekday_totals[weekday]['count'] += 1
            weekday_totals[weekday]['amount'] += amount

            # Yearly trends
            year = gift_date.year
            yearly_totals[year]['count'] += 1
            yearly_totals[year]['amount'] += amount
            yearly_totals[year]['donors'].add(donor['donor_id'])

    # Calculate averages and format output
    month_order = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']

    monthly_patterns = {}
    for month in month_order:
        data = monthly_totals[month]
        monthly_patterns[month] = {
            'gift_count': data['count'],
            'total_amount': round(data['amount'], 2),
            'avg_gift': round(data['amount'] / data['count'], 2) if data['count'] > 0 else 0
        }

    weekday_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    weekday_patterns = {}
    for day in weekday_order:
        data = weekday_totals[day]
        weekday_patterns[day] = {
            'gift_count': data['count'],
            'total_amount': round(data['amount'], 2),
            'avg_gift': round(data['amount'] / data['count'], 2) if data['count'] > 0 else 0
        }

    yearly_trends = {}
    for year in sorted(yearly_totals.keys()):
        data = yearly_totals[year]
        yearly_trends[str(year)] = {
            'gift_count': data['count'],
            'total_amount': round(data['amount'], 2),
            'unique_donors': len(data['donors']),
            'avg_gift': round(data['amount'] / data['count'], 2) if data['count'] > 0 else 0
        }

    return {
        'monthly_patterns': monthly_patterns,
        'weekday_patterns': weekday_patterns,
        'yearly_trends': yearly_trends
    }

def calculate_retention_metrics(donors, reference_date):
    """
    Calculate donor retention and churn metrics.
    """
    # Define cohorts by first gift year
    cohorts = defaultdict(lambda: {'acquired': set(), 'retained': defaultdict(set)})

    for donor in donors:
        first_gift = datetime.strptime(donor['first_gift'], '%Y-%m-%d')
        last_gift = datetime.strptime(donor['last_gift'], '%Y-%m-%d')
        acquisition_year = first_gift.year

        cohorts[acquisition_year]['acquired'].add(donor['donor_id'])

        # Track retention in subsequent years
        for gift in donor.get('gifts', []):
            gift_date = datetime.strptime(gift['date'], '%Y-%m-%d')
            gift_year = gift_date.year
            if gift_year > acquisition_year:
                cohorts[acquisition_year]['retained'][gift_year].add(donor['donor_id'])

    # Calculate retention rates
    retention_matrix = {}
    for acq_year in sorted(cohorts.keys()):
        cohort = cohorts[acq_year]
        acquired_count = len(cohort['acquired'])

        retention_matrix[str(acq_year)] = {
            'acquired': acquired_count,
            'retention_rates': {}
        }

        for ret_year in sorted(cohort['retained'].keys()):
            retained_count = len(cohort['retained'][ret_year])
            rate = round((retained_count / acquired_count) * 100, 1) if acquired_count > 0 else 0
            retention_matrix[str(acq_year)]['retention_rates'][str(ret_year)] = {
                'retained_count': retained_count,
                'retention_rate': rate
            }

    # Calculate overall metrics
    active_donors = sum(1 for d in donors if (reference_date - datetime.strptime(d['last_gift'], '%Y-%m-%d')).days <= 365)
    lapsing_donors = sum(1 for d in donors if 365 < (reference_date - datetime.strptime(d['last_gift'], '%Y-%m-%d')).days <= 730)
    lapsed_donors = sum(1 for d in donors if (reference_date - datetime.strptime(d['last_gift'], '%Y-%m-%d')).days > 730)

    return {
        'cohort_retention': retention_matrix,
        'overall_metrics': {
            'active_donors': active_donors,
            'lapsing_donors': lapsing_donors,
            'lapsed_donors': lapsed_donors,
            'active_rate': round((active_donors / len(donors)) * 100, 1) if donors else 0,
            'overall_retention_rate': round((active_donors / len(donors)) * 100, 1) if donors else 0
        }
    }

def calculate_donor_value_metrics(donors):
    """
    Calculate lifetime value and donor value metrics.
    """
    gift_amounts = []
    donor_values = []
    tenure_values = []

    for donor in donors:
        if donor['total_gifts'] > 0:
            avg_gift = donor['total_amount'] / donor['total_gifts']
            gift_amounts.append(avg_gift)
            donor_values.append(donor['total_amount'])

            first = datetime.strptime(donor['first_gift'], '%Y-%m-%d')
            last = datetime.strptime(donor['last_gift'], '%Y-%m-%d')
            tenure_days = (last - first).days
            tenure_values.append(tenure_days)

    # Calculate distribution metrics
    def calculate_distribution(values):
        if not values:
            return {}
        sorted_vals = sorted(values)
        n = len(sorted_vals)
        return {
            'min': round(sorted_vals[0], 2),
            'max': round(sorted_vals[-1], 2),
            'mean': round(mean(sorted_vals), 2),
            'median': round(median(sorted_vals), 2),
            'std_dev': round(stdev(sorted_vals), 2) if len(sorted_vals) > 1 else 0,
            'p25': round(sorted_vals[int(n * 0.25)], 2),
            'p75': round(sorted_vals[int(n * 0.75)], 2),
            'p90': round(sorted_vals[int(n * 0.90)], 2),
            'p95': round(sorted_vals[int(n * 0.95)], 2)
        }

    # Segment by giving level
    giving_levels = {
        'micro': {'range': '$1-$24', 'count': 0, 'total': 0},
        'small': {'range': '$25-$99', 'count': 0, 'total': 0},
        'medium': {'range': '$100-$499', 'count': 0, 'total': 0},
        'large': {'range': '$500-$999', 'count': 0, 'total': 0},
        'major': {'range': '$1,000-$4,999', 'count': 0, 'total': 0},
        'leadership': {'range': '$5,000+', 'count': 0, 'total': 0}
    }

    for donor in donors:
        total = donor['total_amount']
        if total < 25:
            giving_levels['micro']['count'] += 1
            giving_levels['micro']['total'] += total
        elif total < 100:
            giving_levels['small']['count'] += 1
            giving_levels['small']['total'] += total
        elif total < 500:
            giving_levels['medium']['count'] += 1
            giving_levels['medium']['total'] += total
        elif total < 1000:
            giving_levels['large']['count'] += 1
            giving_levels['large']['total'] += total
        elif total < 5000:
            giving_levels['major']['count'] += 1
            giving_levels['major']['total'] += total
        else:
            giving_levels['leadership']['count'] += 1
            giving_levels['leadership']['total'] += total

    for level in giving_levels.values():
        level['total'] = round(level['total'], 2)
        level['avg'] = round(level['total'] / level['count'], 2) if level['count'] > 0 else 0

    return {
        'gift_amount_distribution': calculate_distribution(gift_amounts),
        'lifetime_value_distribution': calculate_distribution(donor_values),
        'tenure_days_distribution': calculate_distribution(tenure_values),
        'giving_levels': giving_levels
    }

def calculate_upgrade_downgrade_analysis(donors):
    """
    Analyze donor upgrade/downgrade patterns year over year.
    """
    donor_yearly_giving = defaultdict(lambda: defaultdict(lambda: {'count': 0, 'amount': 0}))

    for donor in donors:
        for gift in donor.get('gifts', []):
            year = datetime.strptime(gift['date'], '%Y-%m-%d').year
            donor_yearly_giving[donor['donor_id']][year]['count'] += 1
            donor_yearly_giving[donor['donor_id']][year]['amount'] += gift['amount']

    # Analyze year-over-year changes
    yoy_changes = defaultdict(lambda: {
        'upgraded': 0,
        'downgraded': 0,
        'stable': 0,
        'new': 0,
        'churned': 0,
        'upgrade_amount': 0,
        'downgrade_amount': 0
    })

    all_years = set()
    for donor_data in donor_yearly_giving.values():
        all_years.update(donor_data.keys())

    years = sorted(all_years)

    for i in range(1, len(years)):
        prev_year = years[i-1]
        curr_year = years[i]

        for donor_id, yearly_data in donor_yearly_giving.items():
            prev_amount = yearly_data[prev_year]['amount']
            curr_amount = yearly_data[curr_year]['amount']

            if prev_amount > 0 and curr_amount > 0:
                change_pct = ((curr_amount - prev_amount) / prev_amount) * 100
                if change_pct >= 25:
                    yoy_changes[curr_year]['upgraded'] += 1
                    yoy_changes[curr_year]['upgrade_amount'] += (curr_amount - prev_amount)
                elif change_pct <= -25:
                    yoy_changes[curr_year]['downgraded'] += 1
                    yoy_changes[curr_year]['downgrade_amount'] += (prev_amount - curr_amount)
                else:
                    yoy_changes[curr_year]['stable'] += 1
            elif prev_amount == 0 and curr_amount > 0:
                yoy_changes[curr_year]['new'] += 1
            elif prev_amount > 0 and curr_amount == 0:
                yoy_changes[curr_year]['churned'] += 1

    # Format output
    result = {}
    for year in sorted(yoy_changes.keys()):
        data = yoy_changes[year]
        result[str(year)] = {
            'upgraded': data['upgraded'],
            'downgraded': data['downgraded'],
            'stable': data['stable'],
            'new_donors': data['new'],
            'churned': data['churned'],
            'net_upgrade_value': round(data['upgrade_amount'] - data['downgrade_amount'], 2)
        }

    return result

def calculate_channel_analysis(donors):
    """
    Analyze performance by donation channel.
    """
    channel_metrics = defaultdict(lambda: {
        'donor_count': 0,
        'total_gifts': 0,
        'total_amount': 0,
        'gift_amounts': []
    })

    for donor in donors:
        channel = donor.get('channel', 'unknown')
        channel_metrics[channel]['donor_count'] += 1
        channel_metrics[channel]['total_gifts'] += donor['total_gifts']
        channel_metrics[channel]['total_amount'] += donor['total_amount']

        for gift in donor.get('gifts', []):
            channel_metrics[channel]['gift_amounts'].append(gift['amount'])

    result = {}
    for channel, data in channel_metrics.items():
        result[channel] = {
            'donor_count': data['donor_count'],
            'total_gifts': data['total_gifts'],
            'total_amount': round(data['total_amount'], 2),
            'avg_gift': round(mean(data['gift_amounts']), 2) if data['gift_amounts'] else 0,
            'avg_donor_value': round(data['total_amount'] / data['donor_count'], 2) if data['donor_count'] > 0 else 0,
            'gifts_per_donor': round(data['total_gifts'] / data['donor_count'], 2) if data['donor_count'] > 0 else 0
        }

    return result

def calculate_lapse_risk_scores(donors, rfm_scores, reference_date):
    """
    Calculate lapse risk scores for active and lapsing donors.
    """
    risk_scores = {}

    for donor in donors:
        donor_id = donor['donor_id']
        last_gift = datetime.strptime(donor['last_gift'], '%Y-%m-%d')
        days_since = (reference_date - last_gift).days

        # Skip already lapsed donors
        if days_since > 730:
            continue

        rfm = rfm_scores.get(donor_id, {})

        # Calculate risk factors
        recency_risk = min(days_since / 365, 1.0)  # 0-1 scale

        # Low frequency increases risk
        freq_risk = max(0, 1 - (donor['total_gifts'] / 10))  # More gifts = lower risk

        # Declining giving pattern check
        gifts = donor.get('gifts', [])
        if len(gifts) >= 2:
            recent_gifts = sorted(gifts, key=lambda x: x['date'], reverse=True)[:5]
            older_gifts = gifts[:-5] if len(gifts) > 5 else []

            recent_avg = mean([g['amount'] for g in recent_gifts])
            older_avg = mean([g['amount'] for g in older_gifts]) if older_gifts else recent_avg

            decline_risk = max(0, min(1, (older_avg - recent_avg) / older_avg)) if older_avg > 0 else 0
        else:
            decline_risk = 0.5  # Neutral for new donors

        # Combine factors
        risk_score = (recency_risk * 0.5) + (freq_risk * 0.3) + (decline_risk * 0.2)
        risk_score = round(risk_score * 100, 1)

        risk_category = 'low'
        if risk_score >= 70:
            risk_category = 'high'
        elif risk_score >= 40:
            risk_category = 'medium'

        risk_scores[donor_id] = {
            'risk_score': risk_score,
            'risk_category': risk_category,
            'days_since_last_gift': days_since,
            'factors': {
                'recency_risk': round(recency_risk * 100, 1),
                'frequency_risk': round(freq_risk * 100, 1),
                'decline_risk': round(decline_risk * 100, 1)
            }
        }

    # Summarize risk distribution
    risk_distribution = {'low': 0, 'medium': 0, 'high': 0}
    for data in risk_scores.values():
        risk_distribution[data['risk_category']] += 1

    return {
        'individual_scores': risk_scores,
        'risk_distribution': risk_distribution,
        'total_at_risk': risk_distribution['medium'] + risk_distribution['high']
    }

def calculate_recurring_donor_analysis(donors):
    """
    Identify and analyze recurring/monthly donors.
    """
    recurring_donors = []

    for donor in donors:
        gifts = donor.get('gifts', [])
        if len(gifts) < 3:
            continue

        # Sort gifts by date
        sorted_gifts = sorted(gifts, key=lambda x: x['date'])

        # Calculate intervals between gifts
        intervals = []
        for i in range(1, len(sorted_gifts)):
            d1 = datetime.strptime(sorted_gifts[i-1]['date'], '%Y-%m-%d')
            d2 = datetime.strptime(sorted_gifts[i]['date'], '%Y-%m-%d')
            intervals.append((d2 - d1).days)

        if not intervals:
            continue

        avg_interval = mean(intervals)
        interval_std = stdev(intervals) if len(intervals) > 1 else 0

        # Detect monthly pattern (25-35 days with low variance)
        is_monthly = 25 <= avg_interval <= 35 and interval_std < 10

        # Detect quarterly pattern
        is_quarterly = 80 <= avg_interval <= 100 and interval_std < 20

        # Detect annual pattern
        is_annual = 350 <= avg_interval <= 380 and interval_std < 30

        if is_monthly or is_quarterly or is_annual:
            pattern = 'monthly' if is_monthly else ('quarterly' if is_quarterly else 'annual')
            recurring_donors.append({
                'donor_id': donor['donor_id'],
                'pattern': pattern,
                'avg_interval_days': round(avg_interval, 1),
                'total_recurring_gifts': len(sorted_gifts),
                'total_recurring_amount': round(donor['total_amount'], 2),
                'avg_gift': round(donor['total_amount'] / donor['total_gifts'], 2)
            })

    # Summarize
    pattern_summary = defaultdict(lambda: {'count': 0, 'total_amount': 0})
    for rd in recurring_donors:
        pattern_summary[rd['pattern']]['count'] += 1
        pattern_summary[rd['pattern']]['total_amount'] += rd['total_recurring_amount']

    return {
        'recurring_donors': recurring_donors,
        'pattern_summary': {
            pattern: {
                'count': data['count'],
                'total_amount': round(data['total_amount'], 2)
            }
            for pattern, data in pattern_summary.items()
        },
        'total_recurring_donors': len(recurring_donors),
        'recurring_revenue': round(sum(d['total_recurring_amount'] for d in recurring_donors), 2)
    }

def generate_executive_summary(layer1_summary, retention, rfm_segments, value_metrics, risk_analysis):
    """
    Generate an executive summary of key insights.
    """
    total_donors = layer1_summary['total_donors']

    # Calculate key metrics
    champion_count = len(rfm_segments.get('champions', []))
    at_risk_count = len(rfm_segments.get('at_risk', [])) + len(rfm_segments.get('cant_lose', []))

    return {
        'key_metrics': {
            'total_donors': total_donors,
            'total_revenue': layer1_summary['total_revenue'],
            'active_donor_rate': retention['overall_metrics']['active_rate'],
            'avg_donor_value': round(layer1_summary['total_revenue'] / total_donors, 2),
            'avg_gift_size': value_metrics['gift_amount_distribution']['mean']
        },
        'health_indicators': {
            'champion_donors': champion_count,
            'champion_percentage': round((champion_count / total_donors) * 100, 1),
            'high_value_at_risk': at_risk_count,
            'total_at_risk': risk_analysis['total_at_risk'],
            'lapsed_donors': retention['overall_metrics']['lapsed_donors']
        },
        'opportunities': {
            'reactivation_pool': retention['overall_metrics']['lapsing_donors'],
            'upgrade_candidates': len(rfm_segments.get('potential_loyalists', [])),
            'stewardship_priority': len(rfm_segments.get('loyal_customers', []))
        },
        'alerts': []
    }

def generate_layer2_insights(layer1_path="donor_data_layer1.json", output_path="donor_data_layer2.json"):
    """
    Main function to generate all Layer 2 computed insights.
    """
    print("Loading Layer 1 data...")
    layer1 = load_layer1_data(layer1_path)

    donors = layer1.get('donors', [])
    summary = layer1.get('summary', {})
    reference_date = datetime.strptime(layer1.get('generated', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d')

    print(f"Processing {len(donors)} donors...")

    print("Calculating RFM scores...")
    rfm_scores = calculate_rfm_scores(donors, reference_date)

    print("Segmenting donors...")
    segments = segment_donors_by_rfm(rfm_scores)

    print("Analyzing giving patterns...")
    giving_patterns = calculate_giving_patterns(donors)

    print("Calculating retention metrics...")
    retention = calculate_retention_metrics(donors, reference_date)

    print("Calculating value metrics...")
    value_metrics = calculate_donor_value_metrics(donors)

    print("Analyzing upgrades/downgrades...")
    upgrade_analysis = calculate_upgrade_downgrade_analysis(donors)

    print("Analyzing channels...")
    channel_analysis = calculate_channel_analysis(donors)

    print("Calculating lapse risk scores...")
    risk_analysis = calculate_lapse_risk_scores(donors, rfm_scores, reference_date)

    print("Analyzing recurring donors...")
    recurring_analysis = calculate_recurring_donor_analysis(donors)

    print("Generating executive summary...")
    executive_summary = generate_executive_summary(
        summary, retention, segments, value_metrics, risk_analysis
    )

    # Add alerts based on analysis
    if retention['overall_metrics']['active_rate'] < 20:
        executive_summary['alerts'].append({
            'severity': 'high',
            'message': f"Low active donor rate ({retention['overall_metrics']['active_rate']}%). Consider reactivation campaigns."
        })

    if risk_analysis['risk_distribution']['high'] > len(donors) * 0.1:
        executive_summary['alerts'].append({
            'severity': 'medium',
            'message': f"{risk_analysis['risk_distribution']['high']} donors at high risk of lapsing. Prioritize retention outreach."
        })

    # Compile Layer 2 output
    layer2 = {
        'generated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'layer1_reference': layer1_path,
        'analysis_period': {
            'reference_date': reference_date.strftime('%Y-%m-%d'),
            'donors_analyzed': len(donors)
        },
        'executive_summary': executive_summary,
        'rfm_analysis': {
            'methodology': 'Quintile-based RFM scoring (1-5 scale)',
            'scores': rfm_scores,
            'segments': {
                segment: {
                    'count': len(donor_ids),
                    'percentage': round((len(donor_ids) / len(donors)) * 100, 1),
                    'donor_ids': donor_ids
                }
                for segment, donor_ids in segments.items()
            }
        },
        'giving_patterns': giving_patterns,
        'retention_analysis': retention,
        'value_analysis': value_metrics,
        'upgrade_downgrade_analysis': upgrade_analysis,
        'channel_performance': channel_analysis,
        'lapse_risk_analysis': {
            'risk_distribution': risk_analysis['risk_distribution'],
            'total_at_risk': risk_analysis['total_at_risk'],
            'high_risk_donors': [
                donor_id for donor_id, data in risk_analysis['individual_scores'].items()
                if data['risk_category'] == 'high'
            ],
            'detailed_scores': risk_analysis['individual_scores']
        },
        'recurring_donor_analysis': recurring_analysis
    }

    print(f"Writing Layer 2 insights to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(layer2, f, indent=2)

    print("\n" + "="*60)
    print("LAYER 2 INSIGHTS GENERATION COMPLETE")
    print("="*60)
    print(f"\nKey Findings:")
    print(f"  - Total donors analyzed: {len(donors):,}")
    print(f"  - Active donor rate: {retention['overall_metrics']['active_rate']}%")
    print(f"  - Champion donors: {len(segments['champions']):,}")
    print(f"  - High-risk donors: {risk_analysis['risk_distribution']['high']:,}")
    print(f"  - Recurring donors identified: {recurring_analysis['total_recurring_donors']:,}")
    print(f"\nSegment Distribution:")
    for segment, donor_ids in segments.items():
        if donor_ids:
            print(f"  - {segment.replace('_', ' ').title()}: {len(donor_ids):,} ({round(len(donor_ids)/len(donors)*100, 1)}%)")
    print(f"\nOutput saved to: {output_path}")

    return layer2

if __name__ == "__main__":
    generate_layer2_insights()
