const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.carcarehubgp.in/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cch_auth_token');
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `Error ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        errorMsg = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch (e) {
        // Not JSON
      }
      throw new Error(errorMsg);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => {
    localStorage.removeItem('cch_auth_token');
    localStorage.removeItem('cch_auth_user');
  },

  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),
  getMonthlyRevenue: (startDate, endDate) => 
    request(`/dashboard/monthly-revenue?startDate=${startDate}&endDate=${endDate}`),

  // Customers
  getCustomers: () => request('/customers/all'),
  getCustomerById: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCustomer: (id, data) => request(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Vehicles
  getVehicles: () => request('/vehicles'),
  getVehicleById: (id) => request(`/vehicles/${id}`),
  createVehicle: (customerId, data) => request(`/vehicles/customer/${customerId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateVehicle: (id, data) => request(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),

  // Service Jobs
  getServiceJobs: () => request('/service-jobs'),
  getServiceJobById: (id) => request(`/service-jobs/${id}`),
  createServiceJob: (vehicleId, data) => request(`/service-jobs/vehicle/${vehicleId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateServiceJobStatus: (id, status) => request(`/service-jobs/${id}/status?status=${status}`, {
    method: 'PATCH',
  }),

  // Job Tasks (Labour Charges)
  getTasksByServiceJob: (serviceJobId) => request(`/job-tasks/service-job/${serviceJobId}`),
  createJobTask: (serviceJobId, data) => request(`/job-tasks/service-job/${serviceJobId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateJobTaskStatus: (id, status) => request(`/job-tasks/${id}/status?status=${status}`, {
    method: 'PATCH',
  }),
  deleteJobTask: (id) => request(`/job-tasks/${id}`, { method: 'DELETE' }),

  // Job Parts (Spare Parts Used in Job)
  getPartsByServiceJob: (serviceJobId) => request(`/job-parts/service-job/${serviceJobId}`),
  addPartToJob: (serviceJobId, data) => request(`/job-parts/service-job/${serviceJobId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteJobPart: (id) => request(`/job-parts/${id}`, { method: 'DELETE' }),

  // Spare Parts Catalogue
  getSpareParts: () => request('/spare-parts'),
  getActiveSpareParts: () => request('/spare-parts/active'),
  getLowStockSpareParts: () => request('/spare-parts/low-stock'),
  createSparePart: (data) => request('/spare-parts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSparePart: (id, data) => request(`/spare-parts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Stock Movements
  getStockMovements: () => request('/stock-movements'),
  createStockMovement: (data) => request('/stock-movements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Invoices
  getInvoices: () => request('/invoices'),
  getInvoiceById: (id) => request(`/invoices/${id}`),
  createInvoice: (serviceJobId, data) => request(`/invoices/service-job/${serviceJobId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  sendInvoiceWhatsApp: (invoiceId) => request(`/invoices/${invoiceId}/send-whatsapp`, {
    method: 'POST',
  }),
  downloadInvoicePdf: (invoiceId) => `${API_BASE_URL}/invoices/${invoiceId}/pdf`,

  // Payments
  getPayments: () => request('/payments'),
  createPayment: (invoiceId, data) => request(`/payments/invoice/${invoiceId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Expenses
  getExpenses: () => request('/expenses'),
  createExpense: (data) => request('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Service Reminders
  getServiceReminders: () => request('/service-reminders'),
  createServiceReminder: (data) => request('/service-reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  completeServiceReminder: (id) => request(`/service-reminders/${id}/complete`, {
    method: 'PATCH',
  }),
  deleteServiceReminder: (id) => request(`/service-reminders/${id}`, {
    method: 'DELETE',
  }),

  // Notifications
  getNotifications: () => request('/notifications'),
};
