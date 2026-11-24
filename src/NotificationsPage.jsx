import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Check,
  CheckCheck,
  Clock,
  User,
  Phone,
  ExternalLink,
  Table as TableIcon,
  MessageCircle,
  RefreshCw,
  Car,
  Calendar,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Download,
} from 'lucide-react';

export default function NotificationsPage({
  notifications = [],
  customers = [],
  vehicles = [],
  loading = false,
  onRefresh,
  toast,
}) {
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'incoming' | 'outgoing'
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Quick reply templates
  const quickReplies = [
    '🚗 Your vehicle service is completed and ready for pickup!',
    '🔧 We are currently inspecting your vehicle. Will update you shortly.',
    '🧾 Please find your invoice details and payment link.',
    '🙏 Thank you for choosing CarCareHub! Have a great drive.',
  ];

  // Map customers by clean phone number and by id
  const { customerByPhone, customerById } = useMemo(() => {
    const byPhone = {};
    const byId = {};
    (customers || []).forEach((c) => {
      if (c.id) byId[c.id] = c;
      if (c.phoneNumber || c.phone) {
        const raw = String(c.phoneNumber || c.phone);
        const clean = raw.replace(/\D/g, '');
        if (clean) {
          byPhone[clean] = c;
          if (clean.length >= 10) {
            byPhone[clean.slice(-10)] = c;
          }
        }
      }
    });
    return { customerByPhone: byPhone, customerById: byId };
  }, [customers]);

  // Map vehicles by customerId
  const vehiclesByCustomer = useMemo(() => {
    const map = {};
    (vehicles || []).forEach((v) => {
      const cid = v.customerId;
      if (!cid) return;
      if (!map[cid]) map[cid] = [];
      map[cid].push(v);
    });
    return map;
  }, [vehicles]);

  // Helper to normalize phone numbers
  const normalizePhone = (num) => {
    if (!num) return '';
    return String(num).replace(/\D/g, '');
  };

  // Group notifications into conversations by recipient
  const conversations = useMemo(() => {
    const groups = {};

    (notifications || []).forEach((n) => {
      const rawRec = n.recipient || 'Unknown';
      const cleanPhone = normalizePhone(rawRec);
      const key = cleanPhone || rawRec;

      if (!groups[key]) {
        // Resolve customer
        const matchedCust =
          (n.referenceId && customerById[n.referenceId]) ||
          customerByPhone[cleanPhone] ||
          (cleanPhone.length >= 10 ? customerByPhone[cleanPhone.slice(-10)] : null);

        const displayName =
          n.customerName ||
          matchedCust?.fullName ||
          matchedCust?.name ||
          (cleanPhone ? `+${cleanPhone}` : rawRec);

        const custVehicles = matchedCust?.id ? vehiclesByCustomer[matchedCust.id] || [] : [];

        groups[key] = {
          key,
          recipient: rawRec,
          cleanPhone,
          displayName,
          customer: matchedCust,
          vehicles: custVehicles,
          messages: [],
          incomingCount: 0,
          lastActivity: n.createdAt || n.sentAt || '',
        };
      }

      groups[key].messages.push(n);
      if (n.direction === 'INCOMING' || n.notificationType === 'CUSTOMER_MESSAGE') {
        groups[key].incomingCount += 1;
      }
    });

    // Sort messages inside each group chronologically (oldest to newest)
    const list = Object.values(groups).map((group) => {
      group.messages.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.sentAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.sentAt || 0).getTime();
        return timeA - timeB;
      });
      const lastMsg = group.messages[group.messages.length - 1];
      group.lastMessage = lastMsg;
      group.lastActivity = lastMsg?.createdAt || lastMsg?.sentAt || '';
      return group;
    });

    // Sort conversations by latest activity descending
    list.sort((a, b) => {
      const timeA = new Date(a.lastActivity || 0).getTime();
      const timeB = new Date(b.lastActivity || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [notifications, customerByPhone, customerById, vehiclesByCustomer]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.displayName.toLowerCase().includes(q) ||
        c.recipient.toLowerCase().includes(q) ||
        c.messages.some((m) => (m.message || '').toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterType === 'incoming') {
        return c.incomingCount > 0;
      }
      if (filterType === 'outgoing') {
        return c.incomingCount === 0;
      }
      return true;
    });
  }, [conversations, searchQuery, filterType]);

  // Set default selected conversation
  const activeChat = useMemo(() => {
    if (selectedRecipient) {
      const found = conversations.find((c) => c.key === selectedRecipient);
      if (found) return found;
    }
    return filteredConversations[0] || conversations[0] || null;
  }, [selectedRecipient, conversations, filteredConversations]);

  // Format date helper
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return 'Today ' + formatTime(isoString);
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + formatTime(isoString);
    } catch {
      return isoString;
    }
  };

  // Status icon renderer for outgoing messages
  const renderStatusIcon = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'READ') {
      return <CheckCheck size={14} style={{ color: '#2563eb' }} title="Read by Customer" />;
    }
    if (s === 'DELIVERED') {
      return <CheckCheck size={14} style={{ color: '#6b7280' }} title="Delivered to Phone" />;
    }
    if (s === 'SENT') {
      return <Check size={14} style={{ color: '#9ca3af' }} title="Sent" />;
    }
    return <Clock size={13} style={{ color: '#9ca3af' }} title={s || 'Pending'} />;
  };

  // Handle open in WhatsApp Web / Send
  const handleOpenWhatsApp = (customText) => {
    if (!activeChat) return;
    const phone = activeChat.cleanPhone;
    if (!phone) {
      if (toast) toast('No valid phone number for this recipient');
      return;
    }
    const textToSend = customText !== undefined ? customText : replyText;
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(textToSend || '')}`;
    window.open(url, '_blank');
    if (customText === undefined && replyText) {
      setReplyText('');
      if (toast) toast('Opened in WhatsApp Web');
    }
  };

  // Export CSV for Audit Table
  const handleExportCSV = () => {
    if (!notifications || notifications.length === 0) {
      if (toast) toast('No notifications to export');
      return;
    }
    const headers = ['ID', 'Direction', 'Recipient', 'Customer', 'Type', 'Message', 'Status', 'Sent At'];
    const rows = notifications.map((n) => [
      `#${n.id}`,
      n.direction || (n.notificationType === 'CUSTOMER_MESSAGE' ? 'INCOMING' : 'OUTGOING'),
      n.recipient || '—',
      n.customerName || '—',
      n.notificationType || 'WHATSAPP',
      `"${(n.message || '').replace(/"/g, '""')}"`,
      n.status || 'DELIVERED',
      n.createdAt || n.sentAt || '—',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `carcarehub_whatsapp_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (toast) toast('Exported notification logs CSV');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Banner / Heading */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={15} style={{ color: '#16a34a' }} /> WhatsApp Messenger & Notifications
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: '700' }}>WhatsApp Inbox</h1>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
            Live customer WhatsApp replies, reminder dispatches, and invoice delivery audit.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              onClick={() => setActiveView('chat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView === 'chat' ? '#ffffff' : 'transparent',
                color: activeView === 'chat' ? '#0f172a' : '#64748b',
                boxShadow: activeView === 'chat' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <MessageCircle size={15} /> Chat View
            </button>
            <button
              onClick={() => setActiveView('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView === 'table' ? '#ffffff' : 'transparent',
                color: activeView === 'table' ? '#0f172a' : '#64748b',
                boxShadow: activeView === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <TableIcon size={15} /> Delivery Logs
            </button>
          </div>

          {onRefresh && (
            <button
              className="outline"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh messages from server"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
            >
              <RefreshCw size={14} className={loading ? 'cch-spinner' : ''} />
              Refresh
            </button>
          )}

          {activeView === 'table' && (
            <button
              className="outline"
              onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === 'chat' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '360px 1fr',
            height: 'calc(100vh - 240px)',
            minHeight: '620px',
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* ================= LEFT COLUMN: CONVERSATION LIST ================= */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid #e2e8f0',
              backgroundColor: '#fbfcfd',
            }}
          >
            {/* Header & Search */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                  Conversations ({conversations.length})
                </span>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search customer, phone or text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'incoming', label: 'Customer Replies' },
                  { id: 'outgoing', label: 'Outgoing Only' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: filterType === f.id ? '#0f172a' : '#f1f5f9',
                      color: filterType === f.id ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {filteredConversations.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <MessageSquare size={32} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: '13px' }}>No conversations found</span>
                </div>
              ) : (
                filteredConversations.map((item) => {
                  const isSelected = activeChat && activeChat.key === item.key;
                  const lastMsg = item.lastMessage;
                  const isIncoming =
                    lastMsg?.direction === 'INCOMING' || lastMsg?.notificationType === 'CUSTOMER_MESSAGE';

                  // Initials
                  const initials = item.displayName
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={item.key}
                      onClick={() => setSelectedRecipient(item.key)}
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        gap: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isSelected ? '#ffffff' : 'transparent',
                        borderLeft: isSelected ? '4px solid #0f172a' : '4px solid transparent',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          backgroundColor: isIncoming ? '#22c55e' : '#0f172a',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '700',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        {initials || <User size={18} />}
                        {item.incomingCount > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-3px',
                              right: '-3px',
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: '700',
                              borderRadius: '10px',
                              padding: '1px 5px',
                              border: '2px solid #fff',
                            }}
                          >
                            {item.incomingCount}
                          </span>
                        )}
                      </div>

                      {/* Info & Snippet */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: isSelected ? '700' : '600',
                              color: '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '170px',
                            }}
                          >
                            {item.displayName}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {formatTime(item.lastActivity)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isIncoming ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                color: '#16a34a',
                                backgroundColor: '#dcfce7',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}
                            >
                              REPLY
                            </span>
                          ) : (
                            renderStatusIcon(lastMsg?.status)
                          )}
                          <span
                            style={{
                              fontSize: '12px',
                              color: isIncoming ? '#15803d' : '#64748b',
                              fontWeight: isIncoming ? '600' : '400',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {lastMsg?.message || lastMsg?.subject || 'No message content'}
                          </span>
                        </div>

                        {item.vehicles.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Car size={11} style={{ color: '#94a3b8' }} />
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {item.vehicles[0].registrationNumber} ({item.vehicles[0].model || 'Vehicle'})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: ACTIVE CHAT WINDOW ================= */}
          {activeChat ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>
              {/* Chat Header */}
              <div
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#ffffff',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: '700',
                    }}
                  >
                    {activeChat.displayName
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || <User size={20} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        {activeChat.displayName}
                      </span>
                      {activeChat.customer && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '2px 7px',
                            borderRadius: '6px',
                          }}
                        >
                          Customer #{activeChat.customer.id}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {activeChat.recipient}
                      </span>
                      {activeChat.vehicles.length > 0 && (
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Car size={12} /> {activeChat.vehicles.map((v) => v.registrationNumber).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="outline"
                    onClick={() => handleOpenWhatsApp()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#16a34a',
                      borderColor: '#bbf7d0',
                      backgroundColor: '#f0fdf4',
                    }}
                  >
                    <ExternalLink size={14} /> Open in WhatsApp Web
                  </button>
                </div>
              </div>

              {/* Chat Message Thread (Scrollable) */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  backgroundImage:
                    'radial-gradient(#e2e8f0 1px, transparent 1px), radial-gradient(#e2e8f0 1px, #f8fafc 1px)',
                  backgroundSize: '24px 24px',
                  backgroundPosition: '0 0, 12px 12px',
                }}
              >
                {/* Security / Encryption Notice */}
                <div
                  style={{
                    alignSelf: 'center',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#92400e',
                    fontWeight: '500',
                    maxWidth: '480px',
                    textAlign: 'center',
                  }}
                >
                  <ShieldCheck size={14} />
                  Official Meta WhatsApp Cloud API synced. Messages & automated alerts are stored securely.
                </div>

                {activeChat.messages.map((msg, index) => {
                  const isCustomer =
                    msg.direction === 'INCOMING' || msg.notificationType === 'CUSTOMER_MESSAGE';

                  return (
                    <div
                      key={msg.id || index}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isCustomer ? 'flex-start' : 'flex-end',
                        width: '100%',
                      }}
                    >
                      {/* Bubble Card */}
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: isCustomer
                            ? '18px 18px 18px 4px'
                            : '18px 18px 4px 18px',
                          backgroundColor: isCustomer ? '#ffffff' : '#dcf8c6',
                          color: '#0f172a',
                          boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08)',
                          border: isCustomer ? '1px solid #e2e8f0' : '1px solid #bbf7d0',
                          position: 'relative',
                        }}
                      >
                        {/* Outgoing Header Tag (Invoice / Service Update / Reminder) */}
                        {!isCustomer && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#166534',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            <ArrowUpRight size={12} />
                            {msg.notificationType?.replace(/_/g, ' ') || 'OUTGOING ALERT'}
                          </div>
                        )}

                        {/* Customer Header Tag */}
                        {isCustomer && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#15803d',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            <ArrowDownLeft size={12} />
                            Customer Reply
                          </div>
                        )}

                        {/* Message Body */}
                        <div
                          style={{
                            fontSize: '13.5px',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: '#1e293b',
                          }}
                        >
                          {msg.message || msg.subject || '—'}
                        </div>

                        {/* Timestamp & Status footer */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                            marginTop: '6px',
                            fontSize: '11px',
                            color: '#64748b',
                          }}
                        >
                          <span>{formatTime(msg.createdAt || msg.sentAt)}</span>
                          {!isCustomer && renderStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Suggestions */}
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#64748b',
                    marginRight: '4px',
                  }}
                >
                  <Sparkles size={12} style={{ color: '#eab308' }} /> Quick:
                </span>
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => setReplyText(qr)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '16px',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e2e8f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Chat Input & Send Bar */}
              <div
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder={`Reply to ${activeChat.displayName} via WhatsApp...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleOpenWhatsApp();
                    }
                  }}
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 14px',
                    fontSize: '13.5px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    outline: 'none',
                  }}
                />

                <button
                  onClick={() => handleOpenWhatsApp()}
                  style={{
                    height: '42px',
                    padding: '0 18px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#15803d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                  }}
                >
                  <Send size={15} /> Send WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                gap: '10px',
              }}
            >
              <MessageSquare size={48} style={{ opacity: 0.3 }} />
              <span style={{ fontSize: '15px', fontWeight: '600' }}>Select a conversation to view chat</span>
            </div>
          )}
        </div>
      ) : (
        /* ================= AUDIT LOGS TABLE VIEW ================= */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>Direction</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>Customer / Recipient</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>Message</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      No notifications or WhatsApp messages recorded yet.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => {
                    const isIncoming =
                      n.direction === 'INCOMING' || n.notificationType === 'CUSTOMER_MESSAGE';

                    return (
                      <tr
                        key={n.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>#{n.id}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: isIncoming ? '#dcfce7' : '#f1f5f9',
                              color: isIncoming ? '#15803d' : '#475569',
                            }}
                          >
                            {isIncoming ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {isIncoming ? 'INCOMING' : 'OUTGOING'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{n.customerName || '—'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{n.recipient}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#334155',
                              backgroundColor: '#f1f5f9',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            {n.notificationType || 'WHATSAPP'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                          <div
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: '#334155',
                            }}
                            title={n.message}
                          >
                            {n.message || n.subject || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {renderStatusIcon(n.status)}
                            <span style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>
                              {n.status || 'SENT'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                          {formatDate(n.createdAt || n.sentAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
