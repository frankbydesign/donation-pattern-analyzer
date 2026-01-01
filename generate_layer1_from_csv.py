#!/usr/bin/env python3
"""
Layer 1 Data Generator for Donation Pattern Analyzer

Converts raw CSV donation data into Layer 1 donor-centric JSON structure.
Includes:
- anon_email field for each donor
- is_anonymous boolean flag to identify anonymous donors
- Excludes channel field (as requested)
"""

import json
import csv
from datetime import datetime
from collections import defaultdict


def parse_amount(amount_str):
    """Convert currency string to float."""
    return float(amount_str.replace('$', '').replace(',', ''))


def is_anonymous_donor(donor_name, donor_email):
    """Determine if a donor is anonymous based on naming pattern."""
    return donor_name.startswith('anon_') or donor_email.startswith('anon_')


def generate_layer1_from_csv(csv_path="dataset_anon.csv", output_path="donor_data_layer1.json"):
    """
    Convert CSV donation data to Layer 1 JSON structure.

    CSV columns: Donation_date, Donation_amount_USD, anon_donor_name, anon_email
    """
    print(f"Reading CSV data from {csv_path}...")

    # Read CSV and organize by donor
    donor_data = defaultdict(lambda: {
        'gifts': [],
        'anon_email': None,
        'is_anonymous': False
    })

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            donor_name = row['anon_donor_name']
            donor_email = row['anon_email']
            amount = parse_amount(row['Donation_amount_USD'])

            # Parse date (MM/DD/YY format)
            date_str = row['Donation_date']
            try:
                # Try MM/DD/YY format first
                date_obj = datetime.strptime(date_str, '%m/%d/%y')
            except ValueError:
                try:
                    # Try other common formats
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                except ValueError:
                    print(f"Warning: Could not parse date {date_str}")
                    continue

            formatted_date = date_obj.strftime('%Y-%m-%d')

            # Store gift
            donor_data[donor_name]['gifts'].append({
                'date': formatted_date,
                'amount': amount
            })

            # Store email and check if anonymous
            if donor_data[donor_name]['anon_email'] is None:
                donor_data[donor_name]['anon_email'] = donor_email
                donor_data[donor_name]['is_anonymous'] = is_anonymous_donor(donor_name, donor_email)

    print(f"Processing {len(donor_data)} unique donors...")

    # Calculate donor-level metrics
    donors = []
    status_breakdown = {'active': 0, 'lapsing': 0, 'lapsed': 0}
    monthly_givers = 0
    total_donations = 0
    total_revenue = 0

    reference_date = datetime.now()

    for donor_id, data in donor_data.items():
        gifts = sorted(data['gifts'], key=lambda x: x['date'])

        if not gifts:
            continue

        first_gift = gifts[0]['date']
        last_gift = gifts[-1]['date']
        total_gifts = len(gifts)
        total_amount = sum(g['amount'] for g in gifts)

        # Calculate status (active/lapsing/lapsed)
        # active = gave in last 12 months
        # lapsing = 12-24 months
        # lapsed = 24+ months
        last_gift_date = datetime.strptime(last_gift, '%Y-%m-%d')
        days_since_last = (reference_date - last_gift_date).days

        if days_since_last <= 365:
            status = 'active'
            status_breakdown['active'] += 1
        elif days_since_last <= 730:
            status = 'lapsing'
            status_breakdown['lapsing'] += 1
        else:
            status = 'lapsed'
            status_breakdown['lapsed'] += 1

        # Check for monthly giving pattern (simplified)
        # A donor is considered "monthly" if they have at least 3 gifts
        # and average interval is roughly 30 days
        is_monthly = False
        if total_gifts >= 3:
            intervals = []
            for i in range(1, len(gifts)):
                d1 = datetime.strptime(gifts[i-1]['date'], '%Y-%m-%d')
                d2 = datetime.strptime(gifts[i]['date'], '%Y-%m-%d')
                intervals.append((d2 - d1).days)

            if intervals:
                avg_interval = sum(intervals) / len(intervals)
                # Consider monthly if average interval is 20-40 days
                if 20 <= avg_interval <= 40:
                    is_monthly = True
                    monthly_givers += 1

        donor_record = {
            'donor_id': donor_id,
            'anon_email': data['anon_email'],
            'is_anonymous': data['is_anonymous'],
            'first_gift': first_gift,
            'last_gift': last_gift,
            'total_gifts': total_gifts,
            'total_amount': round(total_amount, 2),
            'gifts': gifts
        }

        donors.append(donor_record)
        total_donations += total_gifts
        total_revenue += total_amount

    # Create Layer 1 structure
    layer1 = {
        'generated': datetime.now().strftime('%Y-%m-%d'),
        'summary': {
            'total_donors': len(donors),
            'status_breakdown': status_breakdown,
            'monthly_givers': monthly_givers,
            'total_donations': total_donations,
            'total_revenue': round(total_revenue, 2)
        },
        'donors': donors
    }

    print(f"Writing Layer 1 data to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(layer1, f, indent=2)

    print("\n" + "="*60)
    print("LAYER 1 DATA GENERATION COMPLETE")
    print("="*60)
    print(f"\nSummary:")
    print(f"  - Total donors: {len(donors):,}")
    print(f"  - Active donors: {status_breakdown['active']:,}")
    print(f"  - Lapsing donors: {status_breakdown['lapsing']:,}")
    print(f"  - Lapsed donors: {status_breakdown['lapsed']:,}")
    print(f"  - Monthly givers: {monthly_givers:,}")
    print(f"  - Total donations: {total_donations:,}")
    print(f"  - Total revenue: ${total_revenue:,.2f}")

    # Count anonymous donors
    anon_count = sum(1 for d in donors if d['is_anonymous'])
    print(f"  - Anonymous donors: {anon_count:,} ({round(anon_count/len(donors)*100, 1)}%)")

    print(f"\nOutput saved to: {output_path}")

    return layer1


if __name__ == "__main__":
    generate_layer1_from_csv()
