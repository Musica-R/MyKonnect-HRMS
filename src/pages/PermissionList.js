import React, { useState, useEffect } from 'react';
import '../styles/PermissionList.css';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiSearch,
} from 'react-icons/fi';
import Lottie from 'react-lottie';
import animationData from '../LottieFiles/Allow Permission.json';

// const PERMISSION_LIST_API = 'https://hrms.mpdatahub.com/api/premissionlist';

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    icon: <FiCheckCircle />,
    cls: 'pl-status-approved',
  },
  pending: { label: 'Pending', icon: <FiClock />, cls: 'pl-status-pending' },
  rejected: {
    label: 'Rejected',
    icon: <FiXCircle />,
    cls: 'pl-status-rejected',
  },
};

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

export default function PermissionList() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

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

    setDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateStatus = async (id, newStatus) => {
    if (updatingId) return;
    try {
      setUpdatingId(id);
      const res = await fetch(
        `https://hrms.mpdatahub.com/api/approve-permission/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setPermissions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error while updating status');
      console.error(err);
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
      } catch (err) {
        setError('Network error. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [dateFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  const filtered = permissions.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      String(p.id).includes(searchTerm) ||
      p.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.user_id).includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: permissions.length,
    approved: permissions.filter((p) => p.status === 'approved').length,
    pending: permissions.filter((p) => p.status === 'pending').length,
    rejected: permissions.filter((p) => p.status === 'rejected').length,
  };

  const formatDuration = (value) => {
    if (!value) return '—';

    const num = parseFloat(value);

    // If less than 1 hour → convert to minutes
    if (num < 1) {
      return `${Math.round(num * 100)} min`;
    }

    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 100);

    if (minutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${minutes} min`;
  };

  return (
    <div className="permission-page fade-in">
      <div className="permission-header">
        <div className="permission-title-group">
          <Lottie options={defaultOptions} height={70} width={70} />
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
            onClick={() =>
              setDateFilter({
                user_id: '',
                month: currentMonth,
                year: currentYear,
              })
            }
            disabled={loading}
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div
        style={{ display: 'flex', width: '100%', gap: '30px', padding: '10px' }}
      >
        <div className="form-group">
          <label>Month Filter</label>
          <select name="month" value={dateFilter.month} onChange={handleDate}>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year Filter</label>
          <select name="year" value={dateFilter.year} onChange={handleDate}>
            {[2026, 2025, 2024, 2023].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      {loading && permissions.length === 0 ? (
        <div className="pl-center">
          <div className="pl-spinner"></div>
          <p>Fetching permissions...</p>
        </div>
      ) : error ? (
        <div className="pl-error">
          <span>
            <FiAlertCircle /> {error}
          </span>
          <button
            className="pl-retry-btn"
            onClick={() =>
              setDateFilter({
                user_id: '',
                month: currentMonth,
                year: currentYear,
              })
            }
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="pl-table-container">
          <table className="pl-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Permission ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied On</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((p, idx) => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={p.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="pl-id-badge">#{p.id}</span>
                      </td>
                       <td>
                        <span className="pl-reason-text">{p.name}</span>
                      </td>
                      <td>{formatDate(p.attendance_date)}</td>
                      <td>
                        <span className="pl-time-badge">
                          {formatTime(p.start_time)} - {formatTime(p.end_time)}
                        </span>
                      </td>
                      <td>
                        <span className="pl-hours">
                          {formatDuration(p.permission_hours)}
                        </span>
                      </td>
                      <td className="pl-reason-cell">
                        <div className="pl-reason-text" title={p.reason}>
                          {p.reason}
                        </div>
                      </td>
                      <td>
                        <span className={`pl-status ${sc.cls}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.status === 'pending' ? (
                          <select
                            className="ll-status-dropdown"
                            value={p.status}
                            disabled={updatingId === p.id}
                            onChange={(e) => updateStatus(p.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve</option>
                            <option value="rejected">Reject</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#94a3b8',
                            }}
                          >
                            {sc.icon} {sc.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    style={{ textAlign: 'center', padding: '40px' }}
                  >
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
