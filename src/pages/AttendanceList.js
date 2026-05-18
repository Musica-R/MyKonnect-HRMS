import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/AttendanceList.css';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Completing Tasks.json';
import * as XLSX from "xlsx-js-style";
import { useLocation } from "react-router-dom";

const AttendanceList = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const [userType, setUserType] = useState(
    location.state?.userType || 'emp_present'
  );

  const now = new Date();

  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState([]);

  const [dateFilter, setDateFilter] = useState(now.toISOString().split('T')[0]);

  const handleDate = (e) => {
    const { value } = e.target;
    setDateFilter(value);
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const fetchAttendance = async () => {
      try {
        let url = '';

        switch (userType) {
          case 'emp_present':
            url = `https://hrms.mpdatahub.com/api/attendance-list?date=${dateFilter}`;
            break;
          case 'intern_present':
            url = `https://hrms.mpdatahub.com/api/attendance-list-intern?date=${dateFilter}`;
            break;
          case 'emp_absent':
            url = `https://hrms.mpdatahub.com/api/attendance-List-absent?date=${dateFilter}`;
            break;
          case 'intern_absent':
            url = `https://hrms.mpdatahub.com/api/attendance-List-absentinten?date=${dateFilter}`;
            break;
          default:
            url = `https://hrms.mpdatahub.com/api/attendance-list?date=${dateFilter}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (isMounted && result.success && result.data) {
          setAttendanceData(result.data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(fetchAttendance, 10000);
        }
      }
    };

    fetchAttendance();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [dateFilter, userType]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const url =
          userType === 'intern'
            ? `https://hrms.mpdatahub.com/api/employee-List-roles`
            : `https://hrms.mpdatahub.com/api/employee-List`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          setEmployees(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchEmployees();
  }, [userType]);

  const fetchMonthlyReport = async () => {
    if (!selectedUser) return alert("Select Employee");

    try {
      const res = await fetch(
        `https://hrms.mpdatahub.com/api/get-Monthly-Summary?user_id=${selectedUser}&month=${month}&year=${year}`
      );
      const data = await res.json();

      if (data.success) {
        setReport(data.data.attendance);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getReportTitle = () => {
    switch (userType) {
      case 'emp_present':    return 'Employee Check-in List';
      case 'intern_present': return 'Intern Check-in List';
      case 'emp_absent':     return 'Employee Non Check-in List';
      case 'intern_absent':  return 'Intern Non Check-in List';
      default:               return 'Attendance Report';
    }
  };

  const exportDailyReport = () => {
    const worksheetData = attendanceData.map((item, index) => ({
      "S.No": index + 1,
      "Employee Name": item.name || "-",
      "Date": item.attendance_date || "-",
      "Check In": item.check_in || "-",
      "Check Out": item.check_out || "-",
      "Status": item.type || "-",
      "Worked Hours": item.worked_hours || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { origin: "A5" });

    XLSX.utils.sheet_add_aoa(worksheet, [
      ["Muthu & Co"],
      [getReportTitle()],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      []
    ], { origin: "A1" });

    ["A1", "A2", "A3"].forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true, sz: cell === "A1" ? 16 : 14 },
          alignment: { horizontal: "center" }
        };
      }
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }
    ];

    worksheet["!cols"] = [
      { wch: 6 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, `${getReportTitle().replace(/\s+/g, '_')}_${dateFilter}.xlsx`);
  };

  const exportMonthlyReport = () => {
    const worksheetData = report.map((r, index) => ({
      "S.No": index + 1,
      "Date": r.date || "-",
      "Check In": r.check_in || "-",
      "Check Out": r.check_out || "-",
      "Status": r.type || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { origin: "A5" });

    XLSX.utils.sheet_add_aoa(worksheet, [
      ["Muthu & Co"],
      ["Monthly Attendance Report"],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      []
    ], { origin: "A1" });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
    ];

    ["A1", "A2", "A3"].forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true, sz: cell === "A1" ? 16 : 14 },
          alignment: { horizontal: "center" }
        };
      }
    });

    worksheet["!cols"] = [
      { wch: 6 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
    XLSX.writeFile(workbook, "Monthly_Attendance_Report.xlsx");
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === '00:00:00') return '--';
    const [hour, minute] = timeString.split(':');
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getInitials = (name) => {
    if (!name) return 'UN';
    return name.substring(0, 2).toUpperCase();
  };

  const formatDuration = (timeString) => {
    if (!timeString || timeString === '00:00:00') return '--';
    const [hours, minutes] = timeString.split(':').map(Number);
    if (hours === 0 && minutes === 0) return '--';
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  const openModal = () => {
    setReport([]);
    setSelectedUser('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setReport([]);
  };

  if (loading) {
    return (
      <div className="attendance-page loading-container">
        <div className="loader-pulse"></div>
        <p>Loading attendance records...</p>
      </div>
    );
  }

  // ✅ Modal rendered via Portal directly into document.body
  // This escapes any parent with transform/animation that would
  // break position:fixed, ensuring it's always centered in viewport.
  const modalContent = showModal ? ReactDOM.createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="modal-box">
        <h2>Monthly Report</h2>

        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <input
          type="number"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="Month"
        />
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year"
        />

        <button onClick={fetchMonthlyReport}>Get Report</button>
        <button onClick={exportMonthlyReport}>Export Excel</button>
        <button onClick={closeModal}>Close</button>

        <div className="modal-table">
          {report.length === 0 ? (
            <p style={{ marginTop: "10px", padding: "10px", color: "#6b7280" }}>No data available</p>
          ) : (
            <table className="elegant-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r, i) => (
                  <tr key={i}>
                    <td>{formatDate(r.date)}</td>
                    <td>{formatTime(r.check_in)}</td>
                    <td>{formatTime(r.check_out)}</td>
                    <td>{r.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="attendance-page fade-in-up">
      {/* HEADER */}
      <div className="page-header glass-panel">
        <div className="header-content">
          <div className="permission-title-group">
            <Lottie animationData={animationData} style={{ width: "70px", height: "70px" }} />
            <div>
              <h1>Attendance Records</h1>
              <p>Track and manage employee daily presence and work hours.</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="primary-btn" onClick={exportDailyReport}>
              Download Daily Report
            </button>
            <button className="success-btn" onClick={openModal}>
              Monthly Report
            </button>
          </div>

          <div className="header-actions">
            <div className="stat-badge">
              <span className="badge-label">Monthly Records</span>
              <span className="badge-value">{attendanceData.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', width: '100%', gap: '30px', padding: '10px' }}>
        <div className="form-group">
          <label>Date Filter</label>
          <input
            type="date"
            name="attendance_date"
            value={dateFilter}
            onChange={handleDate}
            required
          />
        </div>
      </div>

      <div className="attendance-toggle">
        <button
          className={userType === 'emp_present' ? 'active-toggle' : ''}
          onClick={() => { setUserType('emp_present'); setLoading(true); }}
        >
          Employee Check-in List
        </button>
        <button
          className={userType === 'intern_present' ? 'active-toggle' : ''}
          onClick={() => { setUserType('intern_present'); setLoading(true); }}
        >
          Intern Check-in List
        </button>
        <button
          className={userType === 'emp_absent' ? 'active-toggle' : ''}
          onClick={() => { setUserType('emp_absent'); setLoading(true); }}
        >
          Employee Non Check-in List
        </button>
        <button
          className={userType === 'intern_absent' ? 'active-toggle' : ''}
          onClick={() => { setUserType('intern_absent'); setLoading(true); }}
        >
          Intern Non Check-in List
        </button>
      </div>

      {/* TABLE */}
      <div className="attendance-content glass-panel">
        <div className="table-responsive">
          <table className="elegant-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Late By</th>
                <th>Worked Hours</th>
                <th>Shortfall / Overtime</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length > 0 ? (
                attendanceData.map((record) => (
                  <tr key={record.id} className="table-row">
                    <td>
                      <div className="employee-cell">
                        <div className="avatar-circle">{getInitials(record.name)}</div>
                        <span className="employee-name">{record.name}</span>
                      </div>
                    </td>
                    <td>{formatDate(record.attendance_date)}</td>
                    <td>
                      <div className="time-badge in">
                        {record.type === 'ABSENT' ? '--' : formatTime(record.check_in)}
                      </div>
                    </td>
                    <td>
                      <div className="time-badge out">
                        {record.type === 'ABSENT' ? '--' : formatTime(record.check_out)}
                      </div>
                    </td>
                    <td>
                      <div className="status-flex">
                        <span className={`status-pill ${record.type?.toLowerCase() === 'present' ? 'present' : 'absent'}`}>
                          {record.type || 'N/A'}
                        </span>
                        {record.late_checkin === 1 && (
                          <span className="late-indicator" title={`Late by ${record.late_checkin_time}`}>
                            Late
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {record.late_checkin === 1 ? formatDuration(record.late_checkin_time) : '--'}
                    </td>
                    <td>
                      <span className="hours-text">{formatDuration(record.worked_hours)}</span>
                    </td>
                    <td>
                      <span className="hours-text">{formatDuration(record.overtimed_hours)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal rendered via Portal — always centered in viewport */}
      {modalContent}
    </div>
  );
};

export default AttendanceList;