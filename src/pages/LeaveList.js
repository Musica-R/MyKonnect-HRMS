import React, { useEffect, useState } from 'react';
import '../styles/LeaveList.css';
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiSearch,
  FiX,
  FiFileText,
} from 'react-icons/fi';

const UPDATE_STATUS_API = 'https://hrms.mpdatahub.com/api/update-Leave-status';

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    icon: <FiCheckCircle />,
    cls: 'status--approved',
  },
  pending: { label: 'Pending', icon: <FiClock />, cls: 'status--pending' },
  rejected: { label: 'Rejected', icon: <FiXCircle />, cls: 'status--rejected' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function truncateWords(text, wordLimit = 10) {
  if (!text) return { short: '—', isTruncated: false };
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return { short: text, isTruncated: false };
  return { short: words.slice(0, wordLimit).join(' ') + '…', isTruncated: true };
}

function ReasonPopup({ reason, employeeName, onClose }) {
  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="ll-popup-backdrop" onClick={handleBackdrop}>
      <div className="ll-popup-modal">
        <div className="ll-popup-header">
          <div className="ll-popup-title">
            <FiFileText className="ll-popup-icon" />
            <div>
              <h3>Leave Reason</h3>
              {employeeName && <p>{employeeName}</p>}
            </div>
          </div>
          <button className="ll-popup-close" onClick={onClose} title="Close">
            <FiX />
          </button>
        </div>
        <div className="ll-popup-body">
          <p>{reason}</p>
        </div>
      </div>
    </div>
  );
}

export default function LeaveList() {
  const [leaves, setLeaves] = useState([]);
  const [meta, setMeta] = useState({ month: '', total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [popup, setPopup] = useState(null); // { reason, employeeName }

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();

  const [dateFilter, setDateFilter] = useState({
    user_id: '',
    month: currentMonth,
    year: currentYear,
  });

  const monthOptions = [
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];

  const handleDate = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `https://hrms.mpdatahub.com/api/leave-list?user_id=${dateFilter.user_id}&month=${dateFilter.month}&year=${dateFilter.year}`
        );
        const json = await res.json();
        if (json.success) {
          setLeaves(json.data);
          setMeta({ month: json.month, total: json.total_leaves });
        } else {
          setError('Failed to load leave records.');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, [dateFilter]);

  const updateStatus = async (leaveId, newStatus) => {
    if (updatingId) return;
    try {
      setUpdatingId(leaveId);
      const res = await fetch(UPDATE_STATUS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ leave_id: leaveId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeaves((prev) =>
          prev.map((l) => (l.id === leaveId ? { ...l, status: newStatus } : l))
        );
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch {
      alert('Network error while updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = leaves.filter((l) => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchSearch =
      String(l.id).includes(searchTerm) ||
      (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.empid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.leave_date || '').includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: leaves.length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    pending: leaves.filter((l) => l.status === 'pending').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  };

  function formatDuration(duration) {
    const d = parseFloat(duration);
    if (d === 0.5) return 'Half Day';
    if (d % 1 === 0) return `${d} Day${d > 1 ? 's' : ''}`;
    if (d % 1 === 0.5) {
      const fullDays = Math.floor(d);
      return `${fullDays} Day${fullDays > 1 ? 's' : ''} + Half Day`;
    }
    return duration;
  }

  function formatHalfDay(halfday) {
    if (!halfday) return '—';
    return halfday.charAt(0).toUpperCase() + halfday.slice(1);
  }

  return (
    <div className="leavelist-page">
      {/* Popup Modal */}
      {popup && (
        <ReasonPopup
          reason={popup.reason}
          employeeName={popup.employeeName}
          onClose={() => setPopup(null)}
        />
      )}

      <div className="leavelist-header">
        <div className="leavelist-title">
          <FiCalendar className="ll-title-icon" />
          <div>
            <h1>Leave Management</h1>
            <p>
              {meta.month || 'Current Month'} · {meta.total} leave
              {meta.total !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        <div className="leavelist-controls">
          <div className="ll-search-wrap">
            <FiSearch className="ll-search-icon" />
            <input
              type="text"
              className="ll-search"
              placeholder="Search by ID, name, emp id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="ll-refresh-btn"
            onClick={() =>
              setDateFilter({ user_id: '', month: currentMonth, year: currentYear })
            }
            title="Refresh"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', width: '100%', gap: '30px', padding: '10px' }}>
        <div className="form-group">
          <label>Month Filter</label>
          <select name="month" value={dateFilter.month} onChange={handleDate}>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year Filter</label>
          <select name="year" value={dateFilter.year} onChange={handleDate}>
            {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ll-tabs">
        {['all', 'approved', 'pending', 'rejected'].map((s) => (
          <button
            key={s}
            className={`ll-tab ll-tab--${s} ${filterStatus === s ? 'll-tab--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ll-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {loading && leaves.length === 0 && (
        <div className="ll-center">
          <div className="ll-spinner" />
          <p>Loading leave records…</p>
        </div>
      )}

      {error && (
        <div className="ll-error">
          <FiAlertCircle />
          {error}
          <button
            className="ll-retry"
            onClick={() =>
              setDateFilter({ user_id: '', month: currentMonth, year: currentYear })
            }
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && leaves.length > 0 && (
        <div className="ll-summary-row">
          <div className="ll-summary-card ll-summary--total">
            <span className="ll-sum-num">{counts.all}</span>
            <span className="ll-sum-label">Total Applied</span>
          </div>
          <div className="ll-summary-card ll-summary--approved">
            <span className="ll-sum-num">{counts.approved}</span>
            <span className="ll-sum-label">Approved</span>
          </div>
          <div className="ll-summary-card ll-summary--pending">
            <span className="ll-sum-num">{counts.pending}</span>
            <span className="ll-sum-label">Pending</span>
          </div>
          <div className="ll-summary-card ll-summary--rejected">
            <span className="ll-sum-num">{counts.rejected}</span>
            <span className="ll-sum-label">Rejected</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="ll-center">
              <p>No leave records found matching your criteria.</p>
            </div>
          ) : (
            <div className="ll-table-wrap">
              <table className="ll-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ width: '80px' }}>Leave ID</th>
                    <th style={{ width: '160px' }}>Employee Details</th>
                    <th style={{ width: '110px' }}>Leave Date</th>
                    <th style={{ width: '220px' }}>Reason</th>
                    <th style={{ width: '110px' }}>Applied On</th>
                    <th style={{ width: '120px' }}>Leave Duration</th>
                    <th style={{ width: '90px' }}>Session</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '130px' }} className="ll-txt-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((leave, idx) => {
                    const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                    const isUpdating = updatingId === leave.id;
                    const { short, isTruncated } = truncateWords(leave.reason, 10);

                    return (
                      <tr key={leave.id} className="ll-row">
                        <td className="ll-idx">{idx + 1}</td>

                        <td className="ll-id-cell">
                          <span className="ll-id-badge">#{leave.id}</span>
                        </td>

                        <td>
                          <div className="ll-emp-info">
                            <span className="ll-name">{leave.name}</span>
                            <span className="ll-empid">{leave.empid}</span>
                          </div>
                        </td>

                        <td className="ll-date">{formatDate(leave.leave_date)}</td>

                        <td className="ll-reason-cell">
                          <div className="ll-reason-text">
                            {short}
                            {isTruncated && (
                              <button
                                className="ll-readmore-btn"
                                onClick={() =>
                                  setPopup({ reason: leave.reason, employeeName: leave.name })
                                }
                              >
                                Read more
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="ll-date ll-dim">{formatDate(leave.created_at)}</td>

                        <td className="ll-duration-cell">{formatDuration(leave.duration)}</td>

                        <td className="ll-session-cell">{formatHalfDay(leave.half_day)}</td>

                        <td>
                          <span className={`ll-status ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>

                        <td className="ll-txt-center">
                          {leave.status === 'pending' ? (
                            <select
                              className="ll-status-dropdown"
                              value={leave.status || 'pending'}
                              disabled={isUpdating}
                              onChange={(e) => updateStatus(leave.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <span className="ll-status-fixed">
                              {sc.icon} {sc.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}