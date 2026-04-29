import React, { useState, useEffect } from 'react';
import '../styles/HolidayForm.css';
import Lottie from 'react-lottie';
import animationData from '../LottieFiles/Confetti.json';
import { IoAdd } from 'react-icons/io5';
import { MdDeleteOutline } from 'react-icons/md';
import { FaRegBell } from 'react-icons/fa';
import { createPortal } from 'react-dom';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const HolidayForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    holiday_date: '',
    description: '',
  });

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();

  const [dateFilter, setDateFilter] = useState({
    month: currentMonth,
    year: currentYear,
  });

  const [holidays, setHolidays] = useState([]);
  const [activeForm, setActiveForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notificationId, setNotificationId] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
  };

  /* ================= FETCH HOLIDAY ================= */
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/holiday/list?month=${dateFilter.month}&year=${dateFilter.year}`
        );
        const result = await response.json();
        if (result.success) setHolidays(result.data);
      } catch (error) {
        console.error('Error fetching Holidays:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, [activeForm, deleteId, dateFilter]);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDate = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= HOLIDAY FORM SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) submitData.append(key, formData[key]);
    });
    try {
      const response = await fetch(`${BASE_URL}/holiday/create`, {
        method: 'POST',
        body: submitData,
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Holiday Created successfully!');
        setFormData({ title: '', holiday_date: '', description: '' });
      } else {
        alert('Failed to create Holiday: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setActiveForm(false);
    }
  };

  /* ================= HOLIDAY DELETE ================= */
  const handleDelete = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('id', deleteId);
    try {
      const response = await fetch(`${BASE_URL}/delete-Holiday/${deleteId}`);
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Holiday Deleted successfully!');
      } else {
        alert('Failed to Delete Holiday: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Error deleting holiday');
    } finally {
      setDeleteId(null);
    }
  };

  /* ================= HOLIDAY NOTIFICATION ================= */
  const handleNotification = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('id', notificationId);
    try {
      const response = await fetch(`${BASE_URL}/send-holiday-notification`, {
        method: 'POST',
        body: submitData,
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Holiday Notification Send successfully!');
      } else {
        alert('Failed to Send Holiday Notification: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in sending holiday notification:', error);
      alert('Error sending holiday notification');
    } finally {
      setNotificationId(null);
    }
  };

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="hol-loading">
        <div className="hol-spinner">
          <span></span><span></span><span></span>
        </div>
        <p>Loading holiday records…</p>
      </div>
    );
  }

  return (
    <div className="hol-page fade-in-up">

      {/* ── HERO HEADER ── */}
      <div className="hol-hero">
        <div className="hol-hero-glow" />
        <div className="hol-hero-inner">
          <div className="hol-hero-lottie">
            <Lottie options={defaultOptions} height={64} width={64} />
          </div>
          <div className="hol-hero-text">
            <h1>Holiday Records</h1>
            <p>Centralize and manage all holiday schedules and special occasions across your organization.</p>
          </div>
          <div className="hol-hero-stat">
            <span className="hol-stat-num">{holidays.length}</span>
            <span className="hol-stat-label">This Month</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="hol-toolbar">
        <div className="hol-filters">
          <div className="hol-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <select name="month" value={dateFilter.month} onChange={handleDate}>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="hol-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <select name="year" value={dateFilter.year} onChange={handleDate}>
              {[2026, 2025, 2024, 2023].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="hol-add-btn" onClick={() => setActiveForm((prev) => !prev)}>
          <IoAdd style={{ fontSize: '18px' }} />
          <span>Add Holiday</span>
        </button>
      </div>

      {/* ── SECTION HEADING ── */}
      <div className="hol-section-head">
        <span className="hol-section-title">List of Holidays</span>
        <span className="hol-section-line" />
      </div>

      {/* ── CARDS GRID ── */}
      <div className="hol-grid">
        {holidays.length === 0 ? (
          <div className="hol-empty">
            <div className="hol-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p>No holiday records found for this period.</p>
          </div>
        ) : (
          holidays.map((data, idx) => (
            <div className="hol-card" key={data.id} style={{ animationDelay: `${idx * 0.06}s` }}>
              <div className="hol-card-accent" />
              <div className="hol-card-top">
                <div className="hol-card-badge">{data.holiday_date}</div>
                <div className="hol-card-actions">
                  <button className="hca-btn send" onClick={() => setNotificationId(data.id)} title="Send notification">
                    <FaRegBell />
                  </button>
                  <button className="hca-btn delete" onClick={() => setDeleteId(data.id)} title="Delete">
                    <MdDeleteOutline />
                  </button>
                </div>
              </div>
              <h3 className="hol-card-title">{data.title}</h3>
              <p className="hol-card-desc">{data.description}</p>
            </div>
          ))
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      {activeForm && createPortal(
        <div className="hmodal-overlay" onClick={() => setActiveForm(false)}>
          <div className="hmodal" onClick={(e) => e.stopPropagation()}>
            <div className="hmodal-header">
              <div className="hmodal-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h2>Holiday Planner</h2>
                <p>Fill in the details below to add a new holiday.</p>
              </div>
              <button className="hmodal-close" onClick={() => setActiveForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="hmodal-form">
              <div className="hfield">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Diwali" required />
              </div>
              <div className="hfield">
                <label>Holiday Date</label>
                <input type="date" name="holiday_date" value={formData.holiday_date} onChange={handleChange} required />
              </div>
              <div className="hfield full">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe the holiday…" required />
              </div>
              <div className="hmodal-actions">
                <button type="button" className="hbtn hbtn-ghost" onClick={() => setActiveForm(false)}>Cancel</button>
                <button type="submit" className="hbtn hbtn-primary">Add Holiday</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteId && createPortal(
        <div className="hmodal-overlay" onClick={() => setDeleteId(null)}>
          <div className="hmodal hmodal-confirm" onClick={(e) => e.stopPropagation()}>
            <button className="hmodal-close" onClick={() => setDeleteId(null)}>×</button>
            <div className="hconfirm-icon danger">
              <MdDeleteOutline />
            </div>
            <h2>Delete Holiday?</h2>
            <p>This action cannot be undone. The holiday will be permanently removed.</p>
            <div className="hmodal-actions centered">
              <button className="hbtn hbtn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="hbtn hbtn-danger" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SEND NOTIFICATION CONFIRM ── */}
      {notificationId && createPortal(
        <div className="hmodal-overlay" onClick={() => setNotificationId(null)}>
          <div className="hmodal hmodal-confirm" onClick={(e) => e.stopPropagation()}>
            <button className="hmodal-close" onClick={() => setNotificationId(null)}>×</button>
            <div className="hconfirm-icon send">
              <FaRegBell />
            </div>
            <h2>Send Holiday Notification?</h2>
            <p>This will immediately push the holiday notification to all recipients in your organization.</p>
            <div className="hmodal-actions centered">
              <button className="hbtn hbtn-ghost" onClick={() => setNotificationId(null)}>Cancel</button>
              <button className="hbtn hbtn-send" onClick={handleNotification}>Send Now</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default HolidayForm;