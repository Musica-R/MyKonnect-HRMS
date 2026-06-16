import React, { useEffect, useState } from 'react';
import '../styles/EmpList.css';
import { FiEdit2, FiX, FiSave, FiSearch } from 'react-icons/fi';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Employee Search.json';

const API_URL = 'https://hrms.mpdatahub.com/api/employee-List';
const UPDATE_URL = 'https://hrms.mpdatahub.com/api/update-profile';
const INACTIVE_URL = 'https://hrms.mpdatahub.com/api/employees/inactive';
const INTERN_ACTIVE_URL = 'https://hrms.mpdatahub.com/api/employee-List-roles';
const INTERN_INACTIVE_URL = 'https://hrms.mpdatahub.com/api/employees/inactive/roles';
const DELETE_URL = 'https://hrms.mpdatahub.com/api/remove-user';

export default function EmpList() {
  const [employees, setEmployees] = useState([]);
  const [inactiveEmployees, setInactiveEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [filterStatus, setFilterStatus] = useState('active');

  const [activeInterns, setActiveInterns] = useState([]);
  const [inactiveInterns, setInactiveInterns] = useState([]);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchInactiveEmployees();
    fetchActiveInterns();
    fetchInactiveInterns();
    fetchRoles();
  }, []);

  // const defaultOptions = {
  //   loop: true,
  //   autoplay: true,
  //   animationData: animationData,
  //   rendererSettings: {
  //     preserveAspectRatio: 'xMidYMid slice',
  //   },
  // };

  const fetchActiveInterns = async () => {
    try {
      const res = await fetch(INTERN_ACTIVE_URL);
      const json = await res.json();

      if (json.success) {
        setActiveInterns(json.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchInactiveInterns = async () => {
    try {
      const res = await fetch(INTERN_INACTIVE_URL);
      const json = await res.json();

      if (json.success) {
        setInactiveInterns(json.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const deleteEmployee = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);

      const res = await fetch(`${DELETE_URL}?id=${deleteId}`);
      const json = await res.json();

      if (json.success) {
        await fetchEmployees();
        await fetchInactiveEmployees();
        await fetchActiveInterns();
        await fetchInactiveInterns();
        setDeleteModal(false);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  const counts = {
    active: employees.length,
    inactive: inactiveEmployees.length,
    activeIntern: activeInterns.length,
    inactiveIntern: inactiveInterns.length,
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);

      const res = await fetch('https://hrms.mpdatahub.com/api/roles');
      const json = await res.json();

      if (json.success) {
        setRoles(json.data);
      }
    } catch (err) {
      console.log(err);
    }

    setLoadingRoles(false);
  };

  /* ---------------- FETCH ACTIVE EMPLOYEES ---------------- */

  const fetchEmployees = async () => {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();

      if (json.success) {
        setEmployees(json.data);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /* ---------------- FETCH INACTIVE EMPLOYEES ---------------- */

  const fetchInactiveEmployees = async () => {
    try {
      const res = await fetch(INACTIVE_URL);
      const json = await res.json();

      if (json.success) {
        setInactiveEmployees(json.data);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };
  const activeInternFiltered = activeInterns.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inactiveInternFiltered = inactiveInterns.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  /* ---------------- UPDATE EMPLOYEES STATUS ---------------- */

  const updateEmployeeStatus = async (id, status) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://hrms.mpdatahub.com/api/update-Employee-Status?user_id=${id}&status=${status}`
      );
      const json = await res.json();

      if (json.success) {
        fetchEmployees();
        fetchInactiveEmployees();
        fetchActiveInterns();
        fetchInactiveInterns();
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /* ---------------- TOOGLE BUTTON ---------------- */

  const handleToggle = (id, status) => {
    const updatedStatus = status === 0 ? 1 : 0;
    updateEmployeeStatus(id, updatedStatus);
  };

  /* ---------------- OPEN EDIT ---------------- */

  const openEdit = (emp) => {
    setEditData({
      id: emp.id,
      name: emp.name || '',
      empid: emp.empid || '',
      email: emp.email || '',
      mobile: emp.mobile || '',
      salary: emp.salary || '',
      position: emp.position || '',
      address: emp.address || '',
      dob: emp.dob || '',
      role_id: emp.role_id || '',
      start_time: emp.start_time ? emp.start_time.slice(0, 5) : '',
      end_time: emp.end_time ? emp.end_time.slice(0, 5) : '',
    });

    setEditModal(true);
  };

  const formatTime = (time) => {
    if (!time) return '';

    const [hour, minute] = time.split(':');

    let h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';

    h = h % 12 || 12; // convert 0 → 12

    return `${h}:${minute} ${ampm}`;
  };

  /* ---------------- INPUT CHANGE ---------------- */

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ---------------- SAVE EDIT ---------------- */

  const saveEdit = async () => {
    if (!editData?.id) {
      setSaveError('ID missing');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const formData = new FormData();
      const formatToHMS = (time) => {
        if (!time) return '';
        if (time.length === 8) return time;
        return time + ':00'; // convert HH:mm → HH:mm:ss
      };
      formData.append('id', editData.id);

      // only send changed fields
      if (editData.name) formData.append('name', editData.name);
      if (editData.empid) formData.append('empid', editData.empid);
      if (editData.email) formData.append('email', editData.email);
      if (editData.mobile) formData.append('mobile', editData.mobile);
      if (editData.salary) {
        formData.append('salary', editData.salary);
      }
      if (editData.position) formData.append('position', editData.position);
      if (editData.role_id) formData.append('role_id', editData.role_id);
      if (editData.address) formData.append('address', editData.address);
      if (editData.dob) formData.append('dob', editData.dob);

      if (editData.start_time) {
        formData.append('start_time', formatToHMS(editData.start_time));
      }

      if (editData.end_time) {
        formData.append('end_time', formatToHMS(editData.end_time));
      }

      const res = await fetch(UPDATE_URL, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      console.log('API Response:', json);

      if (json.success) {
        await fetchEmployees();
        await fetchInactiveEmployees();
        await fetchActiveInterns();
        await fetchInactiveInterns();

        setEditModal(false);
      } else {
        setSaveError(json.message || 'Update failed');
      }
    } catch {
      setSaveError('Network error');
    }
    setSaving(false);
  };
  /* ---------------- SEARCH ---------------- */
  const active = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const inactive = inactiveEmployees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const openDelete = (id) => {
    setDeleteId(id);
    setDeleteModal(true);
  };
  /* ---------------- UI ---------------- */
  return (
    <div className="emplist-page">
      {/* HEADER */}

      <div className="emplist-header">
        <div className="emplist-title">
          <Lottie animationData={animationData} style={{ width: "90px", height: "90px" }} />
          <div>
            <h1>Employee List</h1>
            <p>{employees.length} employees</p>
          </div>
        </div>

        <div className="emplist-search-wrap">
          <FiSearch className="search-icon" />
          <input
            className="emplist-search"
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && <p>Loading...</p>}

      <div className="pl-tabs">
        {['active', 'inactive', 'activeIntern', 'inactiveIntern'].map((s) => (
          <button
            key={s}
            className={`pl-tab ${filterStatus === s ? 'pl-tab--active' : ''}`}
            onClick={() => {
              setFilterStatus(s);
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="pl-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* EMPLOYEE GRID */}

      <div className="emp-grid">
        {loading ? (
          <div className="emp-loader">
            <p>Loading employees...</p>
          </div>
        ) : (
          (
            filterStatus === 'active'
              ? active
              : filterStatus === 'inactive'
                ? inactive
                : filterStatus === 'activeIntern'
                  ? activeInternFiltered
                  : inactiveInternFiltered
          ).map((emp) => (
            <div className="emp-card" key={emp.id}>
              <div className="emp-card-top">
                <img
                  src={emp.profile_img}
                  alt={emp.name}
                  className="emp-avatar"
                />
                <div className="emp-badge">{emp.empid}</div>
              </div>

              <div className="emp-card-body">
                <h3>{emp.name}</h3>

                <span className="emp-position">{emp.position || 'N/A'}</span>

                <p>
                  <strong>Email:</strong> {emp.email}
                </p>
                <p>
                  <strong>Phone:</strong> {emp.mobile}
                </p>
                <p>
                  <strong>Salary:</strong> ₹{' '}
                  {emp.salary ? Number(emp.salary).toLocaleString() : 'N/A'}
                </p>
                <p>
                  <strong>DOB:</strong> {emp.dob || 'N/A'}
                </p>
                <p>
                  <strong>Address:</strong> {emp.address}
                </p>
                <p>
                  <strong>Work Time:</strong>{' '}
                  {formatTime(emp.start_time)} to {formatTime(emp.end_time)}
                </p>
                {/*============= BUTTONS =================*/}

                <div className="emp-card-actions">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={emp.status === 1}
                      onChange={() => handleToggle(emp.id, emp.status)}
                    />
                    <span className="slider"></span>
                  </label>

                  <span className="status-text">
                    {emp.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="emp-card-actions">
                {(filterStatus === 'inactive' || filterStatus === 'inactiveIntern') ? (
                  <button className="btn-delete" onClick={() => openDelete(emp.id)}>
                    Delete
                  </button>
                ) : (
                  <button className="btn-edit" onClick={() => openEdit(emp)}>
                    <FiEdit2 /> Edit
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}

      {editModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Edit Employee</h2>

              <button
                className="modal-close"
                onClick={() => setEditModal(false)}
                style={{ width: 100 }}
              >
                <FiX />
              </button>
            </div>

            {saveError && <div className="modal-api-error">{saveError}</div>}

            <div className="modal-form">

              <div className="form-groups">
                <label htmlFor="name">Employee Name</label>
                <input
                  id="name"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="empid">Employee ID</label>
                <input
                  id="empid"
                  name="empid"
                  value={editData.empid}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={editData.email}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="mobile">Mobile Number</label>
                <input
                  id="mobile"
                  name="mobile"
                  value={editData.mobile}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="salary">Salary</label>
                <input
                  id="salary"
                  type="number"
                  name="salary"
                  placeholder="Salary"
                  value={editData.salary}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="position">Position</label>
                <input
                  id="position"
                  name="position"
                  value={editData.position}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="role_id">Role</label>

                <select
                  id="role_id"
                  name="role_id"
                  value={editData.role_id}
                  onChange={handleEditChange}
                >
                  <option value="">
                    {loadingRoles ? 'Loading...' : 'Select Role'}
                  </option>

                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-groups">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  value={editData.dob}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  value={editData.address}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="start_time">Start Time</label>
                <input
                  id="start_time"
                  type="time"
                  name="start_time"
                  value={editData.start_time}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-groups">
                <label htmlFor="end_time">End Time</label>
                <input
                  id="end_time"
                  type="time"
                  name="end_time"
                  value={editData.end_time}
                  onChange={handleEditChange}
                />
              </div>

            </div>


            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setEditModal(false)}
              >
                Cancel
              </button>

              <button className="btn-save" onClick={saveEdit} disabled={saving}>
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <FiSave /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
            </div>

            <p>Are you sure you want to delete this employee?</p>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setDeleteModal(false)}
              >
                No
              </button>

              <button
                className="btn-delete"
                onClick={deleteEmployee}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
