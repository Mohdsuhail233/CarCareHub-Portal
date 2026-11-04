import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  MoreVertical,
  Eye,
  Car,
  Phone,
  MapPin,
  Users,
  User,
} from 'lucide-react';

export default function CustomersPage({
  customers = [],
  vehicles = [],
  loading = false,
  onAddCustomer,
  onViewCustomer,
  toast,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Map vehicles per customer
  const customerVehiclesMap = useMemo(() => {
    const map = {};
    (vehicles || []).forEach((v) => {
      const cId = v.customerId;
      if (!cId) return;
      if (!map[cId]) map[cId] = [];
      map[cId].push(v);
    });
    return map;
  }, [vehicles]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return (customers || []).filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const name = (c.fullName || c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phoneNumber || c.phone || '').toLowerCase();
      const address = (c.address || '').toLowerCase();
      const custVehicles = (customerVehiclesMap[c.id] || [])
        .map((v) => (v.registrationNumber || '') + ' ' + (v.model || ''))
        .join(' ')
        .toLowerCase();

      return (
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        address.includes(q) ||
        custVehicles.includes(q)
      );
    });
  }, [customers, searchQuery, customerVehiclesMap]);

  // Export CSV function
  const handleDownloadAll = () => {
    if (!customers || customers.length === 0) {
      if (toast) toast('No customer data available to export');
      return;
    }
    const headers = ['Customer ID', 'Full Name', 'Phone Number', 'Email', 'Vehicles Owned', 'Address'];
    const rows = (filteredCustomers.length > 0 ? filteredCustomers : customers).map((c) => {
      const vList = (customerVehiclesMap[c.id] || [])
        .map((v) => v.registrationNumber + (v.model ? ` (${v.model})` : ''))
        .join('; ');
      return [
        `#${c.id}`,
        c.fullName || c.name || '—',
        c.phoneNumber || c.phone || '—',
        c.email || '—',
        vList || 'None',
        c.address || '—',
      ];
    });

    const csvContent = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (toast) toast('Customer records exported successfully');
  };

  return (
    <div className="modern-customers-page">
      {/* 1. UNIFIED HEADER: TITLE, SEARCH, DOWNLOAD, & ADD CUSTOMER */}
      <div className="modern-cust-top-header">
        <div className="modern-cust-header-left">
          <h2 className="all-customers-heading">
            <Users size={22} className="heading-icon" />
            <span>All customers</span>{' '}
            <span className="all-customers-count">
              ({loading ? '...' : (customers?.length || 0).toLocaleString()})
            </span>
          </h2>
          <p className="all-customers-sub">
            Companies and garage clients registered in your system.
          </p>
        </div>

        <div className="modern-cust-header-actions">
          {/* Search bar directly beside actions */}
          <div className="modern-cust-top-search-wrap">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button className="modern-download-all-btn" onClick={handleDownloadAll} title="Export CSV">
            <Download size={15} />
            <span>Download all</span>
          </button>

          <button
            className="modern-add-customer-btn"
            onClick={onAddCustomer}
            title="Register new customer and vehicle"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add customer</span>
          </button>
        </div>
      </div>

      {/* 2. MODERN TABLE */}
      <div className="modern-cust-table-card">
        <div className="modern-cust-table-container">
          <table className="modern-cust-table">
            <thead>
              <tr>
                <th className="th-customer">
                  <div className="th-sort-label">
                    <User size={14} className="th-icon" />
                    <span>Customer</span>
                    <span className="th-sort-icon">↓</span>
                  </div>
                </th>
                <th className="th-about">About / Registered Vehicles</th>
                <th className="th-contact">Contact Details</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="modern-cust-empty-row">
                    <div className="empty-state-content">
                      <Users size={32} strokeWidth={1.5} color="#94a3b8" />
                      <p className="empty-title">No customers found</p>
                      <p className="empty-subtitle">
                        {searchQuery
                          ? `No customer records matched "${searchQuery}".`
                          : 'You have not registered any customers yet.'}
                      </p>
                      {searchQuery && (
                        <button
                          className="reset-search-link"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const custVehs = customerVehiclesMap[cust.id] || [];
                  const isMenuOpen = activeMenuId === cust.id;

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setActiveMenuId(null)}
                    >
                      {/* Customer / Company */}
                      <td className="td-customer">
                        <div className="cust-identity-text">
                          <span className="cust-name-main">
                            <User size={14} className="cust-user-icon" />
                            {cust.fullName || cust.name || 'Unnamed Client'}
                          </span>
                          <span className="cust-email-sub">
                            {cust.email || (cust.phoneNumber ? cust.phoneNumber : 'No email')}
                          </span>
                        </div>
                      </td>

                      {/* About / Vehicles */}
                      <td className="td-about">
                        <div className="cust-about-cell">
                          <div className="cust-about-title">
                            {custVehs.length > 0 ? (
                              <span className="cust-vehicles-text">
                                <Car size={13} className="about-car-icon" />
                                {custVehs.map((v) => v.registrationNumber).join(', ')}
                              </span>
                            ) : (
                              <span className="cust-vehicles-none">No vehicle linked</span>
                            )}
                          </div>
                          <div className="cust-about-desc">
                            {cust.address ? (
                              <span className="cust-address-text" title={cust.address}>
                                <MapPin size={11} className="about-pin-icon" /> {cust.address}
                              </span>
                            ) : (
                              <span className="cust-desc-default">Direct garage client</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="td-contact">
                        <div className="cust-contact-cell">
                          {cust.phoneNumber ? (
                            <div className="contact-item">
                              <Phone size={12} color="#64748b" />
                              <span>{cust.phoneNumber}</span>
                            </div>
                          ) : (
                            <span className="contact-empty">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                        <div className="action-cell-wrap">
                          <button
                            className="action-menu-trigger"
                            onClick={() =>
                              setActiveMenuId((prev) => (prev === cust.id ? null : cust.id))
                            }
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {isMenuOpen && (
                            <div className="modern-action-dropdown">
                              <button
                                className="dropdown-action-btn"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (onViewCustomer) onViewCustomer(cust);
                                }}
                              >
                                <Eye size={14} />
                                <span>View Details</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
