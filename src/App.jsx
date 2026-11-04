import React, { useEffect, useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, Car, Wrench, Package, ArrowLeftRight,
  Receipt, Wallet, IndianRupee, CalendarClock, Bell, ChartNoAxesCombined,
  Settings, Search, Plus, ChevronDown, ChevronRight, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertTriangle,
  Menu, X, Download, Filter, Send, FileText, Check, Trash2, LogOut
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
  ['Settings', Settings],
];

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
                      {page === 'Service Reminders' && (
                        <button
                          className="outline"
                          disabled={sendingReminderId === rawItem.id}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            marginRight: '6px',
                            borderColor: '#2563eb',
                            color: '#1d4ed8',
                            background: '#eff6ff',
                            fontWeight: 600,
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          onClick={() => onSendReminder && onSendReminder(rawItem.id)}
                          title="Send WhatsApp Reminder to Customer"
                        >
                          <Send size={12} /> {sendingReminderId === rawItem.id ? 'Sending...' : 'WhatsApp'}
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
  const [page, setPage] = useState('Dashboard');
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
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserMenuOpen(false);
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
          discount: '0',
          paymentStatus: 'PAID',
          paymentMethod: 'UPI',
        });
        fetchJobBreakdown(availableJob.id);
      } else {
        setForm({
          taxRate: '18',
          discount: '0',
          paymentStatus: 'PAID',
          paymentMethod: 'UPI',
        });
      }
    } else if (p === 'Payments' && initialData) {
      const balance = Math.max(0, Number(initialData.grandTotal || 0) - Number(initialData.paidAmount || 0));
      setForm({
        invoiceId: initialData.id,
        amount: String(balance > 0 ? balance : initialData.grandTotal || ''),
        paymentMethod: 'UPI',
      });
    }

    setModal({ type: 'add', page: p });
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

        // Automatically settle and record payment if 'PAID' (default)
        if (form.paymentStatus !== 'UNPAID' && invRes?.id) {
          const payAmt = form.paymentAmount !== undefined && form.paymentAmount !== ''
            ? parseFloat(form.paymentAmount)
            : Number(invRes.grandTotal || invoiceGrandTotal || 0);

          if (payAmt > 0) {
            await api.createPayment(invRes.id, {
              invoiceId: invRes.id,
              amount: payAmt,
              paymentMethod: form.paymentMethod || 'UPI',
              transactionReference: form.transactionReference || ('TXN-' + Date.now().toString().slice(-6)),
              notes: form.paymentNotes || 'Payment settled on invoice generation',
            });
            toast('Invoice generated & Payment settled successfully!');
          } else {
            toast('Invoice generated successfully!');
          }
        } else {
          toast('Invoice generated successfully (Marked Unpaid / Due)!');
        }
      } else if (p === 'Payments') {
        const invId = form.invoiceId || rawData.Invoices[0]?.id;
        if (!invId) throw new Error('Please select an invoice first');
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
      } catch (_) {}

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
      const msg = res?.message || 'Service reminder sent to customer on WhatsApp successfully!';
      toast(msg);
      await fetchAllData();
    } catch (e) {
      let raw = e?.message || 'Failed to send service reminder';
      let clean = 'Could not send WhatsApp reminder. Please check customer phone number.';
      try {
        if (raw.includes('{') && raw.includes('}')) {
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          const parsed = JSON.parse(raw.substring(start, end + 1));
          raw = parsed.message || parsed.error?.message || (typeof parsed.error === 'string' ? parsed.error : '');
        }
      } catch (_) {}

      if (raw) {
        if (raw.includes('(#131030)')) {
          clean = 'Customer phone number is not allowed on Meta test account.';
        } else if (raw.includes('(#132001)')) {
          clean = 'WhatsApp reminder template not found or pending approval.';
        } else if (raw.includes('(#131026)')) {
          clean = 'Message undeliverable to this phone number.';
        } else {
          clean = raw.replace(/^Error \d+:\s*/i, '')
                     .replace(/^WhatsApp API error:\s*/i, '')
                     .trim();
        }
      }
      toast(clean || 'Could not send WhatsApp reminder');
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
          toast(`Welcome! Logged in as ${user?.fullName || user?.email || 'User'}`);
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
                    className="user-dropdown-item"
                    onClick={() => {
                      setPage('Settings');
                      setUserMenuOpen(false);
                    }}
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </button>
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
                        Settings: 'Garage profile, GST rates, and notification preferences.',
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
              ) : page === 'Reports' ? (
                <ReportsPage
                  summary={dashboardSummary}
                  rawData={rawData}
                  onRefresh={fetchAllData}
                />
              ) : (
                <SettingsPage toast={toast} />
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
                    type="number"
                    value={form.year || '2023'}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    placeholder="e.g. 2022"
                  />
                </label>
                <label>
                  Current Odometer (KM)
                  <input
                    type="number"
                    value={form.odometerReading || ''}
                    onChange={(e) => setForm({ ...form, odometerReading: e.target.value })}
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
                    type="number"
                    value={form.year || '2023'}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    placeholder="e.g. 2022"
                  />
                </label>
                <label>
                  Odometer Reading (KM)
                  <input
                    type="number"
                    value={form.odometerReading || ''}
                    onChange={(e) => setForm({ ...form, odometerReading: e.target.value })}
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
                      type="number"
                      min="0"
                      value={form.odometerReading !== undefined ? form.odometerReading : (prevOdo > 0 ? prevOdo : '')}
                      onChange={(e) => setForm({ ...form, odometerReading: e.target.value })}
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
                  <Wrench size={16} /> 1. Labour Charges (Work Done / Majdoori)
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
                    type="number"
                    min="0"
                    placeholder="Charge (₹)"
                    value={newLabourCharge}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseFloat(v) >= 0) setNewLabourCharge(v);
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
                  <Package size={16} /> 2. Spare Parts Used (Purtay)
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
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(e.target.value)}
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
                    type="number"
                    min="0"
                    value={form.taxRate || '18'}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseFloat(v) >= 0) setForm({ ...form, taxRate: v });
                    }}
                  />
                </label>
                <label>
                  Discount Amount (₹)
                  <input
                    type="number"
                    min="0"
                    value={form.discount || '0'}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseFloat(v) >= 0) setForm({ ...form, discount: v });
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
                  <Wallet size={16} /> 4. Payment Settlement (Bhugtan)
                </div>

                <div className="form-toggle-bar">
                  <button
                    type="button"
                    className={`form-toggle-btn ${(form.paymentStatus || 'PAID') === 'PAID' ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, paymentStatus: 'PAID' })}
                    style={(form.paymentStatus || 'PAID') === 'PAID' ? { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' } : {}}
                  >
                    <CheckCircle2 size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Receive Payment Now (Full / Settled)
                  </button>
                  <button
                    type="button"
                    className={`form-toggle-btn ${form.paymentStatus === 'UNPAID' ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, paymentStatus: 'UNPAID' })}
                    style={form.paymentStatus === 'UNPAID' ? { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' } : {}}
                  >
                    Keep as Unpaid (Pay Later / Udhar)
                  </button>
                </div>

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
                      Amount Received (₹) *
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.paymentAmount !== undefined ? form.paymentAmount : invoiceGrandTotal}
                        onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
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
              </>
            )}

            {modal.page === 'Payments' && (
              <>
                <label style={{ gridColumn: 'span 2' }}>
                  Select Invoice *
                  <select
                    value={form.invoiceId || rawData.Invoices[0]?.id || ''}
                    onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
                  >
                    {rawData.Invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.customerName} (Total: ₹{inv.grandTotal})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount (₹) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseFloat(v) >= 0) setForm({ ...form, amount: v });
                    }}
                    placeholder="e.g. 3500.00"
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
                <label style={{ gridColumn: 'span 2' }}>
                  Transaction / UTR Reference
                  <input
                    value={form.transactionReference || ''}
                    onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                    placeholder="e.g. UPI-202611019901"
                  />
                </label>
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
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseFloat(v) >= 0) setForm({ ...form, amount: v });
                    }}
                    placeholder="e.g. 4500.00"
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
            <button className="primary" onClick={handleCreateRecord} disabled={loading}>
              {loading
                ? 'Saving to Database...'
                : modal.page === 'Customers'
                ? 'Save Customer & Vehicle'
                : modal.page === 'Invoices'
                ? ((form.paymentStatus || 'PAID') === 'PAID' ? 'Generate & Settle Payment' : 'Generate Invoice')
                : 'Save Record'}
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
                <small>{col}</small>
                <b>{selected.row[i] || '—'}</b>
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
                    type="number"
                    min="0"
                    placeholder="Charge (₹)"
                    value={newLabourCharge}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || parseFloat(v) >= 0) setNewLabourCharge(v);
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
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(e.target.value)}
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
              <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '14px 0 6px', color: '#102344' }}>
                Itemized Bill (Labour Charges & Spare Parts):
              </h4>

              {selected.raw.items && selected.raw.items.length > 0 ? (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit Price (₹)</th>
                      <th>Tax / GST</th>
                      <th>Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.raw.items.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <span className={it.itemType === 'LABOUR' ? 'item-badge-labour' : 'item-badge-part'}>
                            {it.itemType}
                          </span>
                        </td>
                        <td><b>{it.description}</b></td>
                        <td>{it.quantity}</td>
                        <td>₹{Number(it.unitPrice || 0).toLocaleString()}</td>
                        <td>₹{Number(it.taxAmount || 0).toLocaleString()} ({it.taxRate}%)</td>
                        <td><b>₹{Number(it.lineTotal || 0).toLocaleString()}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                  No itemized lines recorded on this invoice.
                </p>
              )}

              <div className="bill-summary-box">
                <div className="bill-summary-row">
                  <span>Subtotal:</span>
                  <b>₹{Number(selected.raw.subtotal || 0).toLocaleString()}</b>
                </div>
                <div className="bill-summary-row">
                  <span>GST Tax ({selected.raw.taxRate || 18}%):</span>
                  <b>₹{Number(selected.raw.taxAmount || 0).toLocaleString()}</b>
                </div>
                {Number(selected.raw.discount || 0) > 0 && (
                  <div className="bill-summary-row" style={{ color: '#059669' }}>
                    <span>Discount:</span>
                    <b>-₹{Number(selected.raw.discount || 0).toLocaleString()}</b>
                  </div>
                )}
                <div className="bill-summary-row total">
                  <span>Grand Total:</span>
                  <span style={{ color: '#1d4ed8', fontSize: '15px' }}>
                    ₹{Number(selected.raw.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bill-summary-row">
                  <span>Amount Paid:</span>
                  <b style={{ color: '#059669' }}>₹{Number(selected.raw.paidAmount || 0).toLocaleString()}</b>
                </div>
                <div className="bill-summary-row">
                  <span>Balance Due:</span>
                  <b style={{ color: '#dc2626' }}>
                    ₹{Math.max(0, Number(selected.raw.grandTotal || 0) - Number(selected.raw.paidAmount || 0)).toLocaleString()}
                  </b>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Math.max(0, Number(selected.raw.grandTotal || 0) - Number(selected.raw.paidAmount || 0)) > 0 && (
                  <button
                    className="primary"
                    style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
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
                  style={{ textDecoration: 'none' }}
                >
                  <FileText size={15} /> Download PDF
                </a>
                <button
                  className="primary"
                  disabled={sendingWhatsApp}
                  onClick={() => handleSendWhatsAppInvoice(selected.raw.id)}
                >
                  <Send size={15} /> {sendingWhatsApp ? 'Sending WhatsApp...' : 'Send WhatsApp Alert'}
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
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={restockQty}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || parseInt(v, 10) >= 0) setRestockQty(v);
                      }}
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

          {/* SERVICE REMINDERS DETAILS: ACTION BUTTON TO SEND WHATSAPP */}
          {modal.page === 'Service Reminders' && selected.raw && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <b style={{ fontSize: '13px', color: '#102344', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarClock size={16} color="#1d4ed8" /> WhatsApp Service Reminder
                  </b>
                  <Badge>{selected.raw.status || (selected.raw.completed ? 'Completed' : 'Upcoming')}</Badge>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                  Send an official WhatsApp service due alert directly to <b>{selected.raw.customerName || 'the customer'}</b> for vehicle <b>{selected.raw.registrationNumber}</b>.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    className="primary"
                    disabled={sendingReminderId === selected.raw.id}
                    onClick={() => handleSendWhatsAppReminder(selected.raw.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={15} /> {sendingReminderId === selected.raw.id ? 'Sending WhatsApp...' : 'Send WhatsApp Reminder Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button className="outline" onClick={() => setModal(null)}>
              Close
            </button>
            <button
              className="primary"
              onClick={() => {
                setModal(null);
                toast('Record viewed');
              }}
            >
              Done
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

function SettingsPage({ toast }) {
  const [tab, setTab] = useState('Garage Profile');

  return (
    <section className="panel settings-panel">
      <div className="settings-tabs">
        {['Garage Profile', 'Invoice Settings', 'Notifications', 'Preferences'].map((t) => (
          <button
            className={tab === t ? 'selected' : ''}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Garage Profile' ? (
        <>
          <h3>Garage Information</h3>
          <p className="settings-sub">These details appear on invoices and customer notifications.</p>
          <div className="settings-grid">
            {[
              ['Garage Name', 'AutoCare Garage'],
              ['Phone Number', '+91 98765 43210'],
              ['Email', 'hello@autocaregarage.in'],
              ['GST Number', '07AAAAA0000A1Z5'],
              ['Address', 'Lajpat Nagar, New Delhi'],
              ['Pincode', '110024'],
            ].map((x) => (
              <label key={x[0]}>
                {x[0]}
                <input defaultValue={x[1]} placeholder={'Enter ' + x[0].toLowerCase()} />
              </label>
            ))}
          </div>
        </>
      ) : tab === 'Invoice Settings' ? (
        <>
          <h3>Invoice Configuration</h3>
          <div className="settings-grid">
            {[
              ['Invoice Prefix', 'INV'],
              ['Default GST (%)', '18'],
              ['Payment Due (days)', '7'],
              ['Terms & Conditions', 'Payment due on delivery'],
            ].map((x) => (
              <label key={x[0]}>
                {x[0]}
                <input defaultValue={x[1]} />
              </label>
            ))}
          </div>
        </>
      ) : tab === 'Notifications' ? (
        <>
          <h3>Notification Preferences</h3>
          {[
            'WhatsApp service updates',
            'Invoice PDF delivery',
            'Payment confirmations',
            '50-day service reminders',
          ].map((x) => (
            <label className="toggle-row" key={x}>
              {x}
              <input type="checkbox" defaultChecked />
            </label>
          ))}
        </>
      ) : (
        <>
          <h3>Preferences</h3>
          <div className="settings-grid">
            <label>
              Currency
              <select defaultValue="INR">
                <option>INR (₹)</option>
              </select>
            </label>
            <label>
              Timezone
              <select defaultValue="Asia/Kolkata">
                <option>Asia/Kolkata (IST)</option>
              </select>
            </label>
          </div>
        </>
      )}

      <button className="primary" onClick={() => toast('Settings saved successfully')}>
        Save Changes
      </button>
    </section>
  );
}
