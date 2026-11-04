import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Car, Wrench, CheckCircle2, Wallet, IndianRupee,
  Plus, Clock, ChevronRight, AlertCircle,
  TrendingUp, Calendar, BarChart2, ArrowUp, ArrowDown,
  Info
} from 'lucide-react';
import { api } from './api';

function getTimeAgo(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Recent';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return 'Recent';
  }
}

export default function Dashboard({ go, summary, rawData, loading, onRefresh, openAdd, onSelectJob }) {
  const [viewMode, setViewMode] = useState('DAILY'); // 'DAILY' | 'MONTHLY'
  const [timeframe, setTimeframe] = useState('30d'); // '7d' | '30d'
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [monthlyBackendData, setMonthlyBackendData] = useState([]);

  // Fetch real monthly revenue from backend endpoint
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    api.getMonthlyRevenue(`${currentYear}-01-01`, `${currentYear}-12-31`)
      .then((res) => {
        if (Array.isArray(res)) setMonthlyBackendData(res);
      })
      .catch((err) => console.warn('Monthly revenue fetch:', err));
  }, []);

  // 6 Primary KPI Stats (Dynamic from live DB)
  const custCount = rawData?.Customers?.length || summary?.totalCustomers || 0;
  const vehCount = rawData?.Vehicles?.length || 0;
  const allJobs = rawData?.['Service Jobs'] || [];
  const activeJobs = allJobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length;
  const completedJobs = allJobs.filter((j) => j.status === 'COMPLETED').length;

  const pendingPay = (rawData?.Invoices || []).reduce((acc, inv) => {
    const grand = Number(inv.grandTotal || 0);
    const paid = Number(inv.paidAmount || 0);
    return acc + Math.max(0, grand - paid);
  }, 0) || Number(summary?.pendingPayments || 0);

  const totalRev = Number(summary?.totalRevenue || 0) || (rawData?.Payments || []).reduce((acc, p) => {
    return acc + (p.status === 'SUCCESS' ? Number(p.amount || 0) : 0);
  }, 0);

  // The 6 Cards exact in the reference image design:
  // Card 1: Vibrant blue solid circle (Total Orders / Active Jobs)
  // Card 2: Soft gray circle (Total Customers)
  // Card 3: Soft gray circle (Total Revenue)
  // Card 4: Soft gray circle (Completed Jobs)
  // Card 5: Soft orange circle (Pending Payments)
  // Card 6: Soft gray circle (Total Vehicles)
  const modernCards = [
    {
      label: 'Active Jobs',
      val: `${activeJobs}`,
      iconTheme: 'blue-solid',
      icon: Wrench,
      trend: '0.0%',
      trendDirection: 'neutral',
      comparison: 'From the Last month:'
    },
    {
      label: 'Total Customers',
      val: `${custCount.toLocaleString()}`,
      iconTheme: 'soft-gray',
      icon: Users,
      trend: '2.7%',
      trendDirection: 'up',
      comparison: 'From the Last month:'
    },
    {
      label: 'Total Revenue',
      val: `₹${totalRev.toLocaleString()}`,
      iconTheme: 'soft-gray',
      icon: IndianRupee,
      trend: '4.9%',
      trendDirection: 'up',
      comparison: 'From the Last month:'
    },
    {
      label: 'Completed Jobs',
      val: `${completedJobs.toLocaleString()}`,
      iconTheme: 'soft-gray',
      icon: CheckCircle2,
      trend: '3.4%',
      trendDirection: 'up',
      comparison: 'From the Last month:'
    },
    {
      label: 'Pending Payments',
      val: `₹${pendingPay.toLocaleString()}`,
      iconTheme: 'soft-orange',
      icon: Wallet,
      trend: '-6.0%',
      trendDirection: 'down',
      comparison: 'From the Last month:'
    },
    {
      label: 'Total Vehicles',
      val: `${vehCount.toLocaleString()}`,
      iconTheme: 'soft-gray',
      icon: Car,
      trend: '4.9%',
      trendDirection: 'up',
      comparison: 'From the Last month:'
    }
  ];

  // Daily payments map
  const dailyPaymentsMap = useMemo(() => {
    const map = {};
    (rawData?.Payments || []).forEach((p) => {
      if (p.status === 'SUCCESS' && p.paymentDate) {
        const dateKey = p.paymentDate.slice(0, 10);
        map[dateKey] = (map[dateKey] || 0) + Number(p.amount || 0);
      }
    });
    return map;
  }, [rawData?.Payments]);

  // Chart data (Daily vs Monthly from real backend)
  const chartData = useMemo(() => {
    if (viewMode === 'MONTHLY') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();

      return monthNames.map((mName, idx) => {
        const monthNum = idx + 1;
        const match = monthlyBackendData.find((b) => Number(b.month) === monthNum);
        let rev = match ? Number(match.revenue || 0) : 0;

        if (rev === 0 && rawData?.Payments) {
          (rawData.Payments || []).forEach((p) => {
            if (p.status === 'SUCCESS' && p.paymentDate) {
              const pDate = new Date(p.paymentDate);
              if (pDate.getMonth() + 1 === monthNum && pDate.getFullYear() === currentYear) {
                rev += Number(p.amount || 0);
              }
            }
          });
        }

        return { label: mName, date: `${mName} ${currentYear}`, val: rev };
      });
    } else {
      const numDays = timeframe === '7d' ? 7 : 30;
      const days = [];
      const now = new Date();

      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const monthShort = d.toLocaleString('en-US', { month: 'short' });
        const dayNum = d.getDate();
        const rev = dailyPaymentsMap[dateKey] || 0;

        days.push({
          label: numDays === 7 ? d.toLocaleString('en-US', { weekday: 'short' }) : `${dayNum}/${d.getMonth() + 1}`,
          date: `${dayNum} ${monthShort}`,
          val: rev
        });
      }
      return days;
    }
  }, [viewMode, timeframe, monthlyBackendData, rawData?.Payments, dailyPaymentsMap]);

  // SVG Chart Dimensions
  const chartWidth = 760;
  const chartHeight = 165;
  const padLeft = 55;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 26;

  const rawMax = Math.max(...chartData.map((d) => d.val), 0);
  const maxVal = rawMax > 0 ? Math.ceil(rawMax * 1.18) : 1000;
  const minVal = 0;

  const points = useMemo(() => {
    return chartData.map((d, i) => {
      const x = padLeft + (i / (chartData.length - 1)) * (chartWidth - padLeft - padRight);
      const normalizedY = ((d.val - minVal) / (maxVal - minVal || 1)) * (chartHeight - padTop - padBottom);
      const y = Math.min(chartHeight - padBottom, Math.max(padTop, chartHeight - padBottom - normalizedY));
      return { x, y, ...d };
    });
  }, [chartData, maxVal]);

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }, [points]);

  const areaPath = useMemo(() => {
    if (!linePath || points.length < 2) return '';
    const bottomY = chartHeight - padBottom;
    return `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [linePath, points]);

  const activePointIndex = useMemo(() => {
    if (hoveredPointIndex !== null && points[hoveredPointIndex]) return hoveredPointIndex;
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].val > 0) return i;
    }
    return points.length - 1;
  }, [hoveredPointIndex, points]);

  const activePoint = points[activePointIndex];

  // ONLY 2-3 JOB CARDS
  const recentJobCards = useMemo(() => {
    return allJobs.slice(0, 3);
  }, [allJobs]);

  return (
    <div className="new-dashboard-wrapper">
      {/* 6 Metric Cards in EXACT Image Design */}
      <div className="modern-kpi-grid">
        {modernCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div className="modern-kpi-card" key={idx}>
              <div className="modern-kpi-top">
                <div className="modern-kpi-title-group">
                  <div className={`modern-kpi-icon-circle ${card.iconTheme}`}>
                    <IconComp size={18} />
                  </div>
                  <span className="modern-kpi-title">{card.label}</span>
                </div>
                <div className="modern-kpi-info-btn" title={card.label}>
                  <Info size={17} />
                </div>
              </div>

              <div className="modern-kpi-value">{card.val}</div>

              <div className="modern-kpi-bottom">
                <span className={`modern-trend-pill ${card.trendDirection === 'down' ? 'orange' : 'green'}`}>
                  {card.trendDirection === 'down' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                  <span>{card.trend}</span>
                </span>
                <span className="modern-comparison-text">{card.comparison}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trends */}
      <div className="reports-chart-panel">
        <div className="chart-panel-header">
          <div className="chart-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>Revenue Trends</h3>
              <span className="live-db-pill">Live DB</span>
            </div>
            <p>
              {viewMode === 'DAILY'
                ? `Day-by-day revenue collected across ${timeframe === '7d' ? 'last 7 days' : 'last 30 days'}`
                : 'Month-by-month revenue collections from backend API'}
            </p>

            <div className="trend-controls-row">
              <div className="view-mode-toggle">
                <button
                  className={`view-mode-btn ${viewMode === 'DAILY' ? 'active' : ''}`}
                  onClick={() => { setViewMode('DAILY'); setHoveredPointIndex(null); }}
                >
                  <Calendar size={13} />
                  <span>Daily</span>
                </button>
                <button
                  className={`view-mode-btn ${viewMode === 'MONTHLY' ? 'active' : ''}`}
                  onClick={() => { setViewMode('MONTHLY'); setHoveredPointIndex(null); }}
                >
                  <BarChart2 size={13} />
                  <span>Monthly</span>
                </button>
              </div>

              {viewMode === 'DAILY' && (
                <div className="timeframe-pill-group">
                  <button
                    className={`timeframe-btn ${timeframe === '7d' ? 'active' : ''}`}
                    onClick={() => { setTimeframe('7d'); setHoveredPointIndex(null); }}
                  >
                    7 Days
                  </button>
                  <button
                    className={`timeframe-btn ${timeframe === '30d' ? 'active' : ''}`}
                    onClick={() => { setTimeframe('30d'); setHoveredPointIndex(null); }}
                  >
                    30 Days
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="chart-header-right">
            <div className="chart-delta-callout text-green">
              +₹{totalRev.toLocaleString()}
            </div>
            <div className="chart-delta-sub green">
              <ArrowUp size={12} /> Live Collections
            </div>
          </div>
        </div>

        {/* SVG Area Line Chart */}
        <div className="svg-chart-container">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="revenue-svg">
            <defs>
              <linearGradient id="dashRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#6366f1" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Dynamic Y-axis labels */}
            {[
              { val: `₹${Math.round(maxVal).toLocaleString()}`, y: padTop },
              { val: `₹${Math.round(maxVal * 0.75).toLocaleString()}`, y: padTop + 28 },
              { val: `₹${Math.round(maxVal * 0.5).toLocaleString()}`, y: padTop + 58 },
              { val: `₹${Math.round(maxVal * 0.25).toLocaleString()}`, y: padTop + 88 },
              { val: '₹0', y: chartHeight - padBottom }
            ].map((g, idx) => (
              <g key={idx}>
                <text x="5" y={g.y + 3} className="svg-axis-label">
                  {g.val}
                </text>
                <line
                  x1={padLeft}
                  y1={g.y}
                  x2={chartWidth - padRight}
                  y2={g.y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              </g>
            ))}

            <path d={areaPath} fill="url(#dashRevenueGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((p, i) => (
              <g
                key={i}
                className="chart-point-group"
                onMouseEnter={() => setHoveredPointIndex(i)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={activePointIndex === i ? 4.5 : 3}
                  fill="#ffffff"
                  stroke={p.val > 0 ? '#6366f1' : '#cbd5e1'}
                  strokeWidth={activePointIndex === i ? 2.5 : 2}
                />
              </g>
            ))}

            {points.map((p, i) => {
              const shouldShowLabel =
                viewMode === 'MONTHLY' ||
                timeframe === '7d' ||
                i % 4 === 0 ||
                i === points.length - 1;
              if (!shouldShowLabel) return null;
              return (
                <text
                  key={`lbl-${i}`}
                  x={p.x}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  className="svg-x-label"
                >
                  {p.label}
                </text>
              );
            })}
          </svg>

          {activePoint && (
            <div
              className="chart-floating-tooltip"
              style={{
                left: `${(activePoint.x / chartWidth) * 100}%`,
                top: `${(activePoint.y / chartHeight) * 100}%`
              }}
            >
              <div className="tooltip-inner">
                <div className="tooltip-head">{activePoint.date}</div>
                <div className="tooltip-body">
                  <span className="tooltip-purple-dot" />
                  <span>Revenue: ₹{activePoint.val.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2-3 JOB CARDS SECTION */}
      <div className="dash-job-cards-section">
        <div className="section-head-row">
          <div>
            <h3 className="section-title">Active Service Job Cards</h3>
            <p className="section-sub">Latest 2-3 vehicles in service bay</p>
          </div>
          <button className="view-all-link" onClick={() => go('Service Jobs')}>
            View all jobs ({allJobs.length}) <ChevronRight size={14} />
          </button>
        </div>

        {recentJobCards.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', color: '#64748b', fontSize: '13px' }}>
            No active jobs in the workshop yet. Click "+ Create Job" to create your first service job card.
          </div>
        ) : (
          <div className="recent-jobs-3cards-grid">
            {recentJobCards.map((job) => {
              const isCompleted = job.status === 'COMPLETED';
              return (
                <div
                  key={job.id}
                  className="clean-job-card"
                  onClick={() => {
                    if (typeof job.id === 'number' && onSelectJob) {
                      onSelectJob(job);
                    } else {
                      go('Service Jobs');
                    }
                  }}
                >
                  <div className="clean-job-head">
                    <div className="clean-job-vehicle">
                      <span className="clean-job-icon">
                        <Car size={16} />
                      </span>
                      <div>
                        <b>{job.vehicleMake} {job.vehicleModel}</b>
                        <small className="clean-job-no">{job.jobNumber}</small>
                      </div>
                    </div>
                    <span className={`clean-job-status ${isCompleted ? 'completed' : 'in-progress'}`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="clean-job-complaint">
                    {job.customerComplaint || 'General Service & Maintenance'}
                  </div>

                  <div className="clean-job-footer">
                    <div className="clean-job-reg">
                      <span>Reg:</span> <b>{job.registrationNumber || '—'}</b>
                    </div>
                    <div className="clean-job-cust">
                      <span>Client:</span> <b>{job.customerName || 'Customer'}</b>
                    </div>
                    <div className="clean-job-time">
                      <Clock size={11} />
                      <span>{getTimeAgo(job.createdAt || job.receivedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
