import React, { useEffect, useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, Car, Wrench, Package, ArrowLeftRight,
  Receipt, Wallet, IndianRupee, CalendarClock, Bell, ChartNoAxesCombined,
  Search, Plus, ChevronDown, ChevronRight, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertTriangle,
  Menu, X, Download, Filter, Send, FileText, Check, Trash2, LogOut, Pencil
} from 'lucide-react';
import { api } from './api';
import ReportsPage from './ReportsPage';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import CustomersPage from './CustomersPage';

const nav = [
  ['Dashboard', LayoutDashboard],
  ['Customers', Users],
  ['Vehicles', Car],
  ['Service Jobs', Wrench],
  ['Spare Parts', Package],
  ['Invoices', Receipt],
  ['Payments', Wallet],
  ['Expenses', IndianRupee],
  ['Service Reminders', CalendarClock],
  ['Notifications', Bell],
  ['Reports', ChartNoAxesCombined],
];

const VALID_PAGES = nav.map((n) => n[0]);

const getInitialPage = () => {
  try {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    if (hash) {
      const found = VALID_PAGES.find(
        (p) =>
          p.toLowerCase().replaceAll(' ', '-') === hash ||
          p.toLowerCase().replaceAll(' ', '') === hash
      );
      if (found) return found;
    }
    const saved = localStorage.getItem('cch_active_page');
    if (saved && VALID_PAGES.includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('Error reading initial page:', e);
  }
  return 'Dashboard';
};

const statusClass = (s) => ({
  'In Progress': 'blue',
  'IN_PROGRESS': 'blue',
  'Inspecting': 'yellow',
  'INSPECTION': 'yellow',
  'RECEIVED': 'blue',
  'AWAITING_APPROVAL': 'yellow',
  'Ready for Delivery': 'purple',
  'READY': 'purple',
  'Completed': 'green',
  'COMPLETED': 'green',
  'Paid': 'green',
  'PAID': 'green',
  'Partially Paid': 'yellow',
  'PARTIALLY_PAID': 'yellow',
  'Pending': 'red',
  'DRAFT': 'yellow',
  'ISSUED': 'blue',
  'Active': 'green',
  'Success': 'green',
  'SUCCESS': 'green',
  'Upcoming': 'blue',
  'Delivered': 'green',
  'DELIVERED': 'green',
  'Read': 'green',
  'READ': 'green',
  'PETROL': 'blue',
  'Petrol': 'blue',
  'DIESEL': 'yellow',
  'Diesel': 'yellow',
  'CNG': 'green',
  'ELECTRIC': 'purple',
  'EV': 'purple',
  'Sent': 'blue',
  'SENT': 'blue',
  'Failed': 'red',
  'FAILED': 'red',
  'CANCELLED': 'red',
  'Cancelled': 'red',
  'Stock In': 'green',
  'PURCHASE': 'green',
  'Stock Out': 'yellow',
  'JOB_USAGE': 'yellow',
  'COUNTER_SALE': 'yellow'
}[s] || 'gray');

function Badge({ children }) {
  return <span className={'badge ' + statusClass(children)}>{children}</span>;
}

function TablePage({ page, data, loading, onAdd, onView, onRefresh, onUpdateStatus, invoices, toast, onCollectPayment, onSendReminder, sendingReminderId }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const rows = useMemo(() => {
    return (data?.rows || [])
      .filter((r) => r.join(' ').toLowerCase().includes(query.toLowerCase()))
      .filter((r) => {
        if (filter === 'All' || !data.cols.includes('Status')) return true;
        const statusIdx = data.cols.indexOf('Status');
        return r[statusIdx] === filter;
      });
  }, [data, query, filter]);

  const statusOptions = useMemo(() => {
    if (!data?.cols.includes('Status')) return [];
    const statusIdx = data.cols.indexOf('Status');
    return [...new Set((data?.rows || []).map((r) => r[statusIdx]).filter(Boolean))];
  }, [data]);

  const exportCsv = () => {
    if (!data?.rows?.length) return;
    const csv = [data.cols, ...rows]
      .map((r) => r.map((v) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = page.toLowerCase().replaceAll(' ', '-') + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV exported successfully');
  };

  return (
    <>
      <div className="toolbar">
        <div className="table-search">
          <Search size={16} />
          <input
            placeholder={`Search ${page.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {statusOptions.length > 0 && page !== 'Spare Parts' && (
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option>
            {statusOptions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        )}

        <button className="outline" onClick={exportCsv}>
          <Download size={15} /> Export
        </button>

        {page !== 'Notifications' && (
          <button className="primary" onClick={() => onAdd(page)}>
            <Plus size={16} /> Add{' '}
            {page === 'Customers'
              ? 'Customer & Vehicle'
              : page === 'Service Jobs'
                ? 'Service Job'
                : page === 'Spare Parts'
                  ? 'Spare Part'
                  : page === 'Service Reminders'
                    ? 'Reminder'
                    : page.slice(0, -1)}
          </button>
        )}
      </div>

      <section className="panel table-panel">
        <div className="panel-title">
          <div>
            <h3>{page} List</h3>
            <p>Manage and view all live {page.toLowerCase()} records.</p>
          </div>
          <span className="record-count">
            {loading ? 'Loading...' : `${rows.length} records`}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {(data?.cols || []).map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rawItem = data?.raw?.[i] || {};
                return (
                  <tr key={i}>
                    {r.map((v, j) => {
                      const colName = data.cols[j];
                      if (colName === 'Status') {
                        if (page === 'Service Jobs') {
                          const isInvoiced = (invoices || []).some((inv) => inv.serviceJobId === rawItem.id);
                          return (
                            <td key={j}>
                              <select
                                className={'status-badge-select ' + statusClass(v)}
                                value={v}
                                disabled={isInvoiced}
                                onChange={(e) => onUpdateStatus && onUpdateStatus(rawItem, e.target.value)}
                                title={isInvoiced ? 'Job is already invoiced and finalized' : 'Click to change status'}
                              >
                                {['RECEIVED', 'INSPECTION', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                              {isInvoiced && (
                                <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                                  Invoiced
                                </span>
                              )}
                            </td>
                          );
                        }
                        return (
                          <td key={j}>
                            <Badge>{v}</Badge>
                          </td>
                        );
                      }
                      if (colName === 'Movement') {
                        return (
                          <td key={j}>
                            <Badge>{v}</Badge>
                          </td>
                        );
                      }
                      if (colName === 'Fuel Type') {
                        return (
                          <td key={j}>
                            <Badge>{v}</Badge>
                          </td>
                        );
                      }
                      if (colName === 'Reg. Number') {
                        return (
                          <td key={j} className="vehicle-reg-cell">
                            <span className="vehicle-reg-badge">
                              <Car size={14} className="vehicle-reg-icon" />
                              {v}
                            </span>
                          </td>
                        );
                      }
                      if (colName === 'Complaint / Service') {
                        return (
                          <td key={j} className="complaint-cell" title={v}>
                            <span className="complaint-text-truncate">{v}</span>
                          </td>
                        );
                      }
                      if (colName === 'Job No.' || colName === 'Delivery Date' || colName === 'Vehicle' || colName === 'Odometer') {
                        return (
                          <td key={j} className="nowrap-cell">
                            {v}
                          </td>
                        );
                      }
                      return <td key={j}>{v}</td>;
                    })}
                    <td className="action-cell-td">
                      {page === 'Service Reminders' && (
                        <button
                          className="outline"
                          style={{
                            padding: '4px 9px',
                            fontSize: '11px',
                            marginRight: '6px',
                            borderColor: '#25D366',
                            color: '#128C7E',
                            background: '#f0fdf4',
                            fontWeight: 600,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          disabled={sendingReminderId === rawItem.id}
                          onClick={() => onSendReminder && onSendReminder(rawItem.id)}
                          title="Send WhatsApp Service Reminder"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          {sendingReminderId === rawItem.id ? 'Sending...' : 'WhatsApp'}
                        </button>
                      )}
                      {page === 'Invoices' && rawItem.status !== 'PAID' && rawItem.status !== 'CANCELLED' && (
                        <button
                          className="outline"
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            marginRight: '6px',
                            borderColor: '#10b981',
                            color: '#059669',
                            background: '#ecfdf5',
                            fontWeight: 600,
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          onClick={() => (onCollectPayment ? onCollectPayment(rawItem) : onAdd('Payments', rawItem))}
                          title="Record payment for this invoice"
                        >
                          <Wallet size={12} /> Collect
                        </button>
                      )}
                      <button className="text-btn view-details-btn" onClick={() => onView(r, i)}>
                        View details <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && rows.length === 0 && (
            <div className="empty">No matching records found in database.</div>
          )}
          {loading && (
            <div className="empty" style={{ color: '#175cc9' }}>
              Fetching latest records from backend...
            </div>
          )}
        </div>

        <div className="pagination">
          <span>
            Showing {rows.length} of {data?.rows?.length || 0} records
          </span>
          <div>
            <button disabled>Previous</button>
            <button className="current">1</button>
            <button disabled>Next</button>
          </div>
        </div>
      </section>
    </>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function getUserInitials(name, email) {
  if (name && typeof name === 'string' && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && typeof email === 'string') {
    return email.slice(0, 2).toUpperCase();
  }
  return 'GO';
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('cch_auth_token'));
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cch_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [page, setPage] = useState(getInitialPage);

  // Sync active page with localStorage and URL hash for persistent refresh
  useEffect(() => {
    if (page) {
      try {
        localStorage.setItem('cch_active_page', page);
        const slug = page.toLowerCase().replaceAll(' ', '-');
        if (window.location.hash.replace(/^#\/?/, '') !== slug) {
          window.history.replaceState(null, '', `#${slug}`);
        }
      } catch (e) {}
    }
  }, [page]);

  // Handle browser back/forward or hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
      if (hash) {
        const found = VALID_PAGES.find(
          (p) =>
            p.toLowerCase().replaceAll(' ', '-') === hash ||
            p.toLowerCase().replaceAll(' ', '') === hash
        );
        if (found && found !== page) {
          setPage(found);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [page]);
  const [mobile, setMobile] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const displayName = currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Faiz Khan';
  const userInitials = getUserInitials(displayName, currentUser?.email);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem('cch_active_page');
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {}
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserMenuOpen(false);
    setPage('Dashboard');
    toast('Logged out successfully');
  };

  // Raw API objects
  const [rawData, setRawData] = useState({
    Customers: [],
    Vehicles: [],
    'Service Jobs': [],
    'Spare Parts': [],
    'Stock Movements': [],
    Invoices: [],
    Payments: [],
    Expenses: [],
    'Service Reminders': [],
    Notifications: [],
  });

  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [selected, setSelected] = useState(null);
  const [vehicleCustomerMode, setVehicleCustomerMode] = useState('EXISTING');

  // Breakdown items for Service Job / Invoice creation
  const [jobTasks, setJobTasks] = useState([]);
  const [jobParts, setJobParts] = useState([]);
  const [newLabourTaskName, setNewLabourTaskName] = useState('');
  const [newLabourCharge, setNewLabourCharge] = useState('');
  const [newPartId, setNewPartId] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [restockQty, setRestockQty] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const toast = (m) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Fetch all data from Backend APIs
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        customers,
        vehicles,
        serviceJobs,
        spareParts,
        stockMovements,
        invoices,
        payments,
        expenses,
        reminders,
        notifications,
        dashSummary,
      ] = await Promise.allSettled([
        api.getCustomers(),
        api.getVehicles(),
        api.getServiceJobs(),
        api.getSpareParts(),
        api.getStockMovements(),
        api.getInvoices(),
        api.getPayments(),
        api.getExpenses(),
        api.getServiceReminders(),
        api.getNotifications(),
        api.getDashboardSummary(),
      ]);

      setRawData({
        Customers: customers.status === 'fulfilled' ? customers.value || [] : [],
        Vehicles: vehicles.status === 'fulfilled' ? vehicles.value || [] : [],
        'Service Jobs': serviceJobs.status === 'fulfilled' ? serviceJobs.value || [] : [],
        'Spare Parts': spareParts.status === 'fulfilled' ? spareParts.value || [] : [],
        'Stock Movements': stockMovements.status === 'fulfilled' ? stockMovements.value || [] : [],
        Invoices: invoices.status === 'fulfilled' ? invoices.value || [] : [],
        Payments: payments.status === 'fulfilled' ? payments.value || [] : [],
        Expenses: expenses.status === 'fulfilled' ? expenses.value || [] : [],
        'Service Reminders': reminders.status === 'fulfilled' ? reminders.value || [] : [],
        Notifications: notifications.status === 'fulfilled' ? notifications.value || [] : [],
      });

      if (dashSummary.status === 'fulfilled') {
        setDashboardSummary(dashSummary.value);
      }
    } catch (err) {
      console.error('Failed to sync backend:', err);
      toast('Failed to sync with backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch breakdown of tasks & parts for a service job
  const fetchJobBreakdown = async (serviceJobId) => {
    if (!serviceJobId) return;
    try {
      const [tasksRes, partsRes] = await Promise.allSettled([
        api.getTasksByServiceJob(serviceJobId),
        api.getPartsByServiceJob(serviceJobId),
      ]);
      setJobTasks(tasksRes.status === 'fulfilled' ? tasksRes.value || [] : []);
      setJobParts(partsRes.status === 'fulfilled' ? partsRes.value || [] : []);
    } catch (e) {
      console.error('Failed to load job breakdown:', e);
    }
  };

  // Filter invoices that are either partially paid or unpaid (with balance due > 0)
  const payableInvoices = useMemo(() => {
    return (rawData.Invoices || []).filter((inv) => {
      const status = String(inv.status || '').toUpperCase();
      const grandTotal = Number(inv.grandTotal || 0);
      const paidAmount = Number(inv.paidAmount || 0);
      const balance = inv.balanceDue !== undefined
        ? Number(inv.balanceDue)
        : Math.max(0, grandTotal - paidAmount);

      // Exclude cancelled invoices
      if (status === 'CANCELLED') {
        return false;
      }

      // If status is fully PAID and balance is 0 or less, exclude it!
      if (status === 'PAID' && balance <= 0.01) {
        return false;
      }

      // If status is PARTIALLY_PAID, UNPAID, ISSUED, DRAFT, PENDING, or balance > 0 -> include!
      return true;
    });
  }, [rawData.Invoices]);

  // Format table columns and rows dynamically from backend data
  const tableData = useMemo(() => {
    return {
      Customers: {
        cols: ['ID', 'Customer Name', 'Phone', 'Email', 'Vehicles', 'Address', 'Status'],
        rows: (rawData.Customers || []).map((c) => {
          const custVehicles = (rawData.Vehicles || [])
            .filter((v) => v.customerId === c.id)
            .map((v) => v.registrationNumber)
            .join(', ');
          return [
            `#${c.id}`,
            c.fullName || '—',
            c.phoneNumber || '—',
            c.email || '—',
            custVehicles || 'No vehicle',
            c.address || '—',
            c.status || 'Active',
          ];
        }),
        raw: rawData.Customers,
      },
      Vehicles: {
        cols: ['ID', 'Reg. Number', 'Make / Brand', 'Model', 'Fuel Type', 'Year', 'Customer', 'Odometer'],
        rows: (rawData.Vehicles || []).map((v) => [
          `#${v.id}`,
          v.registrationNumber,
          v.vehicleMake,
          v.model,
          v.fuelType || '—',
          v.year ? String(v.year) : '—',
          v.customerName || '—',
          v.odometerReading ? `${v.odometerReading.toLocaleString()} KM` : '—',
        ]),
        raw: rawData.Vehicles,
      },
      'Service Jobs': {
        cols: ['Job No.', 'Customer', 'Vehicle', 'Odometer', 'Complaint / Service', 'Status'],
        rows: (rawData['Service Jobs'] || []).map((j) => [
          j.jobNumber,
          j.customerName || '—',
          j.registrationNumber || '—',
          j.odometerReading ? `${j.odometerReading.toLocaleString()} KM` : '—',
          j.customerComplaint || 'General Service',
          j.status,
        ]),
        raw: rawData['Service Jobs'],
      },
      'Spare Parts': {
        cols: ['Part Name', 'Category', 'Stock Qty', 'Selling Price', 'Status'],
        rows: (rawData['Spare Parts'] || []).map((p) => [
          p.name,
          p.category || 'General',
          String(p.stockQuantity ?? 0),
          `₹${Number(p.sellingPrice || 0).toLocaleString()}`,
          p.active ? 'Active' : 'Inactive',
        ]),
        raw: rawData['Spare Parts'],
      },
      'Stock Movements': {
        cols: ['ID', 'Part Name', 'SKU', 'Movement Type', 'Quantity', 'Notes', 'Date'],
        rows: (rawData['Stock Movements'] || []).map((m) => [
          `#${m.id}`,
          m.sparePartName || '—',
          m.sku || '—',
          m.movementType,
          String(m.quantity),
          m.notes || '—',
          m.createdAt ? m.createdAt.slice(0, 10) : '—',
        ]),
        raw: rawData['Stock Movements'],
      },
      Invoices: {
        cols: ['Invoice No.', 'Job No.', 'Customer', 'Vehicle', 'Amount', 'Paid', 'Status', 'Date'],
        rows: (rawData.Invoices || []).map((inv) => [
          inv.invoiceNumber,
          inv.jobNumber || '—',
          inv.customerName || '—',
          inv.registrationNumber || '—',
          `₹${Number(inv.grandTotal || 0).toLocaleString()}`,
          `₹${Number(inv.paidAmount || 0).toLocaleString()}`,
          inv.status,
          inv.invoiceDate || '—',
        ]),
        raw: rawData.Invoices,
      },
      Payments: {
        cols: ['Payment ID', 'Invoice No.', 'Customer', 'Method', 'Amount', 'Status', 'Date'],
        rows: (rawData.Payments || []).map((p) => [
          `#${p.id}`,
          p.invoiceNumber || '—',
          p.customerName || '—',
          p.paymentMethod,
          `₹${Number(p.amount || 0).toLocaleString()}`,
          p.status,
          p.paymentDate ? p.paymentDate.slice(0, 10) : '—',
        ]),
        raw: rawData.Payments,
      },
      Expenses: {
        cols: ['ID', 'Title', 'Category', 'Amount', 'Method', 'Date', 'Description'],
        rows: (rawData.Expenses || []).map((e) => [
          `#${e.id}`,
          e.title,
          e.category,
          `₹${Number(e.amount || 0).toLocaleString()}`,
          e.paymentMethod || 'CASH',
          e.expenseDate || '—',
          e.description || '—',
        ]),
        raw: rawData.Expenses,
      },
      'Service Reminders': {
        cols: ['ID', 'Vehicle', 'Customer', 'Due Date', 'Type', 'Message', 'Status'],
        rows: (rawData['Service Reminders'] || []).map((r) => [
          `#${r.id}`,
          r.registrationNumber || '—',
          r.customerName || '—',
          r.dueDate || '—',
          r.reminderType || 'Service',
          r.message || '—',
          r.status,
        ]),
        raw: rawData['Service Reminders'],
      },
      Notifications: {
        cols: ['ID', 'Recipient', 'Channel', 'Message', 'Status', 'Created'],
        rows: (rawData.Notifications || []).map((n) => [
          `#${n.id}`,
          n.recipient,
          n.channel,
          n.message,
          n.status,
          n.createdAt ? n.createdAt.slice(0, 10) : '—',
        ]),
        raw: rawData.Notifications,
      },
    };
  }, [rawData]);

  const active = nav.find((n) => n[0] === page);
  const Icon = active?.[1] || LayoutDashboard;

  const openAdd = (targetPage, initialData = null) => {
    const p = typeof targetPage === 'string' ? targetPage : page;
    setForm({});
    setVehicleCustomerMode('EXISTING');
    setJobTasks([]);
    setJobParts([]);
    setNewLabourTaskName('');
    setNewLabourCharge('');
    setNewPartId('');
    setNewPartQty(1);

    if (p === 'Invoices') {
      const invoicedJobIds = new Set((rawData.Invoices || []).map((inv) => inv.serviceJobId));
      const availableJob = (rawData['Service Jobs'] || []).find((j) => !invoicedJobIds.has(j.id)) || (rawData['Service Jobs'] || [])[0];
      if (availableJob) {
        setForm({
          serviceJobId: availableJob.id,
          taxRate: '18',
          discount: '',
          paymentStatus: 'PAID',
          paymentMethod: 'UPI',
        });
        fetchJobBreakdown(availableJob.id);
      } else {
        setForm({
          taxRate: '18',
          discount: '',
          paymentStatus: 'PAID',
          paymentMethod: 'UPI',
        });
      }
    } else if (p === 'Payments') {
      const targetInv = initialData || payableInvoices[0];
      if (targetInv) {
        const grandTotal = Number(targetInv.grandTotal || 0);
        const paidAmount = Number(targetInv.paidAmount || 0);
        const balance = targetInv.balanceDue !== undefined
          ? Number(targetInv.balanceDue)
          : Math.max(0, grandTotal - paidAmount);
        setForm({
          invoiceId: targetInv.id,
          amount: balance > 0 ? String(balance) : (grandTotal > 0 ? String(grandTotal) : ''),
          paymentMethod: 'UPI',
        });
      } else {
        setForm({
          paymentMethod: 'UPI',
        });
      }
    }

    setModal({ type: 'add', page: p });
  };

  const openEditCustomer = (cust) => {
    if (!cust) return;
    setForm({
      id: cust.id,
      fullName: cust.fullName || cust.name || '',
      phoneNumber: cust.phoneNumber || cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      status: cust.status || 'Active',
      whatsappConsent: cust.whatsappConsent ?? true,
    });
    setModal({ type: 'edit-customer', page: 'Customers', data: cust });
  };

  const handleUpdateCustomer = async () => {
    if (!form.id) return;
    if (!form.fullName?.trim() || !form.phoneNumber?.trim()) {
      alert('Customer Name and Phone Number are required');
      return;
    }
    setLoading(true);
    try {
      await api.updateCustomer(form.id, {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email?.trim() || null,
        address: form.address?.trim() || '',
        status: form.status || 'Active',
        whatsappConsent: form.whatsappConsent ?? true,
      });
      toast(`Customer "${form.fullName}" updated successfully!`);
      setModal(null);
      await fetchAllData();
    } catch (err) {
      alert(err.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Status Update for Service Jobs
  const handleUpdateJobStatus = async (job, newStatus) => {
    if (!job?.id) return;
    if (job.status === newStatus) return;
    setLoading(true);
    try {
      await api.updateServiceJobStatus(job.id, newStatus);
      toast(`Job #${job.jobNumber} status updated to ${newStatus}`);
      await fetchAllData();
      if (selected?.raw?.id === job.id) {
        setSelected((prev) => ({
          ...prev,
          raw: { ...prev.raw, status: newStatus },
          row: prev.row.map((val) => (val === job.status ? newStatus : val)),
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update job status');
    } finally {
      setLoading(false);
    }
  };

  // Add Labour Task to Job
  const handleAddLabourTask = async (serviceJobId) => {
    if (!serviceJobId) {
      alert('Please select a service job first');
      return;
    }
    if (!newLabourTaskName.trim()) {
      alert('Please enter labour task name (e.g. Brake Servicing, Engine Oil Change)');
      return;
    }
    const charge = parseFloat(newLabourCharge);
    if (isNaN(charge) || charge < 0) {
      alert('Please enter a valid labour charge amount');
      return;
    }

    setActionLoading(true);
    try {
      await api.createJobTask(serviceJobId, {
        taskName: newLabourTaskName.trim(),
        description: 'Labour charge',
        labourCharge: charge,
      });

      setNewLabourTaskName('');
      setNewLabourCharge('');
      await fetchJobBreakdown(serviceJobId);
      toast('Labour charge added to job!');
    } catch (err) {
      alert(err.message || 'Failed to add labour task');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Spare Part to Job
  const handleAddSparePartToJob = async (serviceJobId) => {
    if (!serviceJobId) {
      alert('Please select a service job first');
      return;
    }
    if (!newPartId) {
      alert('Please select a spare part from the dropdown');
      return;
    }
    const qty = parseInt(newPartQty, 10);
    if (isNaN(qty) || qty < 1) {
      alert('Please enter valid quantity (at least 1)');
      return;
    }

    setActionLoading(true);
    try {
      await api.addPartToJob(serviceJobId, {
        sparePartId: parseInt(newPartId, 10),
        quantity: qty,
      });
      setNewPartId('');
      setNewPartQty(1);
      await fetchJobBreakdown(serviceJobId);
      toast('Spare part added to job!');
    } catch (err) {
      alert(err.message || 'Failed to add spare part to job');
    } finally {
      setActionLoading(false);
    }
  };

  // Restock / Add Stock to Spare Part from Details Modal
  const handleRestockPart = async (sparePartId) => {
    if (!sparePartId) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }
    setRestockLoading(true);
    try {
      await api.createStockMovement({
        sparePartId: sparePartId,
        movementType: 'PURCHASE',
        quantity: qty,
        notes: restockNotes.trim() || 'Inventory Restock via Spare Part Details',
        referenceType: 'MANUAL',
        referenceId: null,
      });
      toast(`Successfully added ${qty} units to stock!`);
      setRestockQty('');
      setRestockNotes('');
      await fetchAllData();

      // Live update selected item in open modal
      if (selected?.raw?.id === sparePartId) {
        const updatedStock = (selected.raw.stockQuantity || 0) + qty;
        setSelected((prev) => ({
          ...prev,
          raw: { ...prev.raw, stockQuantity: updatedStock },
          row: prev.row.map((val, idx) => {
            const colName = tableData['Spare Parts']?.cols?.[idx];
            return colName === 'Stock Qty' ? String(updatedStock) : val;
          }),
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to add stock');
    } finally {
      setRestockLoading(false);
    }
  };

  const handleCreateRecord = async () => {
    const p = modal.page;
    setLoading(true);
    try {
      // UNIFIED CUSTOMER + VEHICLE CREATION
      if (p === 'Customers' || (p === 'Vehicles' && vehicleCustomerMode === 'NEW')) {
        if (!form.fullName?.trim() || !form.phoneNumber?.trim()) {
          throw new Error('Customer Name and Phone Number are required');
        }

        // 1. Create Customer
        const cust = await api.createCustomer({
          fullName: form.fullName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          email: form.email?.trim() || null,
          address: form.address?.trim() || '',
          status: form.status || 'Active',
          whatsappConsent: true,
        });

        // 2. If vehicle details provided, create vehicle linked to customer immediately
        if (form.registrationNumber?.trim()) {
          await api.createVehicle(cust.id, {
            registrationNumber: form.registrationNumber.trim().toUpperCase(),
            vehicleMake: form.vehicleMake?.trim() || 'General',
            model: form.model?.trim() || 'Standard',
            fuelType: form.fuelType || 'PETROL',
            year: form.year ? parseInt(form.year, 10) : 2023,
            odometerReading: form.odometerReading ? parseInt(form.odometerReading, 10) : 0,
          });
          toast('Customer and Vehicle successfully registered together!');
        } else {
          toast('Customer created successfully in MySQL!');
        }
      } else if (p === 'Vehicles') {
        const custId = form.customerId || rawData.Customers[0]?.id;
        if (!custId) throw new Error('Please select an existing customer or toggle to New Customer');
        if (!form.registrationNumber?.trim()) throw new Error('Registration number is required');

        await api.createVehicle(custId, {
          registrationNumber: form.registrationNumber.trim().toUpperCase(),
          vehicleMake: form.vehicleMake?.trim() || 'General',
          model: form.model?.trim() || 'Standard',
          fuelType: form.fuelType || 'PETROL',
          year: form.year ? parseInt(form.year, 10) : 2023,
          odometerReading: form.odometerReading ? parseInt(form.odometerReading, 10) : 0,
        });
        toast('Vehicle registered for customer successfully!');
      } else if (p === 'Service Jobs') {
        const vehId = form.vehicleId || rawData.Vehicles[0]?.id;
        if (!vehId) throw new Error('Please select or create a vehicle first');
        const currentOdo = form.odometerReading ? parseInt(form.odometerReading, 10) : null;
        await api.createServiceJob(vehId, {
          customerComplaint: form.customerComplaint || 'General Service',
          inspectionNotes: form.inspectionNotes || '',
          odometerReading: currentOdo,
          expectedDeliveryDate: form.expectedDeliveryDate || new Date().toISOString().slice(0, 10),
        });
        toast('Service Job created & Vehicle Odometer updated successfully!');
      } else if (p === 'Spare Parts') {
        const stockQty = form.stockQuantity ? Math.max(0, parseInt(form.stockQuantity, 10)) : 0;
        const autoSku = (form.name || 'PART').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
        await api.createSparePart({
          name: form.name || '',
          sku: autoSku,
          category: form.category || 'General',
          description: form.description || '',
          purchasePrice: Math.max(0, parseFloat(form.purchasePrice || 0)),
          sellingPrice: Math.max(0, parseFloat(form.sellingPrice || 0)),
          minimumStockLevel: 5,
          stockQuantity: stockQty,
        });
        toast('Spare part added to catalogue!');
      } else if (p === 'Stock Movements') {
        const partId = form.sparePartId || rawData['Spare Parts'][0]?.id;
        if (!partId) throw new Error('Please select a spare part first');
        await api.createStockMovement({
          sparePartId: partId,
          movementType: form.movementType || 'PURCHASE',
          quantity: parseInt(form.quantity || 1, 10),
          notes: form.notes || 'Inventory entry',
          referenceType: 'MANUAL',
          referenceId: null,
        });
        toast('Stock movement recorded!');
      } else if (p === 'Invoices') {
        const jobId = form.serviceJobId || rawData['Service Jobs'][0]?.id;
        if (!jobId) throw new Error('Please select a service job first');

        const jobObj = (rawData['Service Jobs'] || []).find((j) => j.id === parseInt(jobId, 10));
        if (jobObj && jobObj.status !== 'COMPLETED') {
          await api.updateServiceJobStatus(jobId, 'COMPLETED');
        }

        const invRes = await api.createInvoice(jobId, {
          dueDate: form.dueDate || new Date().toISOString().slice(0, 10),
          includeGst: form.includeGst !== false,
          taxRate: form.taxRate ? parseFloat(form.taxRate) : 18.0,
          discount: form.discount ? parseFloat(form.discount) : 0,
          notes: form.notes || 'Payment due on delivery',
        });

        const grandTot = Number(invRes?.grandTotal || invoiceGrandTotal || 0);

        // 1. FULL PAYMENT SETTLEMENT
        if ((form.paymentStatus || 'PAID') === 'PAID' && invRes?.id) {
          if (grandTot > 0) {
            await api.createPayment(invRes.id, {
              invoiceId: invRes.id,
              amount: grandTot,
              paymentMethod: form.paymentMethod || 'UPI',
              transactionReference: form.transactionReference || ('TXN-' + Date.now().toString().slice(-6)),
              notes: form.paymentNotes || 'Full payment settled on invoice generation',
            });
            toast('Invoice generated & Full payment settled successfully!');
          } else {
            toast('Invoice generated successfully!');
          }
        }
        // 2. PARTIAL PAYMENT (ADVANCE) SETTLEMENT
        else if (form.paymentStatus === 'PARTIALLY_PAID' && invRes?.id) {
          const partialAmt = parseFloat(form.paymentAmount || 0);
          if (isNaN(partialAmt) || partialAmt <= 0) {
            throw new Error('Please enter a valid partial advance amount greater than 0');
          }
          if (partialAmt > grandTot) {
            throw new Error(`Partial payment amount cannot exceed bill grand total ₹${grandTot.toLocaleString()}`);
          }
          await api.createPayment(invRes.id, {
            invoiceId: invRes.id,
            amount: partialAmt,
            paymentMethod: form.paymentMethod || 'UPI',
            transactionReference: form.transactionReference || ('PARTIAL-' + Date.now().toString().slice(-6)),
            notes: form.paymentNotes || 'Advance payment received on invoice generation',
          });
          const remainingDue = grandTot - partialAmt;
          toast(`Invoice generated & Advance ₹${partialAmt.toLocaleString()} settled! Remaining due: ₹${remainingDue.toLocaleString()}`);
        }
        // 3. UNPAID / PAY LATER
        else {
          toast('Invoice generated successfully (Marked Unpaid / Due)!');
        }
      } else if (p === 'Payments') {
        const invId = form.invoiceId || payableInvoices[0]?.id || rawData.Invoices[0]?.id;
        if (!invId) throw new Error('Please select an unpaid or partially paid invoice first');
        await api.createPayment(invId, {
          invoiceId: invId,
          amount: parseFloat(form.amount || 0),
          paymentMethod: form.paymentMethod || 'UPI',
          transactionReference: form.transactionReference || 'REF-' + Date.now().toString().slice(-6),
          notes: form.notes || '',
        });
        toast('Payment recorded successfully!');
      } else if (p === 'Expenses') {
        await api.createExpense({
          title: form.title || '',
          category: form.category || 'MAINTENANCE',
          amount: parseFloat(form.amount || 0),
          paymentMethod: form.paymentMethod || 'CASH',
          expenseDate: form.expenseDate || new Date().toISOString().slice(0, 10),
          description: form.description || '',
        });
        toast('Expense recorded!');
      } else if (p === 'Service Reminders') {
        const veh = rawData.Vehicles.find((v) => String(v.id) === String(form.vehicleId)) || rawData.Vehicles[0];
        if (!veh) throw new Error('Please select a vehicle first');
        await api.createServiceReminder({
          vehicleId: veh.id,
          registrationNumber: veh.registrationNumber,
          dueDate: form.dueDate || new Date().toISOString().slice(0, 10),
          reminderType: form.reminderType || '50-day service',
          message: form.message || `Service reminder for ${veh.registrationNumber}`,
        });
        toast('Service reminder scheduled!');
      }

      setModal(null);
      await fetchAllData();
    } catch (err) {
      alert(err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsAppInvoice = async (invoiceId) => {
    setSendingWhatsApp(true);
    try {
      const res = await api.sendInvoiceWhatsApp(invoiceId);
      const successMsg = (res && typeof res === 'object' && res.message)
        ? res.message
        : 'WhatsApp message triggered successfully!';
      toast(successMsg);
    } catch (e) {
      let raw = e?.message || 'Failed to send WhatsApp message';
      let clean = 'Failed to deliver WhatsApp message. Please check customer phone number.';
      try {
        if (raw.includes('{') && raw.includes('}')) {
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          const parsed = JSON.parse(raw.substring(start, end + 1));
          raw = parsed.message || parsed.error?.message || (typeof parsed.error === 'string' ? parsed.error : '');
        }
      } catch (_) { }

      if (raw) {
        if (raw.includes('(#131030)')) {
          clean = 'Customer phone number is not allowed on Meta test account.';
        } else if (raw.includes('(#132001)')) {
          clean = 'WhatsApp invoice template not approved or language mismatch.';
        } else if (raw.includes('(#131026)')) {
          clean = 'Message undeliverable to this phone number.';
        } else {
          clean = raw.replace(/^Error \d+:\s*/i, '')
            .replace(/^WhatsApp API error:\s*/i, '')
            .replace(/^WhatsApp invoice delivery failed:\s*/i, '')
            .trim();
        }
      }
      toast(clean || 'WhatsApp alert could not be delivered.');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleSendWhatsAppReminder = async (reminderId) => {
    setSendingReminderId(reminderId);
    try {
      const res = await api.sendServiceReminderWhatsApp(reminderId);
      const successMsg = (res && typeof res === 'object' && res.message)
        ? res.message
        : 'Service reminder WhatsApp sent successfully!';
      toast(successMsg);
      fetchAllData();
    } catch (e) {
      let raw = e?.message || 'Failed to send WhatsApp reminder';
      let clean = 'Failed to deliver WhatsApp reminder. Please check customer phone number.';
      try {
        if (raw.includes('{') && raw.includes('}')) {
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          const parsed = JSON.parse(raw.substring(start, end + 1));
          raw = parsed.message || parsed.error?.message || (typeof parsed.error === 'string' ? parsed.error : '');
        }
      } catch (_) { }

      if (raw) {
        if (raw.includes('(#131030)')) {
          clean = 'Customer phone number is not allowed on Meta test account.';
        } else if (raw.includes('(#132001)')) {
          clean = 'WhatsApp reminder template not approved or language mismatch.';
        } else if (raw.includes('(#131026)')) {
          clean = 'Message undeliverable to this phone number.';
        } else {
          clean = raw.replace(/^Error \d+:\s*/i, '')
            .replace(/^WhatsApp API error:\s*/i, '')
            .replace(/^WhatsApp service reminder delivery failed:\s*/i, '')
            .trim();
        }
      }
      toast(clean || 'WhatsApp reminder could not be delivered.');
    } finally {
      setSendingReminderId(null);
    }
  };

  // Live bill computation for Add Invoice Modal
  const labourTotal = useMemo(() => {
    return jobTasks.reduce((acc, t) => acc + Number(t.labourCharge || 0), 0);
  }, [jobTasks]);

  const partsTotal = useMemo(() => {
    return jobParts.reduce((acc, p) => acc + Number(p.totalPrice || 0), 0);
  }, [jobParts]);

  const invoiceSubtotal = labourTotal + partsTotal;
  const discountNum = parseFloat(form.discount || 0) || 0;
  const taxableAmount = Math.max(0, invoiceSubtotal - discountNum);
  const taxRateNum = parseFloat(form.taxRate || 18) || 0;
  const gstAmount = Math.round((taxableAmount * taxRateNum) / 100);
  const invoiceGrandTotal = taxableAmount + gstAmount;

  // Enforce Login Gate
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setIsAuthenticated(true);
          setCurrentUser(user);
          fetchAllData();
        }}
      />
    );
  }

  return (
    <div className="app">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-symbol">
            <Car size={23} />
          </div>
          <div>
            <b>CarCareHub</b>

          </div>
          <button className="close-menu" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>

        <nav>
          {nav.map(([n, I]) => (
            <button
              key={n}
              className={'nav-item ' + (page === n ? 'active' : '')}
              onClick={() => {
                setPage(n);
                setMobile(false);
              }}
            >
              <I size={18} />
              <span>{n}</span>
              {n === 'Notifications' && (rawData.Notifications?.length || 0) > 0 && (
                <i>{rawData.Notifications.length}</i>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobile(true)}>
            <Menu />
          </button>

          <div className="topbar-greeting">
            <span className="topbar-greeting-text">
              {getGreeting()}, <strong className="topbar-greeting-name">{displayName}</strong>
            </span>
            <span className="topbar-greeting-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="topbar-right-group">
            <button className="modern-bell-btn" onClick={() => setPage('Notifications')} title="Notifications">
              <Bell size={18} />
              <span className="modern-bell-badge" />
            </button>

            <div className="modern-user-profile-wrapper" style={{ position: 'relative' }}>
              <div
                className="modern-user-profile"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Profile & Options"
              >
                <div className="modern-user-avatar-badge">
                  {userInitials}
                </div>
                <span className="modern-user-name">{displayName}</span>
                <ChevronDown size={15} className={`modern-user-chevron ${userMenuOpen ? 'rotate' : ''}`} />
              </div>

              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <strong>{displayName}</strong>
                    <small>{currentUser?.email || 'Garage Administrator'}</small>
                  </div>
                  <button
                    className="user-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          {page === 'Dashboard' ? (
            <Dashboard
              go={setPage}
              summary={dashboardSummary}
              rawData={rawData}
              loading={loading}
              onRefresh={fetchAllData}
              openAdd={openAdd}
              onSelectJob={(job) => {
                const idx = (rawData['Service Jobs'] || []).findIndex((j) => j.id === job.id);
                const row = tableData['Service Jobs']?.rows?.[idx] || [];
                setSelected({ row, raw: job, page: 'Service Jobs' });
                setModal({ type: 'detail', page: 'Service Jobs' });
              }}
            />
          ) : page === 'Customers' ? (
            <CustomersPage
              customers={rawData.Customers}
              vehicles={rawData.Vehicles}
              loading={loading}
              onAddCustomer={() => openAdd('Customers')}
              onEditCustomer={openEditCustomer}
              onViewCustomer={(cust) => {
                const idx = (rawData.Customers || []).findIndex((c) => c.id === cust.id);
                const row = tableData.Customers?.rows?.[idx] || [];
                setSelected({ row, raw: cust, page: 'Customers' });
                setModal({ type: 'detail', page: 'Customers' });
              }}
              onRefresh={fetchAllData}
              toast={toast}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <Icon size={15} /> {page}
                  </div>
                  <h1>{page}</h1>
                  <p>
                    {
                      {
                        Customers: 'Customer profiles and their registered vehicles in one place.',
                        Vehicles: 'Registered vehicles linked to garage customer accounts.',
                        'Service Jobs': 'Bay workflow, status changes (1-click), and delivery tracking.',
                        'Spare Parts': 'Parts catalogue, live stock levels, and replenishment alarms.',
                        Invoices: 'Customer billing, labour tasks, parts line items, and WhatsApp delivery.',
                        Payments: 'Cash and UPI transactions recorded with invoices.',
                        Expenses: 'Operating expenditures and maintenance overhead.',
                        'Service Reminders': 'Upcoming service intervals for customer vehicles.',
                        Notifications: 'Automated WhatsApp reminder and invoice delivery logs.',
                        Reports: 'Financial summary and garage performance analytics.',
                      }[page]
                    }
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="outline date">
                    <CalendarClock size={15} /> This Month <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {tableData[page] ? (
                <TablePage
                  page={page}
                  data={tableData[page]}
                  loading={loading}
                  toast={toast}
                  invoices={rawData.Invoices || []}
                  onAdd={(target) => openAdd(typeof target === 'string' ? target : page)}
                  onCollectPayment={(item) => openAdd('Payments', item)}
                  onSendReminder={handleSendWhatsAppReminder}
                  sendingReminderId={sendingReminderId}
                  onRefresh={fetchAllData}
                  onUpdateStatus={handleUpdateJobStatus}
                  onView={(row, idx) => {
                    const rawItem = tableData[page].raw?.[idx] || {};
                    setSelected({ row, raw: rawItem, page });
                    setRestockQty('');
                    setRestockNotes('');
                    if (page === 'Service Jobs' && rawItem.id) {
                      fetchJobBreakdown(rawItem.id);
                    }
                    setModal({ type: 'detail', page });
                  }}
                />
              ) : (
                <ReportsPage
                  summary={dashboardSummary}
                  rawData={rawData}
                  onRefresh={fetchAllData}
                />
              )}
            </>
          )}
        </div>
      </main>

      {toastMsg && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toastMsg}
        </div>
      )}

      {/* ADD MODAL */}
      {modal?.type === 'add' && (
        <Modal
          title={
            modal.page === 'Customers'
              ? 'Add Customer & Vehicle'
              : modal.page === 'Vehicles'
                ? 'Add Vehicle'
                : modal.page === 'Invoices'
                  ? 'Create Invoice with Labour & Parts'
                  : typeof modal.page === 'string'
                    ? `Add New ${modal.page.replace(/s$/, '')}`
                    : 'Add New Record'
          }
          onClose={() => setModal(null)}
        >
          <div className="form-grid">
            {/* UNIFIED CUSTOMER & VEHICLE FORM */}
            {(modal.page === 'Customers' || (modal.page === 'Vehicles' && vehicleCustomerMode === 'NEW')) && (
              <>
                {modal.page === 'Vehicles' && (
                  <div className="form-toggle-bar">
                    <button
                      type="button"
                      className={'form-toggle-btn ' + (vehicleCustomerMode === 'EXISTING' ? 'active' : '')}
                      onClick={() => setVehicleCustomerMode('EXISTING')}
                    >
                      Existing Customer
                    </button>
                    <button
                      type="button"
                      className={'form-toggle-btn ' + (vehicleCustomerMode === 'NEW' ? 'active' : '')}
                      onClick={() => setVehicleCustomerMode('NEW')}
                    >
                      + New Customer & Vehicle
                    </button>
                  </div>
                )}

                <div className="form-section-title">
                  <Users size={16} /> 1. Customer Information
                </div>

                <label>
                  Customer Full Name *
                  <input
                    value={form.fullName || ''}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="e.g. Rohit Mehra"
                    required
                  />
                </label>
                <label>
                  Phone Number *
                  <input
                    value={form.phoneNumber || ''}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </label>
                <label>
                  Email Address
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. rohit@gmail.com"
                  />
                </label>
                <label>
                  Address
                  <input
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. Lajpat Nagar, Delhi"
                  />
                </label>

                <div className="form-section-title">
                  <Car size={16} /> 2. Vehicle Information (Auto-linked)
                </div>

                <label>
                  Registration Number *
                  <input
                    value={form.registrationNumber || ''}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. DL3CBE7788"
                    required
                  />
                </label>
                <label>
                  Make / Brand *
                  <input
                    value={form.vehicleMake || ''}
                    onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })}
                    placeholder="e.g. Hyundai, Maruti Suzuki"
                    required
                  />
                </label>
                <label>
                  Model *
                  <input
                    value={form.model || ''}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="e.g. Creta, Swift"
                    required
                  />
                </label>
                <label>
                  Fuel Type
                  <select
                    value={form.fuelType || 'PETROL'}
                    onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                  >
                    <option value="PETROL">PETROL</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </label>
                <label>
                  Manufacturing Year
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.year !== undefined ? form.year : ''}
                    onChange={(e) => setForm({ ...form, year: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 2024"
                  />
                </label>
                <label>
                  Current Odometer (KM)
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.odometerReading !== undefined ? form.odometerReading : ''}
                    onChange={(e) => setForm({ ...form, odometerReading: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 42000"
                  />
                </label>
              </>
            )}

            {modal.page === 'Vehicles' && vehicleCustomerMode === 'EXISTING' && (
              <>
                <div className="form-toggle-bar">
                  <button
                    type="button"
                    className={'form-toggle-btn ' + (vehicleCustomerMode === 'EXISTING' ? 'active' : '')}
                    onClick={() => setVehicleCustomerMode('EXISTING')}
                  >
                    Existing Customer
                  </button>
                  <button
                    type="button"
                    className={'form-toggle-btn ' + (vehicleCustomerMode === 'NEW' ? 'active' : '')}
                    onClick={() => setVehicleCustomerMode('NEW')}
                  >
                    + New Customer & Vehicle
                  </button>
                </div>

                <label style={{ gridColumn: 'span 2' }}>
                  Select Registered Customer *
                  <select
                    value={form.customerId || rawData.Customers[0]?.id || ''}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  >
                    {rawData.Customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phoneNumber})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Registration Number *
                  <input
                    value={form.registrationNumber || ''}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. DL8CAB1234"
                    required
                  />
                </label>
                <label>
                  Make / Brand *
                  <input
                    value={form.vehicleMake || ''}
                    onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })}
                    placeholder="e.g. Maruti Suzuki, Hyundai"
                    required
                  />
                </label>
                <label>
                  Model *
                  <input
                    value={form.model || ''}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="e.g. Swift, Creta"
                    required
                  />
                </label>
                <label>
                  Fuel Type
                  <select
                    value={form.fuelType || 'PETROL'}
                    onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                  >
                    <option value="PETROL">PETROL</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </label>
                <label>
                  Manufacturing Year
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.year !== undefined ? form.year : ''}
                    onChange={(e) => setForm({ ...form, year: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 2024"
                  />
                </label>
                <label>
                  Odometer Reading (KM)
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.odometerReading !== undefined ? form.odometerReading : ''}
                    onChange={(e) => setForm({ ...form, odometerReading: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 45000"
                  />
                </label>
              </>
            )}

            {modal.page === 'Service Jobs' && (() => {
              const selectedVeh = (rawData.Vehicles || []).find(
                (v) => String(v.id) === String(form.vehicleId || rawData.Vehicles[0]?.id)
              );
              const prevOdo = selectedVeh?.odometerReading ?? 0;
              return (
                <>
                  <label style={{ gridColumn: 'span 2' }}>
                    Select Vehicle *
                    <select
                      value={form.vehicleId || rawData.Vehicles[0]?.id || ''}
                      onChange={(e) => {
                        const newVehId = e.target.value;
                        setForm({
                          ...form,
                          vehicleId: newVehId,
                          odometerReading: undefined,
                        });
                      }}
                    >
                      {rawData.Vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} ({v.vehicleMake} {v.model}) - {v.customerName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Previous Service Odometer Info Card */}
                  <div className="prev-odo-info-card" style={{ gridColumn: 'span 2' }}>
                    <div className="prev-odo-chip">
                      <span className="prev-odo-label">
                        <Car size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                        Previous Recorded Odometer :
                      </span>
                      <strong className="prev-odo-val">
                        {prevOdo > 0 ? `${prevOdo.toLocaleString()} KM` : 'No prior reading'}
                      </strong>
                    </div>
                  </div>

                  {/* Current Service Odometer Input */}
                  <label style={{ gridColumn: 'span 1' }}>
                    Current Odometer (KM) *
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.odometerReading !== undefined ? form.odometerReading : (prevOdo > 0 ? String(prevOdo) : '')}
                      onChange={(e) => setForm({ ...form, odometerReading: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder={prevOdo > 0 ? `e.g. ${prevOdo + 500}` : 'e.g. 25000'}
                      title="Enter current odometer reading to record service mileage and update vehicle record"
                      required
                    />
                  </label>

                  <label style={{ gridColumn: 'span 1' }}>
                    Expected Delivery Date
                    <input
                      type="date"
                      value={form.expectedDeliveryDate || new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                    />
                  </label>

                  <label style={{ gridColumn: 'span 2' }}>
                    Customer Complaint / Service Request *
                    <input
                      value={form.customerComplaint || ''}
                      onChange={(e) => setForm({ ...form, customerComplaint: e.target.value })}
                      placeholder="e.g. General Periodic Service, Brake pad inspection, Engine oil change"
                      required
                    />
                  </label>
                  <label style={{ gridColumn: 'span 2' }}>
                    Initial Inspection Notes
                    <input
                      value={form.inspectionNotes || ''}
                      onChange={(e) => setForm({ ...form, inspectionNotes: e.target.value })}
                      placeholder="e.g. Oil level low, front brake pads worn, AC filter dirty"
                    />
                  </label>
                </>
              );
            })()}

            {modal.page === 'Spare Parts' && (
              <>
                <label>
                  Part Name *
                  <input
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Engine Oil Filter"
                    required
                  />
                </label>
                <label>
                  Category
                  <input
                    value={form.category || ''}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Filters, Lubricants, Brakes"
                  />
                </label>
                <label>
                  Stock Quantity (In Stock)
                  <input
                    type="number"
                    min="0"
                    value={form.stockQuantity ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseInt(v, 10) >= 0) {
                        setForm({ ...form, stockQuantity: v });
                      }
                    }}
                    placeholder="e.g. 10"
                  />
                </label>
                <label>
                  Purchase Price (₹) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseFloat(v) >= 0) {
                        setForm({ ...form, purchasePrice: v });
                      }
                    }}
                    placeholder="e.g. 250.00"
                    required
                  />
                </label>
                <label>
                  Selling Price (₹) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseFloat(v) >= 0) {
                        setForm({ ...form, sellingPrice: v });
                      }
                    }}
                    placeholder="e.g. 350.00"
                    required
                  />
                </label>
                <label style={{ gridColumn: 'span 2' }}>
                  Description
                  <input
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Fits Hyundai i10 & Swift"
                  />
                </label>
              </>
            )}

            {/* ENHANCED INVOICES MODAL (SHOWING & ADDING LABOUR + PARTS DETAILS) */}
            {modal.page === 'Invoices' && (
              <>
                <label style={{ gridColumn: 'span 2' }}>
                  Select Service Job to Invoice *
                  <select
                    value={form.serviceJobId || ''}
                    onChange={(e) => {
                      const jId = e.target.value;
                      setForm({ ...form, serviceJobId: jId });
                      fetchJobBreakdown(jId);
                    }}
                  >
                    <option value="">-- Choose a service job --</option>
                    {(rawData['Service Jobs'] || []).map((j) => {
                      const isInvoiced = (rawData.Invoices || []).some((inv) => inv.serviceJobId === j.id);
                      return (
                        <option key={j.id} value={j.id} disabled={isInvoiced}>
                          {j.jobNumber} - {j.registrationNumber} ({j.customerName}) [{j.status}] {isInvoiced ? '— (Already Invoiced)' : '— (Ready to Invoice)'}
                        </option>
                      );
                    })}
                  </select>
                </label>

                {/* LABOUR CHARGES SECTION */}
                <div className="form-section-title">
                  <Wrench size={16} /> 1. Labour Charges
                </div>

                {jobTasks.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', gridColumn: 'span 2' }}>
                    No labour tasks on this job yet. Add labour charges below:
                  </div>
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Labour Task / Work</th>
                          <th>Status</th>
                          <th>Charge (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobTasks.map((t) => (
                          <tr key={t.id}>
                            <td><b>{t.taskName}</b></td>
                            <td><span className="item-badge-labour">{t.status}</span></td>
                            <td>₹{Number(t.labourCharge || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="inline-add-row" style={{ gridColumn: 'span 2' }}>
                  <input
                    style={{ flex: 2 }}
                    placeholder="e.g. General Servicing Labour, Brake Inspection"
                    value={newLabourTaskName}
                    onChange={(e) => setNewLabourTaskName(e.target.value)}
                  />
                  <input
                    style={{ width: '110px' }}
                    type="text"
                    inputMode="decimal"
                    placeholder="Charge (₹)"
                    value={newLabourCharge}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setNewLabourCharge(v);
                    }}
                  />
                  <button
                    type="button"
                    className="outline"
                    disabled={actionLoading}
                    style={{ height: '34px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    onClick={() => handleAddLabourTask(form.serviceJobId || (rawData['Service Jobs'] || [])[0]?.id)}
                  >
                    + Add Labour
                  </button>
                </div>

                {/* SPARE PARTS USED SECTION */}
                <div className="form-section-title">
                  <Package size={16} /> 2. Spare Parts Used
                </div>

                {jobParts.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', gridColumn: 'span 2' }}>
                    No spare parts added to this job yet. Add parts from catalogue below:
                  </div>
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Part Name</th>
                          <th>Qty</th>
                          <th>Unit Price (₹)</th>
                          <th>Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobParts.map((p) => (
                          <tr key={p.id}>
                            <td><b>{p.partName}</b></td>
                            <td>{p.quantity}</td>
                            <td>₹{Number(p.unitSellingPrice || 0).toLocaleString()}</td>
                            <td><b>₹{Number(p.totalPrice || 0).toLocaleString()}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="inline-add-row" style={{ gridColumn: 'span 2' }}>
                  <select
                    style={{ flex: 2 }}
                    value={newPartId}
                    onChange={(e) => setNewPartId(e.target.value)}
                  >
                    <option value="">Select Spare Part from inventory...</option>
                    {(rawData['Spare Parts'] || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.sellingPrice} (In Stock: {p.stockQuantity})
                      </option>
                    ))}
                  </select>
                  <input
                    style={{ width: '70px' }}
                    type="text"
                    inputMode="numeric"
                    placeholder="Qty"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <button
                    type="button"
                    className="outline"
                    disabled={actionLoading}
                    style={{ height: '34px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    onClick={() => handleAddSparePartToJob(form.serviceJobId || (rawData['Service Jobs'] || [])[0]?.id)}
                  >
                    + Add Part
                  </button>
                </div>

                {/* LIVE BILL BREAKDOWN PREVIEW */}
                <div className="bill-summary-box" style={{ gridColumn: 'span 2' }}>
                  <div className="bill-summary-row">
                    <span>Labour Charges Total:</span>
                    <b>₹{labourTotal.toLocaleString()}</b>
                  </div>
                  <div className="bill-summary-row">
                    <span>Spare Parts Total:</span>
                    <b>₹{partsTotal.toLocaleString()}</b>
                  </div>
                  <div className="bill-summary-row">
                    <span>Subtotal (Before Tax):</span>
                    <b>₹{invoiceSubtotal.toLocaleString()}</b>
                  </div>
                  <div className="bill-summary-row">
                    <span>GST Tax ({form.taxRate || 18}%):</span>
                    <b>₹{gstAmount.toLocaleString()}</b>
                  </div>
                  {discountNum > 0 && (
                    <div className="bill-summary-row" style={{ color: '#059669' }}>
                      <span>Discount:</span>
                      <b>-₹{discountNum.toLocaleString()}</b>
                    </div>
                  )}
                  <div className="bill-summary-row total">
                    <span>Grand Total (Bill Amount):</span>
                    <span style={{ color: '#1d4ed8', fontSize: '15px' }}>
                      ₹{invoiceGrandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="form-section-title">
                  <Receipt size={16} /> 3. Invoice Parameters
                </div>

                <label>
                  Due Date
                  <input
                    type="date"
                    value={form.dueDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </label>
                <label>
                  GST Rate (%)
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="18"
                    value={form.taxRate !== undefined ? form.taxRate : '18'}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setForm({ ...form, taxRate: v });
                    }}
                  />
                </label>
                <label>
                  Discount Amount (₹)
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={form.discount !== undefined ? form.discount : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setForm({ ...form, discount: v });
                    }}
                  />
                </label>
                <label>
                  Notes
                  <input
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Payment due on delivery"
                  />
                </label>

                {/* 4. PAYMENT SETTLEMENT SECTION */}
                <div className="form-section-title" style={{ marginTop: '16px' }}>
                  <Wallet size={16} /> 4. Payment Settlement
                </div>

                <div className="form-toggle-bar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`form-toggle-btn ${(form.paymentStatus || 'PAID') === 'PAID' ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, paymentStatus: 'PAID', paymentAmount: invoiceGrandTotal > 0 ? String(invoiceGrandTotal) : '' })}
                    style={(form.paymentStatus || 'PAID') === 'PAID' ? { background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' } : {}}
                  >
                    <CheckCircle2 size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Full Paid (100% Settled)
                  </button>

                  <button
                    type="button"
                    className={`form-toggle-btn ${form.paymentStatus === 'PARTIALLY_PAID' ? 'active' : ''}`}
                    onClick={() => {
                      const defaultPartial = invoiceGrandTotal > 0 ? String(Math.round(invoiceGrandTotal / 2)) : '';
                      setForm({
                        ...form,
                        paymentStatus: 'PARTIALLY_PAID',
                        paymentAmount: form.paymentAmount && Number(form.paymentAmount) < invoiceGrandTotal ? form.paymentAmount : defaultPartial,
                      });
                    }}
                    style={form.paymentStatus === 'PARTIALLY_PAID' ? { background: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' } : {}}
                  >
                    <Wallet size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Partially Paid (Advance)
                  </button>

                  <button
                    type="button"
                    className={`form-toggle-btn ${form.paymentStatus === 'UNPAID' ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, paymentStatus: 'UNPAID', paymentAmount: '0' })}
                    style={form.paymentStatus === 'UNPAID' ? { background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' } : {}}
                  >
                    <Clock size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Unpaid (Pay Later / Udhar)
                  </button>
                </div>

                {/* 4A. FULL PAYMENT DETAILS */}
                {(form.paymentStatus || 'PAID') === 'PAID' && (
                  <div style={{
                    gridColumn: 'span 2',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      gridColumn: 'span 2',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      color: '#065f46'
                    }}>
                      <span>Full Bill Amount to Settle:</span>
                      <b style={{ fontSize: '15px' }}>₹{invoiceGrandTotal.toLocaleString()}</b>
                    </div>

                    <label>
                      Payment Mode *
                      <select
                        value={form.paymentMethod || 'UPI'}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      >
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm / QR)</option>
                        <option value="CASH">Cash</option>
                      </select>
                    </label>

                    <label>
                      Settled Amount (₹)
                      <input
                        type="text"
                        readOnly
                        value={`₹${invoiceGrandTotal.toLocaleString()}`}
                        style={{ background: '#f1f5f9', cursor: 'not-allowed', fontWeight: 600 }}
                      />
                    </label>

                    <label style={{ gridColumn: 'span 2' }}>
                      Transaction Ref / Note (Optional)
                      <input
                        placeholder="e.g. UPI Ref # or Cash received by counter"
                        value={form.transactionReference || ''}
                        onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                      />
                    </label>
                  </div>
                )}

                {/* 4B. PARTIAL PAYMENT (ADVANCE) DETAILS */}
                {form.paymentStatus === 'PARTIALLY_PAID' && (
                  <div style={{
                    gridColumn: 'span 2',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '4px'
                  }}>
                    <label>
                      Advance / Partial Amount Received (₹) *
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 500"
                        value={form.paymentAmount !== undefined ? form.paymentAmount : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || /^\d*\.?\d*$/.test(v)) {
                            setForm({ ...form, paymentAmount: v });
                          }
                        }}
                        required
                      />
                    </label>

                    <label>
                      Payment Mode *
                      <select
                        value={form.paymentMethod || 'UPI'}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      >
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm / QR)</option>
                        <option value="CASH">Cash</option>
                      </select>
                    </label>

                    <div style={{
                      gridColumn: 'span 2',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#1e40af'
                    }}>
                      <span>Total Bill: <b>₹{invoiceGrandTotal.toLocaleString()}</b></span>
                      <span>Receiving Now: <b style={{ color: '#16a34a' }}>₹{Number(form.paymentAmount || 0).toLocaleString()}</b></span>
                      <span>Remaining Balance Due: <b style={{ color: '#dc2626' }}>₹{Math.max(0, invoiceGrandTotal - Number(form.paymentAmount || 0)).toLocaleString()}</b></span>
                    </div>

                    <label style={{ gridColumn: 'span 2' }}>
                      Transaction Ref / Note (Optional)
                      <input
                        placeholder="e.g. UPI Ref # or Advance received by counter"
                        value={form.transactionReference || ''}
                        onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                      />
                    </label>
                  </div>
                )}

                {/* 4C. UNPAID / PAY LATER NOTICE */}
                {form.paymentStatus === 'UNPAID' && (
                  <div style={{
                    gridColumn: 'span 2',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '12.5px',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Clock size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                    <div>
                      <b>Invoice will be generated as Unpaid (Due Balance: ₹{invoiceGrandTotal.toLocaleString()})</b>
                      <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '2px' }}>
                        Abhi koi payment settle nahi hogi. Invoice generate hone ke baad customer se payment Payments page se record ki ja sakti hai.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {modal.page === 'Payments' && (
              <>
                {payableInvoices.length === 0 ? (
                  <div
                    style={{
                      gridColumn: 'span 2',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      margin: '10px 0',
                    }}
                  >
                    <CheckCircle2 size={22} style={{ color: '#059669', flexShrink: 0 }} />
                    <div>
                      <b style={{ fontSize: '14px' }}>All Invoices are Fully Settled!</b>
                      <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                        Filhaal koi bhi unpaid ya partially paid invoice pending nahi hai. All customer payments are up-to-date.
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <label style={{ gridColumn: 'span 2' }}>
                      Select Unpaid / Partially Paid Invoice *
                      <select
                        value={form.invoiceId || payableInvoices[0]?.id || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const inv = payableInvoices.find((i) => String(i.id) === String(selectedId));
                          if (inv) {
                            const grandTotal = Number(inv.grandTotal || 0);
                            const paidAmount = Number(inv.paidAmount || 0);
                            const balance = inv.balanceDue !== undefined
                              ? Number(inv.balanceDue)
                              : Math.max(0, grandTotal - paidAmount);
                            setForm({
                              ...form,
                              invoiceId: inv.id,
                              amount: balance > 0 ? String(balance) : (grandTotal > 0 ? String(grandTotal) : form.amount || ''),
                            });
                          } else {
                            setForm({ ...form, invoiceId: selectedId });
                          }
                        }}
                      >
                        {payableInvoices.map((inv) => {
                          const grandTotal = Number(inv.grandTotal || 0);
                          const paidAmount = Number(inv.paidAmount || 0);
                          const balance = inv.balanceDue !== undefined
                            ? Number(inv.balanceDue)
                            : Math.max(0, grandTotal - paidAmount);
                          const statusDisplay = inv.status === 'PARTIALLY_PAID' ? 'Partially Paid' : (inv.status || 'Unpaid');
                          return (
                            <option key={inv.id} value={inv.id}>
                              {inv.invoiceNumber} — {inv.customerName || 'Customer'} (Due: ₹{balance.toLocaleString()} | Total: ₹{grandTotal.toLocaleString()}) [{statusDisplay}]
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    {(() => {
                      const currentInv = payableInvoices.find((i) => String(i.id) === String(form.invoiceId || payableInvoices[0]?.id));
                      if (!currentInv) return null;
                      const grandTotal = Number(currentInv.grandTotal || 0);
                      const paidAmount = Number(currentInv.paidAmount || 0);
                      const balance = currentInv.balanceDue !== undefined
                        ? Number(currentInv.balanceDue)
                        : Math.max(0, grandTotal - paidAmount);

                      return (
                        <div
                          style={{
                            gridColumn: 'span 2',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            marginBottom: '4px',
                          }}
                        >
                          <div>
                            <span style={{ color: '#64748b' }}>Customer: </span>
                            <b style={{ color: '#0f172a' }}>{currentInv.customerName || '—'}</b>
                            {currentInv.registrationNumber && (
                              <span style={{ color: '#64748b', marginLeft: '8px' }}>({currentInv.registrationNumber})</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>
                              Total: <b>₹{grandTotal.toLocaleString()}</b>
                            </span>
                            <span style={{ color: '#059669' }}>
                              Paid: <b>₹{paidAmount.toLocaleString()}</b>
                            </span>
                            <span style={{ color: '#d97706', fontWeight: 700 }}>
                              Balance Due: ₹{balance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <label>
                      Amount to Pay (₹) *
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 3500.00"
                        value={form.amount !== undefined ? form.amount : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || /^\d*\.?\d*$/.test(v)) setForm({ ...form, amount: v });
                        }}
                        required
                      />
                    </label>
                    <label>
                      Payment Method
                      <select
                        value={form.paymentMethod || 'UPI'}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      >
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm / QR)</option>
                        <option value="CASH">Cash</option>
                      </select>
                    </label>
                    <label style={{ gridColumn: 'span 2' }}>
                      Transaction / UTR Reference
                      <input
                        value={form.transactionReference || ''}
                        onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                        placeholder="e.g. UPI-202611019901 or Counter Receipt"
                      />
                    </label>
                  </>
                )}
              </>
            )}

            {modal.page === 'Expenses' && (
              <>
                <label>
                  Title / Reason *
                  <input
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Electricity Bill, Shop Rent"
                    required
                  />
                </label>
                <label>
                  Category
                  <select
                    value={form.category || 'RENT'}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="RENT">Rent</option>
                    <option value="ELECTRICITY">Electricity</option>
                    <option value="WATER">Water</option>
                    <option value="SALARY">Salary</option>
                    <option value="TOOLS">Tools</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label>
                  Amount (₹) *
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 4500.00"
                    value={form.amount !== undefined ? form.amount : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setForm({ ...form, amount: v });
                    }}
                    required
                  />
                </label>
                <label>
                  Payment Method
                  <select
                    value={form.paymentMethod || 'UPI'}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                  </select>
                </label>
                <label>
                  Expense Date
                  <input
                    type="date"
                    value={form.expenseDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  />
                </label>
                <label>
                  Description
                  <input
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Monthly workshop electricity bill"
                  />
                </label>
              </>
            )}

            {modal.page === 'Service Reminders' && (
              <>
                <label style={{ gridColumn: 'span 2' }}>
                  Select Vehicle *
                  <select
                    value={form.vehicleId || rawData.Vehicles[0]?.id || ''}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  >
                    {rawData.Vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} ({v.vehicleMake} {v.model}) - {v.customerName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Due Date *
                  <input
                    type="date"
                    value={form.dueDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Reminder Type
                  <input
                    value={form.reminderType || '50-day service'}
                    onChange={(e) => setForm({ ...form, reminderType: e.target.value })}
                  />
                </label>
                <label style={{ gridColumn: 'span 2' }}>
                  Custom Message
                  <input
                    value={form.message || ''}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="e.g. Dear customer, your car service is due."
                  />
                </label>
              </>
            )}
          </div>

          <div className="modal-actions">
            <button className="outline" onClick={() => setModal(null)} disabled={loading}>
              Cancel
            </button>
            <button
              className="primary"
              onClick={handleCreateRecord}
              disabled={loading || (modal.page === 'Payments' && payableInvoices.length === 0)}
            >
              {loading
                ? 'Saving to Database...'
                : modal.page === 'Customers'
                  ? 'Save Customer & Vehicle'
                  : modal.page === 'Invoices'
                    ? ((form.paymentStatus || 'PAID') === 'PAID'
                      ? 'Generate & Settle Full Payment'
                      : form.paymentStatus === 'PARTIALLY_PAID'
                        ? 'Generate & Settle Advance'
                        : 'Generate Invoice (Unpaid)')
                    : modal.page === 'Payments'
                      ? (payableInvoices.length === 0 ? 'No Invoices Due' : 'Record Payment')
                      : 'Save Record'}
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {modal?.type === 'edit-customer' && (
        <Modal
          title={`Edit Customer: ${form.fullName || 'Client'}`}
          onClose={() => setModal(null)}
        >
          <div className="form-grid">
            <label>
              <span>Customer Full Name *</span>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={form.fullName || ''}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </label>

            <label>
              <span>Phone Number *</span>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phoneNumber || ''}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                required
              />
            </label>

            <label>
              <span>Email Address</span>
              <input
                type="email"
                placeholder="e.g. customer@example.com"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={form.status || 'Active'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Address / Location</span>
              <textarea
                rows={2}
                placeholder="e.g. House No. 12, Sector 15, New Delhi"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>

            <div
              style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '4px',
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <input
                type="checkbox"
                id="editWhatsappConsent"
                checked={form.whatsappConsent ?? true}
                onChange={(e) => setForm({ ...form, whatsappConsent: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label
                htmlFor="editWhatsappConsent"
                style={{
                  margin: 0,
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#334155',
                  fontWeight: 600,
                }}
              >
                Enable WhatsApp Service Notifications & Invoice Delivery
              </label>
            </div>
          </div>

          <div
            className="modal-actions"
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              className="outline"
              type="button"
              onClick={() => setModal(null)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="primary"
              type="button"
              onClick={handleUpdateCustomer}
              disabled={loading || !form.fullName?.trim() || !form.phoneNumber?.trim()}
            >
              {loading ? 'Updating Customer...' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* DETAIL MODAL */}
      {modal?.type === 'detail' && selected && (
        <Modal title={`${modal.page} Details`} onClose={() => setModal(null)}>
          <div className="detail-list">
            {(tableData[modal.page]?.cols || []).map((col, i) => (
              <div key={col}>
                <small>{col.toUpperCase()}</small>
                {col === 'Status' || col === 'Movement' || col === 'Method' || col === 'Channel' || col === 'Fuel Type' ? (
                  <div>
                    <Badge>{selected.row[i] || '—'}</Badge>
                  </div>
                ) : col === 'Reg. Number' || col === 'Vehicle' ? (
                  <span className="vehicle-reg-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Car size={13} /> {selected.row[i] || '—'}
                  </span>
                ) : (
                  <b>{selected.row[i] || '—'}</b>
                )}
              </div>
            ))}
          </div>

          {/* SERVICE JOBS DETAILS: LABOUR TASKS & PARTS BREAKDOWN */}
          {modal.page === 'Service Jobs' && selected.raw && (
            <div style={{ marginTop: '16px' }}>
              <div className="status-action-row">
                <div>
                  <b style={{ display: 'block', fontSize: '12px', color: '#102344' }}>
                    Update Job Status:
                  </b>
                  <small style={{ color: '#64748b', fontSize: '10px' }}>
                    {selected.raw.status === 'COMPLETED' || selected.raw.status === 'CANCELLED'
                      ? 'Job is finalized. Status cannot be modified.'
                      : 'Select new bay status and click update'}
                  </small>
                </div>
                <select
                  defaultValue={selected.raw.status}
                  id="modal-job-status-select"
                  disabled={selected.raw.status === 'COMPLETED' || selected.raw.status === 'CANCELLED'}
                >
                  {['RECEIVED', 'INSPECTION', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED'].map(
                    (st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    )
                  )}
                </select>
                <button
                  className="primary"
                  disabled={selected.raw.status === 'COMPLETED' || selected.raw.status === 'CANCELLED'}
                  onClick={() => {
                    const sel = document.getElementById('modal-job-status-select');
                    if (sel) handleUpdateJobStatus(selected.raw, sel.value);
                  }}
                >
                  <Check size={14} /> Update Status
                </button>
              </div>

              {/* Tasks & Parts on Job */}
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, margin: '10px 0 6px', color: '#102344' }}>
                  🛠️ Labour Charges on Job:
                </h4>
                {jobTasks.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#888' }}>No labour charges added to this job yet.</p>
                ) : (
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Task Name</th>
                        <th>Status</th>
                        <th>Charge (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobTasks.map((t) => (
                        <tr key={t.id}>
                          <td><b>{t.taskName}</b></td>
                          <td><span className="item-badge-labour">{t.status}</span></td>
                          <td>₹{Number(t.labourCharge || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="inline-add-row" style={{ marginTop: '8px' }}>
                  <input
                    style={{ flex: 2 }}
                    placeholder="e.g. Engine Oil Labour, Brake Pads replacement"
                    value={newLabourTaskName}
                    onChange={(e) => setNewLabourTaskName(e.target.value)}
                  />
                  <input
                    style={{ width: '110px' }}
                    type="text"
                    inputMode="decimal"
                    placeholder="Charge (₹)"
                    value={newLabourCharge}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setNewLabourCharge(v);
                    }}
                  />
                  <button
                    type="button"
                    className="outline"
                    disabled={actionLoading || selected.raw.status === 'COMPLETED'}
                    style={{ height: '34px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    onClick={() => handleAddLabourTask(selected.raw.id)}
                  >
                    + Add Labour
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, margin: '10px 0 6px', color: '#102344' }}>
                  🔩 Spare Parts Used on Job:
                </h4>
                {jobParts.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#888' }}>No spare parts added to this job yet.</p>
                ) : (
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Part Name</th>
                        <th>Qty</th>
                        <th>Price (₹)</th>
                        <th>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobParts.map((p) => (
                        <tr key={p.id}>
                          <td><b>{p.partName}</b></td>
                          <td>{p.quantity}</td>
                          <td>₹{Number(p.unitSellingPrice || 0).toLocaleString()}</td>
                          <td><b>₹{Number(p.totalPrice || 0).toLocaleString()}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="inline-add-row" style={{ marginTop: '8px' }}>
                  <select
                    style={{ flex: 2 }}
                    value={newPartId}
                    onChange={(e) => setNewPartId(e.target.value)}
                  >
                    <option value="">Select Spare Part from inventory...</option>
                    {rawData['Spare Parts'].map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.sellingPrice} (In Stock: {p.stockQuantity})
                      </option>
                    ))}
                  </select>
                  <input
                    style={{ width: '70px' }}
                    type="text"
                    inputMode="numeric"
                    placeholder="Qty"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <button
                    type="button"
                    className="outline"
                    disabled={actionLoading || selected.raw.status === 'COMPLETED'}
                    style={{ height: '34px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    onClick={() => handleAddSparePartToJob(selected.raw.id)}
                  >
                    + Add Part
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INVOICES DETAILS: ITEMIZED BILL TABLE & TOTALS */}
          {modal.page === 'Invoices' && selected.raw && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '14px 0 8px', color: '#334155' }}>
                Itemized Bill (Labour Charges & Spare Parts):
              </h4>

              {selected.raw.items && selected.raw.items.length > 0 ? (
                <table className="items-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Description</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Qty</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Unit Price (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tax / GST</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.raw.items.map((it) => (
                      <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              background: it.itemType === 'LABOUR' ? '#e0f2fe' : '#fef3c7',
                              color: it.itemType === 'LABOUR' ? '#0284c7' : '#d97706',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          >
                            {it.itemType}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{it.description}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{it.quantity}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>₹{Number(it.unitPrice || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>₹{Number(it.taxAmount || 0).toLocaleString()} ({it.taxRate}%)</td>
                        <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>₹{Number(it.lineTotal || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                  No itemized lines recorded on this invoice.
                </p>
              )}

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginTop: '16px',
                  display: 'grid',
                  gap: '8px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Subtotal</span>
                  <b style={{ color: '#0f172a' }}>₹{Number(selected.raw.subtotal || 0).toLocaleString()}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>GST Tax ({selected.raw.taxRate || 18}%):</span>
                  <b style={{ color: '#0f172a' }}>₹{Number(selected.raw.taxAmount || 0).toLocaleString()}</b>
                </div>
                {Number(selected.raw.discount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>Discount:</span>
                    <b style={{ color: '#16a34a' }}>-₹{Number(selected.raw.discount || 0).toLocaleString()}</b>
                  </div>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: '14px', color: '#0f172a' }}>Grand Total</b>
                  <span style={{ color: '#2563eb', fontSize: '18px', fontWeight: 800 }}>
                    ₹{Number(selected.raw.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Amount Paid:</span>
                  <b style={{ color: '#16a34a' }}>₹{Number(selected.raw.paidAmount || 0).toLocaleString()}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Balance Due:</span>
                  <b style={{ color: Math.max(0, Number(selected.raw.grandTotal || 0) - Number(selected.raw.paidAmount || 0)) > 0 ? '#dc2626' : '#94a3b8' }}>
                    ₹{Math.max(0, Number(selected.raw.grandTotal || 0) - Number(selected.raw.paidAmount || 0)).toLocaleString()}
                  </b>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {Math.max(0, Number(selected.raw.grandTotal || 0) - Number(selected.raw.paidAmount || 0)) > 0 && (
                  <button
                    className="primary"
                    style={{
                      background: '#059669',
                      borderColor: '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                      padding: '9px 14px',
                      fontSize: '12px'
                    }}
                    onClick={() => {
                      const inv = selected.raw;
                      setModal(null);
                      setTimeout(() => openAdd('Payments', inv), 50);
                    }}
                  >
                    <Wallet size={15} /> Settle Payment (₹{Math.max(0, Number(selected.raw.grandTotal || 0) - Number(selected.raw.paidAmount || 0)).toLocaleString()})
                  </button>
                )}
                <a
                  href={api.downloadInvoicePdf(selected.raw.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="outline"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    padding: '9px 14px',
                    fontSize: '12px',
                    background: '#f8fafc',
                    borderColor: '#e2e8f0',
                    color: '#0f172a',
                    fontWeight: 600
                  }}
                >
                  <FileText size={15} color="#475569" /> Download PDF
                </a>
                <button
                  disabled={sendingWhatsApp}
                  onClick={() => handleSendWhatsAppInvoice(selected.raw.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontSize: '12px',
                    background: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: sendingWhatsApp ? 'not-allowed' : 'pointer',
                    opacity: sendingWhatsApp ? 0.7 : 1
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  {sendingWhatsApp ? 'Sending WhatsApp...' : 'Send WhatsApp Alert'}
                </button>
              </div>
            </div>
          )}

          {/* SPARE PARTS DETAILS: RESTOCK & MOVEMENTS */}
          {modal.page === 'Spare Parts' && selected.raw && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <b style={{ fontSize: '13px', color: '#102344', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={16} color="#1d4ed8" /> Restock / Add Stock to Inventory
                  </b>
                  <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    In Stock: {selected.raw.stockQuantity ?? 0} units
                  </span>
                </div>

                <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                  Purchased new units from distributor? Enter quantity below to immediately update live inventory.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <label style={{ margin: 0, flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Units to Add *
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 10"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ height: '36px', width: '100%' }}
                    />
                  </label>

                  <button
                    className="primary"
                    type="button"
                    disabled={restockLoading || !restockQty}
                    onClick={() => handleRestockPart(selected.raw.id)}
                    style={{ height: '36px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={15} />
                    {restockLoading ? 'Adding...' : 'Add Stock'}
                  </button>
                </div>
              </div>

              {/* RECENT STOCK MOVEMENTS HISTORY FOR THIS PART */}
              {(() => {
                const partMovements = (rawData['Stock Movements'] || []).filter(
                  (m) => m.sparePartId === selected.raw.id || m.sparePartName === selected.raw.name
                );
                if (partMovements.length === 0) return null;
                return (
                  <div style={{ marginTop: '14px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '8px 0', color: '#102344' }}>
                      Recent Stock Movements for this Part:
                    </h4>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Notes</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partMovements.slice(0, 5).map((m) => (
                          <tr key={m.id}>
                            <td>
                              <Badge>{m.movementType}</Badge>
                            </td>
                            <td>
                              <b style={{ color: m.movementType === 'PURCHASE' ? '#059669' : '#dc2626' }}>
                                {m.movementType === 'PURCHASE' ? `+${m.quantity}` : `-${m.quantity}`}
                              </b>
                            </td>
                            <td>{m.notes || '—'}</td>
                            <td>{m.createdAt ? m.createdAt.slice(0, 10) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SERVICE REMINDERS DETAILS: WHATSAPP ACTION CARD */}
          {modal.page === 'Service Reminders' && selected.raw && (
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <b style={{ fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bell size={15} color="#2563eb" /> Send Service Reminder Alert
                  </b>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Send scheduled service reminder message to customer {selected.raw.customerName ? `(${selected.raw.customerName})` : ''} on WhatsApp.
                  </p>
                </div>
                <button
                  disabled={sendingReminderId === selected.raw.id}
                  onClick={() => handleSendWhatsAppReminder(selected.raw.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontSize: '12px',
                    background: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: sendingReminderId === selected.raw.id ? 'not-allowed' : 'pointer',
                    opacity: sendingReminderId === selected.raw.id ? 0.7 : 1,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  {sendingReminderId === selected.raw.id ? 'Sending WhatsApp...' : 'Send WhatsApp Alert'}
                </button>
              </div>
            </div>
          )}

          {/* CUSTOMERS DETAILS: REGISTERED VEHICLES TABLE */}
          {modal.page === 'Customers' && selected.raw && (() => {
            const customerVehicles = (rawData['Vehicles'] || []).filter(
              (v) => v.customerId === selected.raw.id
            );
            return (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '14px 0 8px', color: '#334155' }}>
                  🚗 Registered Vehicles ({customerVehicles.length}):
                </h4>
                {customerVehicles.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                    No vehicles registered for this customer yet.
                  </p>
                ) : (
                  <table className="items-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Reg. Number</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Make & Model</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Fuel Type</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Odometer</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerVehicles.map((v) => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                            <span className="vehicle-reg-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Car size={13} /> {v.registrationNumber}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#334155' }}>{v.make || v.vehicleMake} {v.model}</td>
                          <td style={{ padding: '10px 12px' }}><Badge>{v.fuelType || 'PETROL'}</Badge></td>
                          <td style={{ padding: '10px 12px', color: '#334155' }}>{v.odometerReading ? `${Number(v.odometerReading).toLocaleString()} KM` : '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#334155' }}>{v.year || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })()}

          {/* VEHICLES DETAILS: SERVICE JOBS HISTORY TABLE */}
          {modal.page === 'Vehicles' && selected.raw && (() => {
            const vehicleJobs = (rawData['Service Jobs'] || []).filter(
              (j) => j.vehicleId === selected.raw.id || j.registrationNumber === selected.raw.registrationNumber
            );
            return (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '14px 0 8px', color: '#334155' }}>
                  🔧 Service Job History ({vehicleJobs.length}):
                </h4>
                {vehicleJobs.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                    No service jobs recorded for this vehicle yet.
                  </p>
                ) : (
                  <table className="items-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Job No.</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Complaint / Work</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleJobs.map((j) => (
                        <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{j.jobNumber}</td>
                          <td style={{ padding: '10px 12px', color: '#334155' }}>{j.customerComplaint || 'General Service'}</td>
                          <td style={{ padding: '10px 12px' }}><Badge>{j.status}</Badge></td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{j.receivedDate || (j.createdAt ? j.createdAt.slice(0, 10) : '—')}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>₹{Number(j.estimatedCost || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })()}

          {/* PAYMENTS DETAILS: SUMMARY CARD */}
          {modal.page === 'Payments' && selected.raw && (
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'grid',
                  gap: '10px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>SETTLED AMOUNT</span>
                  <span style={{ color: '#16a34a', fontSize: '20px', fontWeight: 800 }}>
                    ₹{Number(selected.raw.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <Badge>{selected.raw.paymentMethod || selected.raw.paymentMode || 'CASH'}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Transaction Ref / Note:</span>
                  <b style={{ color: '#0f172a' }}>{selected.raw.transactionRef || selected.raw.notes || '—'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Invoice Number:</span>
                  <b style={{ color: '#0f172a' }}>{selected.raw.invoiceNumber || '—'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Payment Date:</span>
                  <b style={{ color: '#0f172a' }}>{selected.raw.paymentDate ? selected.raw.paymentDate.slice(0, 10) : '—'}</b>
                </div>
              </div>
            </div>
          )}

          {/* EXPENSES DETAILS: SUMMARY CARD */}
          {modal.page === 'Expenses' && selected.raw && (
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'grid',
                  gap: '10px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>EXPENSE AMOUNT</span>
                  <span style={{ color: '#dc2626', fontSize: '20px', fontWeight: 800 }}>
                    ₹{Number(selected.raw.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <Badge>{selected.raw.paymentMethod || 'CASH'}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Category:</span>
                  <b style={{ color: '#0f172a' }}>{selected.raw.category || 'General'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Notes / Description:</span>
                  <b style={{ color: '#0f172a' }}>{selected.raw.description || selected.raw.title || '—'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Expense Date:</span>
                  <b style={{ color: '#0f172a' }}>{selected.raw.expenseDate || '—'}</b>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS DETAILS: SUMMARY CARD */}
          {modal.page === 'Notifications' && selected.raw && (
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'grid',
                  gap: '10px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>DELIVERY STATUS</span>
                  <Badge>{selected.raw.status || 'SENT'}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Channel:</span>
                  <Badge>{selected.raw.channel || 'WHATSAPP'}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Recipient:</span>
                  <b style={{ color: '#0f172a' }}>{selected.raw.recipient || '—'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>External Message ID:</span>
                  <code style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                    {selected.raw.externalMessageId || '—'}
                  </code>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Message Preview:</span>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', color: '#334155', whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: 1.5 }}>
                    {selected.raw.content || selected.raw.message || '—'}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="modal-actions" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #edf0f4', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {modal.page === 'Customers' && selected?.raw && (
              <button
                type="button"
                className="outline"
                style={{
                  borderRadius: '8px',
                  padding: '9px 18px',
                  background: '#f0fdf4',
                  borderColor: '#86efac',
                  color: '#166534',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginRight: 'auto',
                }}
                onClick={() => {
                  const custToEdit = selected.raw;
                  setModal(null);
                  setTimeout(() => openEditCustomer(custToEdit), 50);
                }}
              >
                <Pencil size={14} /> Edit Customer
              </button>
            )}
            <button
              className="outline"
              style={{
                borderRadius: '8px',
                padding: '9px 20px',
                background: '#f8fafc',
                borderColor: '#e2e8f0',
                color: '#334155',
                fontWeight: 600
              }}
              onClick={() => setModal(null)}
            >
              Close
            </button>
            <button
              className="primary"
              style={{
                borderRadius: '8px',
                padding: '9px 22px',
                background: '#0f172a',
                borderColor: '#0f172a',
                color: '#ffffff',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => {
                setModal(null);
                toast('Record viewed');
              }}
            >
              <Check size={16} /> Done
            </button>
          </div>
        </Modal>
      )}

      {/* QUICK ADD MODAL */}
      {modal?.type === 'quick' && (
        <Modal title="Quick Add Record" onClose={() => setModal(null)}>
          <p className="quick-copy">Choose what you want to create directly in the backend.</p>
          <div className="quick-grid">
            <button
              className="quick-option"
              style={{ gridColumn: 'span 2', background: '#eef4ff', borderColor: '#bfdbfe' }}
              onClick={() => openAdd('Customers')}
            >
              <Plus size={16} /> <b>+ Customer & Vehicle (One-Step Entry)</b>
            </button>
            <button
              className="quick-option"
              style={{ gridColumn: 'span 2', background: '#f0fdf4', borderColor: '#bbf7d0' }}
              onClick={() => openAdd('Invoices')}
            >
              <Receipt size={16} /> <b>+ Invoice (with Labour & Parts Breakdown)</b>
            </button>
            {[
              'Service Jobs',
              'Spare Parts',
              'Payments',
              'Expenses',
              'Service Reminders',
            ].map((p) => (
              <button key={p} className="quick-option" onClick={() => openAdd(p)}>
                <Plus size={16} />
                {p}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
