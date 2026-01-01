import React, { useState, useMemo, useEffect, useRef } from 'react';
import useDataStore from '../../store/dataStore';

/**
 * DonorListPanel - Slide-out panel displaying a list of donors with drill-down capabilities
 * Features: sortable columns, search, CSV export, inline detail expansion
 */
const DonorListPanel = () => {
  const { drillDownPanel, closeDrillDownPanel, filters, getDateRangeLabel } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('total_amount');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedDonorId, setExpandedDonorId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const panelRef = useRef(null);

  // Reset state when panel opens/closes
  useEffect(() => {
    if (drillDownPanel.isOpen) {
      setSearchTerm('');
      setSortField('total_amount');
      setSortDirection('desc');
      setExpandedDonorId(null);
      setCurrentPage(1);
    }
  }, [drillDownPanel.isOpen]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && drillDownPanel.isOpen) {
        closeDrillDownPanel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [drillDownPanel.isOpen, closeDrillDownPanel]);

  // Focus trap within panel
  useEffect(() => {
    if (drillDownPanel.isOpen && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTab = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [drillDownPanel.isOpen]);

  // Calculate donor metrics for display
  const donorsWithMetrics = useMemo(() => {
    return drillDownPanel.donors.map(donor => {
      const gifts = donor.gifts || [];
      const totalAmount = gifts.reduce((sum, gift) => sum + gift.amount, 0);
      const totalGifts = gifts.length;
      const lastGift = gifts.length > 0
        ? new Date(Math.max(...gifts.map(g => new Date(g.date))))
        : null;
      const firstGift = donor.first_gift ? new Date(donor.first_gift) : null;
      const daysSinceLastGift = lastGift
        ? Math.floor((new Date() - lastGift) / (1000 * 60 * 60 * 24))
        : null;

      // Determine status
      let status = 'active';
      if (daysSinceLastGift !== null) {
        if (daysSinceLastGift > 730) status = 'lapsed';
        else if (daysSinceLastGift > 365) status = 'lapsing';
      }

      return {
        ...donor,
        total_amount: totalAmount,
        total_gifts: totalGifts,
        last_gift_date: lastGift,
        first_gift_date: firstGift,
        days_since_last_gift: daysSinceLastGift,
        status
      };
    });
  }, [drillDownPanel.donors]);

  // Filter donors by search term
  const filteredDonors = useMemo(() => {
    if (!searchTerm.trim()) return donorsWithMetrics;

    const term = searchTerm.toLowerCase();
    return donorsWithMetrics.filter(donor => {
      return (
        donor.donor_id?.toLowerCase().includes(term) ||
        donor.email?.toLowerCase().includes(term) ||
        donor.name?.toLowerCase().includes(term)
      );
    });
  }, [donorsWithMetrics, searchTerm]);

  // Sort donors
  const sortedDonors = useMemo(() => {
    const sorted = [...filteredDonors];

    sorted.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'donor_id':
          aVal = a.donor_id || '';
          bVal = b.donor_id || '';
          break;
        case 'total_gifts':
          aVal = a.total_gifts;
          bVal = b.total_gifts;
          break;
        case 'total_amount':
          aVal = a.total_amount;
          bVal = b.total_amount;
          break;
        case 'last_gift_date':
          aVal = a.last_gift_date ? a.last_gift_date.getTime() : 0;
          bVal = b.last_gift_date ? b.last_gift_date.getTime() : 0;
          break;
        case 'days_since_last_gift':
          aVal = a.days_since_last_gift || 0;
          bVal = b.days_since_last_gift || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredDonors, sortField, sortDirection]);

  // Paginate donors
  const paginatedDonors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedDonors.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedDonors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedDonors.length / itemsPerPage);

  // Handle column header click for sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Donor ID',
      'Email',
      'Total Gifts',
      'Total Amount',
      'Last Gift Date',
      'Days Since Last Gift',
      'Status',
      'First Gift Date'
    ];

    const rows = sortedDonors.map(donor => [
      donor.donor_id || '',
      donor.email || '',
      donor.total_gifts,
      donor.total_amount.toFixed(2),
      donor.last_gift_date ? donor.last_gift_date.toLocaleDateString() : '',
      donor.days_since_last_gift !== null ? donor.days_since_last_gift : '',
      donor.status,
      donor.first_gift_date ? donor.first_gift_date.toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `donors-${drillDownPanel.filter || 'export'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle donor detail expansion
  const toggleExpanded = (donorId) => {
    setExpandedDonorId(expandedDonorId === donorId ? null : donorId);
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-800',
      lapsing: 'bg-amber-100 text-amber-800',
      lapsed: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Sort indicator component
  const SortIndicator = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (!drillDownPanel.isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={closeDrillDownPanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 id="panel-title" className="text-xl font-bold truncate">
              {drillDownPanel.title}
            </h2>
            {filters.dateRange && (
              <p className="text-sm text-indigo-100 mt-1">
                Filtered to {getDateRangeLabel()}
              </p>
            )}
          </div>
          <button
            onClick={closeDrillDownPanel}
            className="ml-4 p-2 hover:bg-indigo-700 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search donors by ID or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                aria-label="Search donors"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {sortedDonors.length.toLocaleString()} donor{sortedDonors.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium text-slate-700"
              aria-label="Export to CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {sortedDonors.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No donors found</h3>
                <p className="text-slate-600">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No donors in this segment'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="w-12 px-4 py-3"></th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('donor_id')}
                    >
                      <div className="flex items-center gap-2">
                        Donor ID
                        <SortIndicator field="donor_id" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('total_gifts')}
                    >
                      <div className="flex items-center gap-2">
                        Total Gifts
                        <SortIndicator field="total_gifts" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('total_amount')}
                    >
                      <div className="flex items-center gap-2">
                        Total Amount
                        <SortIndicator field="total_amount" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('last_gift_date')}
                    >
                      <div className="flex items-center gap-2">
                        Last Gift
                        <SortIndicator field="last_gift_date" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('days_since_last_gift')}
                    >
                      <div className="flex items-center gap-2">
                        Days Since
                        <SortIndicator field="days_since_last_gift" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <SortIndicator field="status" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedDonors.map((donor) => (
                    <React.Fragment key={donor.donor_id}>
                      <tr
                        className={`hover:bg-slate-50 transition-colors ${expandedDonorId === donor.donor_id ? 'bg-indigo-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleExpanded(donor.donor_id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                            aria-label={expandedDonorId === donor.donor_id ? 'Collapse details' : 'Expand details'}
                            aria-expanded={expandedDonorId === donor.donor_id}
                          >
                            <svg
                              className={`w-5 h-5 text-slate-600 transition-transform ${expandedDonorId === donor.donor_id ? 'transform rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {donor.donor_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {donor.email || <span className="text-slate-400 italic">No email</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {donor.total_gifts.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          ${donor.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {donor.last_gift_date ? donor.last_gift_date.toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {donor.days_since_last_gift !== null ? donor.days_since_last_gift.toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getStatusBadge(donor.status)}
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expandedDonorId === donor.donor_id && (
                        <tr>
                          <td colSpan="8" className="px-4 py-6 bg-slate-50 border-t border-slate-200">
                            <div className="max-w-5xl">
                              <h4 className="text-sm font-semibold text-slate-900 mb-4">Gift History</h4>

                              {/* Donor Info */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">First Gift</p>
                                  <p className="text-sm font-medium text-slate-900">
                                    {donor.first_gift_date ? donor.first_gift_date.toLocaleDateString() : 'Unknown'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Most Recent</p>
                                  <p className="text-sm font-medium text-slate-900">
                                    {donor.last_gift_date ? donor.last_gift_date.toLocaleDateString() : 'Unknown'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Average Gift</p>
                                  <p className="text-sm font-medium text-slate-900">
                                    ${donor.total_gifts > 0 ? (donor.total_amount / donor.total_gifts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Anonymous</p>
                                  <p className="text-sm font-medium text-slate-900">
                                    {donor.is_anonymous ? 'Yes' : 'No'}
                                  </p>
                                </div>
                              </div>

                              {/* Gift Table */}
                              {donor.gifts && donor.gifts.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Amount</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Campaign</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                      {[...donor.gifts].sort((a, b) => new Date(b.date) - new Date(a.date)).map((gift, idx) => (
                                        <tr key={idx}>
                                          <td className="px-3 py-2 text-slate-600">
                                            {new Date(gift.date).toLocaleDateString()}
                                          </td>
                                          <td className="px-3 py-2 font-medium text-slate-900">
                                            ${gift.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="px-3 py-2 text-slate-600">
                                            {gift.campaign || <span className="text-slate-400 italic">Not specified</span>}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 italic">No gift history available</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedDonors.length)} of {sortedDonors.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      aria-label="Previous page"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DonorListPanel;
