import React, { useState, useEffect } from 'react';
import '../styles/PermissionList.css';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiSearch,
  FiX,
  FiFileText,
} from 'react-icons/fi';
import Lottie from 'lottie-react';
import animationData from '../LottieFiles/Allow Permission.json';

const STATUS_CONFIG = {
  approved: { label: 'Approved', icon: <FiCheckCircle />, cls: 'pl-status-approved' },
  pending: { label: 'Pending', icon: <FiClock />, cls: 'pl-status-pending' },
  rejected: { label: 'Rejected', icon: <FiXCircle />, cls: 'pl-status-rejected' },
};

function truncateWords(text, wordLimit = 10) {
  if (!text) return { short: '—', isTruncated: false };
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return { short: text, isTruncated: false };
  return { short: words.slice(0, wordLimit).join(' ') + '…', isTruncated: true };
}

function ReasonPopup({ reason, employeeName, onClose }) {
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="pl-popup-backdrop" onClick={handleBackdrop}>
      <div className="pl-popup-modal">
        <div className="pl-popup-header">
          <div className="pl-popup-title">
            <FiFileText className="pl-popup-icon" />
            <div>
              <h3>Permission Reason</h3>
              {employeeName && <p>{employeeName}</p>}
            </div>
          </div>
          <button className="pl-popup-close" onClick={onClose} title="Close">
            <FiX />
          </button>
        </div>
        <div className="pl-popup-body">
          <p>{reason}</p>
        </div>
      </div>
    </div>
  );
}

export default function PermissionList() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [popup, setPopup] = useState(null);

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();

  const [dateFilter, setDateFilter] = useState({
    user_id: '',
    month: currentMonth,
    year: currentYear,
  });

  const monthOptions = [
    { label: 'January', value: '1' }, { label: 'February', value: '2' },
    { label: 'March', value: '3' }, { label: 'April', value: '4' },
    { label: 'May', value: '5' }, { label: 'June', value: '6' },
    { label: 'July', value: '7' }, { label: 'August', value: '8' },
    { label: 'September', value: '9' }, { label: 'October', value: '10' },
    { label: 'November', value: '11' }, { label: 'December', value: '12' },
  ];

  const handleDate = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  const updateStatus = async (id, newStatus) => {
    if (updatingId) return;
    try {
      setUpdatingId(id);
      const res = await fetch(`https://hrms.mpdatahub.com/api/approve-permission/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPermissions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
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

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `https://hrms.mpdatahub.com/api/premissionlist?user_id=${dateFilter.user_id}&month=${dateFilter.month}&year=${dateFilter.year}`
        );
        const json = await res.json();
        if (json.success) {
          setPermissions(json.data || []);
        } else {
          setError('Failed to fetch permission list');
        }
      } catch {
        setError('Network error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [dateFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === '00:00:00') return '—';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formatDuration = (value) => {
    if (!value) return '—';
    const num = parseFloat(value);
    if (num < 1) return `${Math.round(num * 100)} min`;
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 100);
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  const filtered = permissions.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      String(p.id).includes(searchTerm) ||
      (p.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.user_id).includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: permissions.length,
    approved: permissions.filter((p) => p.status === 'approved').length,
    pending: permissions.filter((p) => p.status === 'pending').length,
    rejected: permissions.filter((p) => p.status === 'rejected').length,
  };

  return (
    <div className="permission-page fade-in">
      {/* Popup */}
      {popup && (
        <ReasonPopup
          reason={popup.reason}
          employeeName={popup.employeeName}
          onClose={() => setPopup(null)}
        />
      )}

      {/* Header */}
      <div className="permission-header">
        <div className="permission-title-group">
          <Lottie animationData={animationData} style={{ width: '70px', height: '90px' }} />
          <div>
            <h1>Permission List</h1>
            <p>Total {counts.all} permission requests found</p>
          </div>
        </div>

        <div className="permission-controls">
          <div className="pl-search-wrap">
            <FiSearch className="pl-search-icon" />
            <input
              type="text"
              className="pl-search-input"
              placeholder="Search by ID, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`pl-refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={() => setDateFilter({ user_id: '', month: currentMonth, year: currentYear })}
            disabled={loading}
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Date Filters */}
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

      {/* Tabs */}
      <div className="pl-tabs">
        {['all', 'approved', 'pending', 'rejected'].map((s) => (
          <button
            key={s}
            className={`pl-tab ${filterStatus === s ? 'pl-tab--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="pl-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="pl-summary-grid">
        <div className="pl-summary-card pl-summary-total">
          <span className="pl-card-num">{counts.all}</span>
          <span className="pl-card-label">Total Applied</span>
        </div>
        <div className="pl-summary-card pl-summary-approved">
          <span className="pl-card-num">{counts.approved}</span>
          <span className="pl-card-label">Approved</span>
        </div>
        <div className="pl-summary-card pl-summary-pending">
          <span className="pl-card-num">{counts.pending}</span>
          <span className="pl-card-label">Pending</span>
        </div>
        <div className="pl-summary-card pl-summary-rejected">
          <span className="pl-card-num">{counts.rejected}</span>
          <span className="pl-card-label">Rejected</span>
        </div>
      </div>

      {/* Table */}
      {loading && permissions.length === 0 ? (
        <div className="pl-center">
          <div className="pl-spinner" />
          <p>Fetching permissions...</p>
        </div>
      ) : error ? (
        <div className="pl-error">
          <span><FiAlertCircle /> {error}</span>
          <button
            className="pl-retry-btn"
            onClick={() => setDateFilter({ user_id: '', month: currentMonth, year: currentYear })}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="pl-table-container">
          <table className="pl-table">
            <thead>
              <tr>
                <th style={{ width: '44px' }}>S.No</th>
                <th style={{ width: '90px' }}>Perm. ID</th>
                <th style={{ width: '150px' }}>Name</th>
                <th style={{ width: '110px' }}>Date</th>
                <th style={{ width: '160px' }}>Time Slot</th>
                <th style={{ width: '100px' }}>Duration</th>
                <th style={{ width: '220px' }}>Reason</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '110px' }}>Applied On</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((p, idx) => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  const { short, isTruncated } = truncateWords(p.reason, 10);

                  return (
                    <tr key={p.id}>
                      <td className="pl-idx">{idx + 1}</td>

                      <td>
                        <span className="pl-id-badge">#{p.id}</span>
                      </td>

                      <td>
                        <span className="pl-name-text">{p.name}</span>
                      </td>

                      <td className="pl-date">{formatDate(p.attendance_date)}</td>

                      <td>
                        <span className="pl-time-badge">
                          {formatTime(p.start_time)} – {formatTime(p.end_time)}
                        </span>
                      </td>

                      <td>
                        <span className="pl-hours">{formatDuration(p.permission_hours)}</span>
                      </td>

                      <td className="pl-reason-cell">
                        <div className="pl-reason-text">
                          {short}
                          {isTruncated && (
                            <button
                              className="pl-readmore-btn"
                              onClick={() => setPopup({ reason: p.reason, employeeName: p.name })}
                            >
                              Read more
                            </button>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className={`pl-status ${sc.cls}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>

                      <td className="pl-date pl-dim">{formatDate(p.created_at)}</td>

                      <td style={{ textAlign: 'center' }}>
                        {p.status === 'pending' ? (
                          <select
                            className="pl-status-dropdown"
                            value={p.status}
                            disabled={updatingId === p.id}
                            onChange={(e) => updateStatus(p.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve</option>
                            <option value="rejected">Reject</option>
                          </select>
                        ) : (
                          <span className="pl-status-fixed">
                            {sc.icon} {sc.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No permission records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}