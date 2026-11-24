import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  FileText,
  Mic,
  ArrowLeft,
  Phone,
  User,
  Car,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';

export default function NotificationsPage({
  notifications = [],
  customers = [],
  vehicles = [],
  loading = false,
  onRefresh,
  toast,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef(null);

  // Pre-made quick templates
  const templates = [
    'Exclusive Offer! New users get 20% off on our Premium Plan. Reply for details.',
    'Your car service is completed and ready to be picked up!',
    'We have inspected your vehicle. Please check the estimate and approve.',
    'Here is your invoice link. You can pay via UPI or Cash at pickup.',
    'Thank you for visiting CarCareHub! Please let us know if you need anything else.',
  ];

  // Emoji quick list
  const emojis = ['👍', '🚗', '🔧', '✅', '🙏', '🧾', '😊', '⚡'];

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

  // Helper to extract customer name from automated template text if present
  const extractNameFromMsg = (msg) => {
    if (!msg) return null;
    if (msg.startsWith('Hello ') && msg.includes(',')) {
      return msg.slice(6, msg.indexOf(',')).trim();
    }
    if (msg.startsWith('Service reminder sent to ') && msg.includes(' for ')) {
      const start = 'Service reminder sent to '.length;
      const end = msg.indexOf(' for ');
      return msg.slice(start, end).trim();
    }
    return null;
  };

  const normalizePhone = (num) => {
    if (!num) return '';
    const digits = String(num).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // Group notifications into conversations by recipient
  const conversations = useMemo(() => {
    const groups = {};

    (notifications || []).forEach((n) => {
      const rawRec = n.recipient || 'Unknown';
      const cleanPhone = normalizePhone(rawRec);
      const key = cleanPhone || rawRec;

      const extractedName = extractNameFromMsg(n.message);
      const matchedCust =
        customerByPhone[cleanPhone] ||
        (cleanPhone.length >= 10 ? customerByPhone[cleanPhone.slice(-10)] : null);

      if (!groups[key]) {
        // Name resolution priority:
        // 1. Matched customer fullName in DB
        // 2. Extracted name from message body (e.g. "Hello Nizamul haq,")
        // 3. n.customerName (if valid and not a generic subject)
        // 4. Formatted phone number
        const resolvedName =
          matchedCust?.fullName ||
          matchedCust?.name ||
          extractedName ||
          (n.customerName && !n.customerName.startsWith('WhatsApp from') && !n.customerName.startsWith('+') ? n.customerName : null) ||
          (cleanPhone ? `+91 ${cleanPhone}` : rawRec);

        const custVehicles = matchedCust?.id ? vehiclesByCustomer[matchedCust.id] || [] : [];

        groups[key] = {
          key,
          recipient: rawRec,
          cleanPhone,
          displayName: resolvedName,
          customer: matchedCust,
          vehicles: custVehicles,
          messages: [],
          incomingCount: 0,
          lastActivity: n.createdAt || n.sentAt || '',
        };
      } else {
        // Upgrade display name if we now find a more accurate customer/extracted name
        if (matchedCust && (!groups[key].customer || groups[key].displayName.startsWith('+'))) {
          groups[key].customer = matchedCust;
          groups[key].displayName = matchedCust.fullName || matchedCust.name;
        } else if (extractedName && groups[key].displayName.startsWith('+')) {
          groups[key].displayName = extractedName;
        }
      }

      groups[key].messages.push(n);
      if (n.direction === 'INCOMING' || n.notificationType === 'CUSTOMER_MESSAGE') {
        groups[key].incomingCount += 1;
      }
    });

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

    list.sort((a, b) => {
      const timeA = new Date(a.lastActivity || 0).getTime();
      const timeB = new Date(b.lastActivity || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [notifications, customerByPhone, customerById, vehiclesByCustomer]);

  // Split into Favourites and Direct Messages
  const { favourites, directMessages } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = conversations.filter((c) => {
      if (!q) return true;
      return (
        c.displayName.toLowerCase().includes(q) ||
        c.recipient.toLowerCase().includes(q) ||
        c.messages.some((m) => (m.message || '').toLowerCase().includes(q))
      );
    });

    // Top 3 active or customers with incoming count become Favourites
    const favs = [];
    const directs = [];
    filtered.forEach((c, idx) => {
      if (c.incomingCount > 0 || idx < 3) {
        favs.push(c);
      } else {
        directs.push(c);
      }
    });

    return { favourites: favs, directMessages: directs };
  }, [conversations, searchQuery]);

  // Active chat
  const activeChat = useMemo(() => {
    if (selectedKey) {
      const found = conversations.find((c) => c.key === selectedKey);
      if (found) return found;
    }
    return conversations[0] || null;
  }, [selectedKey, conversations]);

  // Scroll to bottom when active chat changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.key, activeChat?.messages?.length]);

  const formatShortTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Avatar colors
  const avatarColors = [
    '#3b82f6',
    '#10b981',
    '#8b5cf6',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
  ];

  const getAvatarBg = (str) => {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  // Send WhatsApp action
  const handleSendWhatsApp = (textToSend = replyText) => {
    if (!activeChat) return;
    const phone = activeChat.cleanPhone;
    if (!phone) {
      if (toast) toast('No valid phone number for this recipient');
      return;
    }
    const finalMsg = textToSend || replyText;
    if (!finalMsg.trim()) return;
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(finalMsg)}`;
    window.open(url, '_blank');
    setReplyText('');
    setShowTemplates(false);
    if (toast) toast('Opened in WhatsApp Web');
  };

  const handleSelectConversation = (key) => {
    setSelectedKey(key);
    setMobileChatOpen(true);
  };

  return (
    <div className="cch-chat-wrapper">
      <style>{`
        .cch-chat-wrapper {
          display: flex;
          flex-direction: column;
          width: 100%;
          font-family: inherit;
        }

        .cch-chat-card {
          display: grid;
          grid-template-columns: 320px 1fr;
          height: calc(100vh - 165px);
          min-height: 580px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        /* Sidebar Chats List */
        .cch-chats-sidebar {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #f1f5f9;
          background: #ffffff;
          height: 100%;
          overflow: hidden;
        }

        .cch-sidebar-header {
          padding: 18px 20px 12px 20px;
        }

        .cch-sidebar-title {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 14px;
        }

        .cch-search-box {
          position: relative;
          width: 100%;
        }

        .cch-search-box input {
          width: 100%;
          padding: 9px 12px 9px 36px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          font-size: 13px;
          color: #1f2937;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s;
        }

        .cch-search-box input:focus {
          border-color: #cbd5e1;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.05);
        }

        .cch-search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .cch-conversations-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 6px 12px 18px 12px;
        }

        .cch-category-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          margin: 14px 8px 6px 8px;
          letter-spacing: 0.02em;
        }

        .cch-contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 10px;
          border-radius: 14px;
          cursor: pointer;
          transition: background-color 0.15s;
          margin-bottom: 2px;
        }

        .cch-contact-item:hover {
          background-color: #f8fafc;
        }

        .cch-contact-item.active {
          background-color: #f1f5f9;
        }

        .cch-avatar-wrap {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 13.5px;
        }

        .cch-online-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #ffffff;
        }

        .cch-contact-info {
          flex: 1;
          min-width: 0;
        }

        .cch-contact-name-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 2px;
        }

        .cch-contact-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .cch-contact-time {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        .cch-contact-msg-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cch-contact-snippet {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }

        .cch-unread-badge {
          background: #14b8a6;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Right Chat Pane */
        .cch-chat-pane {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          position: relative;
        }

        .cch-chat-topbar {
          padding: 14px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
        }

        .cch-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cch-mobile-back {
          display: none;
          background: none;
          border: none;
          padding: 6px;
          margin-right: -4px;
          cursor: pointer;
          color: #374151;
        }

        .cch-topbar-details {
          display: flex;
          flex-direction: column;
        }

        .cch-topbar-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cch-topbar-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .cch-note-pill {
          font-size: 11px;
          font-weight: 600;
          color: #0284c7;
          border: 1px solid #bae6fd;
          background: #f0f9ff;
          padding: 1px 8px;
          border-radius: 12px;
        }

        .cch-topbar-sub {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }

        /* Message Thread */
        .cch-thread-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: #ffffff;
        }

        .cch-date-separator {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 6px 0 12px 0;
        }

        .cch-date-separator::before,
        .cch-date-separator::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #f1f5f9;
        }

        .cch-date-label {
          padding: 0 14px;
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Message Items */
        .cch-msg-row {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .cch-msg-row.incoming {
          align-items: flex-start;
        }

        .cch-msg-row.outgoing {
          align-items: flex-end;
        }

        .cch-msg-sender-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 5px;
          font-size: 12px;
          color: #6b7280;
        }

        .cch-msg-row.outgoing .cch-msg-sender-header {
          justify-content: flex-end;
        }

        .cch-mini-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .cch-bubble {
          max-width: 68%;
          padding: 12px 18px;
          font-size: 13.5px;
          line-height: 1.5;
          word-break: break-word;
          box-sizing: border-box;
        }

        .cch-bubble.incoming {
          background: #f3f4f6;
          color: #1f2937;
          border-radius: 4px 18px 18px 18px;
        }

        .cch-bubble.outgoing {
          background: #eff6ff;
          color: #1e3a8a;
          border-radius: 18px 4px 18px 18px;
        }

        /* Bottom Input Card */
        .cch-composer-wrap {
          padding: 16px 24px 20px 24px;
          background: #ffffff;
        }

        .cch-composer-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
          padding: 12px 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .cch-composer-input-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .cch-composer-textarea {
          flex: 1;
          border: none;
          outline: none;
          resize: none;
          font-size: 13.5px;
          color: #1f2937;
          background: transparent;
          min-height: 38px;
          max-height: 100px;
          line-height: 1.4;
          padding: 2px 0;
          font-family: inherit;
        }

        .cch-composer-textarea::placeholder {
          color: #9ca3af;
        }

        .cch-send-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: none;
          background: #14b8a6;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s, transform 0.1s;
          flex-shrink: 0;
        }

        .cch-send-btn:hover {
          background: #0d9488;
        }

        .cch-send-btn:active {
          transform: scale(0.95);
        }

        .cch-composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #f8fafc;
        }

        .cch-action-buttons {
          display: flex;
          align-items: center;
          gap: 14px;
          overflow-x: auto;
        }

        .cch-action-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 6px;
          transition: color 0.15s;
          white-space: nowrap;
        }

        .cch-action-pill:hover {
          color: #111827;
        }

        .cch-char-count {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
          flex-shrink: 0;
        }

        /* Templates popup */
        .cch-templates-popup {
          margin-bottom: 10px;
          padding: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 160px;
          overflow-y: auto;
        }

        .cch-template-option {
          text-align: left;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12.5px;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }

        .cch-template-option:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        /* -------------------------------------------------------------
           MOBILE RESPONSIVE (FIRST) STYLES
           ------------------------------------------------------------- */
        @media (max-width: 768px) {
          .cch-chat-card {
            grid-template-columns: 1fr;
            height: calc(100dvh - 130px);
            min-height: 480px;
            border-radius: 16px;
          }

          /* When on mobile, toggle between sidebar and chat pane */
          .cch-chats-sidebar {
            display: ${mobileChatOpen ? 'none' : 'flex'} !important;
            border-right: none;
          }

          .cch-chat-pane {
            display: ${mobileChatOpen ? 'flex' : 'none'} !important;
          }

          .cch-mobile-back {
            display: flex !important;
          }

          .cch-bubble {
            max-width: 84%;
          }

          .cch-composer-wrap {
            padding: 10px 14px 14px 14px;
          }

          .cch-action-buttons {
            gap: 10px;
          }

          .cch-action-pill span {
            display: none;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="cch-chat-card">
        {/* ================= LEFT SIDEBAR: CHATS LIST ================= */}
        <div className="cch-chats-sidebar">
          <div className="cch-sidebar-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div className="cch-sidebar-title" style={{ margin: 0 }}>Chats</div>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  title="Refresh messages"
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '6px',
                  }}
                >
                  <RefreshCw size={15} className={loading ? 'cch-spinner' : ''} />
                </button>
              )}
            </div>
            <div className="cch-search-box">
              <Search size={15} className="cch-search-icon" />
              <input
                type="text"
                placeholder="Search Contact"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

            <div className="cch-conversations-scroll">
              {/* Category 1: Favourites */}
              {favourites.length > 0 && (
                <>
                  <div className="cch-category-label">Favourites</div>
                  {favourites.map((c) => {
                    const isSelected = activeChat && activeChat.key === c.key;
                    const initials = getInitials(c.displayName);
                    const lastMsg = c.lastMessage;
                    const timeStr = formatShortTime(c.lastActivity);

                    return (
                      <div
                        key={c.key}
                        className={`cch-contact-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(c.key)}
                      >
                        <div
                          className="cch-avatar-wrap"
                          style={{ backgroundColor: getAvatarBg(c.displayName) }}
                        >
                          {initials}
                          <span className="cch-online-dot" />
                        </div>

                        <div className="cch-contact-info">
                          <div className="cch-contact-name-row">
                            <span className="cch-contact-name">{c.displayName}</span>
                            <span className="cch-contact-time">{timeStr}</span>
                          </div>
                          <div className="cch-contact-msg-row">
                            <span className="cch-contact-snippet">
                              {lastMsg?.message || lastMsg?.subject || 'No messages yet'}
                            </span>
                            {c.incomingCount > 0 && (
                              <span className="cch-unread-badge">{c.incomingCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Category 2: Direct Messages */}
              {directMessages.length > 0 && (
                <>
                  <div className="cch-category-label">Direct Messages</div>
                  {directMessages.map((c) => {
                    const isSelected = activeChat && activeChat.key === c.key;
                    const initials = getInitials(c.displayName);
                    const lastMsg = c.lastMessage;
                    const timeStr = formatShortTime(c.lastActivity);

                    return (
                      <div
                        key={c.key}
                        className={`cch-contact-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(c.key)}
                      >
                        <div
                          className="cch-avatar-wrap"
                          style={{ backgroundColor: getAvatarBg(c.displayName) }}
                        >
                          {initials}
                          <span className="cch-online-dot" />
                        </div>

                        <div className="cch-contact-info">
                          <div className="cch-contact-name-row">
                            <span className="cch-contact-name">{c.displayName}</span>
                            <span className="cch-contact-time">{timeStr}</span>
                          </div>
                          <div className="cch-contact-msg-row">
                            <span className="cch-contact-snippet">
                              {lastMsg?.message || lastMsg?.subject || 'No messages yet'}
                            </span>
                            {c.incomingCount > 0 && (
                              <span className="cch-unread-badge">{c.incomingCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {conversations.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 10px', fontSize: '13px' }}>
                  No contacts or messages yet.
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT PANE: ACTIVE CHAT ================= */}
          {activeChat ? (
            <div className="cch-chat-pane">
              {/* Header */}
              <div className="cch-chat-topbar">
                <div className="cch-topbar-left">
                  <button
                    className="cch-mobile-back"
                    onClick={() => setMobileChatOpen(false)}
                    title="Back to contacts"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <div
                    className="cch-avatar-wrap"
                    style={{ backgroundColor: getAvatarBg(activeChat.displayName) }}
                  >
                    {getInitials(activeChat.displayName)}
                    <span className="cch-online-dot" />
                  </div>

                  <div className="cch-topbar-details">
                    <div className="cch-topbar-title-row">
                      <span className="cch-topbar-name">{activeChat.displayName}</span>
                    </div>
                    <span className="cch-topbar-sub">
                      {activeChat.recipient}
                      {activeChat.vehicles.length > 0 && ` • ${activeChat.vehicles[0].registrationNumber}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="cch-thread-scroll">
                <div className="cch-date-separator">
                  <span className="cch-date-label">TODAY</span>
                </div>

                {activeChat.messages.map((m, idx) => {
                  const isIncoming =
                    m.direction === 'INCOMING' || m.notificationType === 'CUSTOMER_MESSAGE';
                  const time = formatShortTime(m.createdAt || m.sentAt);

                  return (
                    <div key={m.id || idx} className={`cch-msg-row ${isIncoming ? 'incoming' : 'outgoing'}`}>
                      {/* Sender / Timestamp row */}
                      <div className="cch-msg-sender-header">
                        {isIncoming ? (
                          <>
                            <div
                              className="cch-mini-avatar"
                              style={{ backgroundColor: getAvatarBg(activeChat.displayName) }}
                            >
                              {getInitials(activeChat.displayName)}
                            </div>
                            <span style={{ fontWeight: '600', color: '#374151' }}>
                              {activeChat.displayName}
                            </span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{time}</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{time}</span>
                            <span style={{ fontWeight: '600', color: '#374151' }}>You</span>
                            <div
                              className="cch-mini-avatar"
                              style={{ backgroundColor: '#0f172a' }}
                            >
                              <User size={12} />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Bubble */}
                      <div className={`cch-bubble ${isIncoming ? 'incoming' : 'outgoing'}`}>
                        {m.message || m.subject || '—'}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Composer Card matching reference */}
              <div className="cch-composer-wrap">
                {showTemplates && (
                  <div className="cch-templates-popup">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Quick Templates</span>
                      <button
                        onClick={() => setShowTemplates(false)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={14} color="#94a3b8" />
                      </button>
                    </div>
                    {templates.map((tpl, i) => (
                      <div
                        key={i}
                        className="cch-template-option"
                        onClick={() => {
                          setReplyText(tpl);
                          setShowTemplates(false);
                        }}
                      >
                        {tpl}
                      </div>
                    ))}
                  </div>
                )}

                <div className="cch-composer-card">
                  <div className="cch-composer-input-row">
                    <textarea
                      className="cch-composer-textarea"
                      placeholder="Write your message.."
                      value={replyText}
                      maxLength={1000}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendWhatsApp();
                        }
                      }}
                    />
                    <button
                      className="cch-send-btn"
                      onClick={() => handleSendWhatsApp()}
                      title="Send WhatsApp Message"
                    >
                      <Send size={15} />
                    </button>
                  </div>

                  <div className="cch-composer-footer">
                    <div className="cch-action-buttons">
                      <button
                        type="button"
                        className="cch-action-pill"
                        onClick={() => setShowTemplates(!showTemplates)}
                        title="Quick Templates"
                      >
                        <FileText size={14} />
                        <span>Template</span>
                      </button>

                      <button
                        type="button"
                        className="cch-action-pill"
                        onClick={() => setReplyText((prev) => prev + ' 😊 ')}
                        title="Insert Emoji"
                      >
                        <Smile size={14} />
                        <span>Emoji</span>
                      </button>

                      <button
                        type="button"
                        className="cch-action-pill"
                        onClick={() => {
                          if (toast) toast('Attachment feature: link invoices or PDFs');
                        }}
                        title="Attach file"
                      >
                        <Paperclip size={14} />
                        <span>Attach</span>
                      </button>

                      <button
                        type="button"
                        className="cch-action-pill"
                        onClick={() => {
                          if (toast) toast('Voice message not enabled on web');
                        }}
                        title="Voice Message"
                      >
                        <Mic size={14} />
                        <span>Voice Message</span>
                      </button>
                    </div>

                    <span className="cch-char-count">{replyText.length}/1000</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
  );
}
