import React, { useState, useEffect } from 'react';
import '../styles/CompanyDetails.css';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Company.json';
import { IoAdd } from 'react-icons/io5';
// import { MdDeleteOutline } from 'react-icons/md';
import { createPortal } from 'react-dom';
import { FaGreaterThan } from 'react-icons/fa6';
import { CiEdit } from 'react-icons/ci';

const CompanyDetails = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
  });

  const [formData1, setFormData1] = useState({
    company_id: '',
    branch_name: '',
    branch_lon: '',
    branch_lat: '',
    branch_address: '',
    branch_id: '',
    meter: ''
  });

  const [activeCompanyForm, setActiveCompanyForm] = useState(false);
  const [activeBranchForm, setActiveBranchForm] = useState(false);
  const [branchList, setBranchList] = useState(false);

  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(null);

  const [branch, setBranch] = useState([]);
  // const [branchId, setBranchId] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const [loading, setLoading] = useState(true);

  // const defaultOptions = {
  //   loop: true,
  //   autoplay: true,
  //   animationData: animationData,
  //   rendererSettings: {
  //     preserveAspectRatio: 'xMidYMid slice',
  //   },
  // };

  /* ================= EDIT BRANCH ================= */

  const handleEdit = (branch) => {
    setFormData1({
      company_id: branch.company_id,
      branch_name: branch.branch_name,
      branch_lat: branch.branch_lat,
      branch_lon: branch.branch_lon,
      branch_address: branch.branch_address,
      branch_id: branch.id,
      meter: branch.meter || ''
    });
    setIsEdit(true);
    setActiveBranchForm(true);
  };

  /* ================= FETCH COMPANIES ================= */

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);

      try {
        const response = await fetch(
          'https://hrms.mpdatahub.com/api/list-company'
        );
        const result = await response.json();
        if (result.success) {
          setCompanies(result.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
      setLoadingCompanies(false);
    };

    fetchCompanies();
  }, [setActiveCompanyForm]);

  /* ================= FETCH BRANCH BY COMPANY ID ================= */

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await fetch(
          `https://hrms.mpdatahub.com/api/list-Branch-id/${companyId}`
        );
        const result = await response.json();
        if (result.success) {
          setBranch(result.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchBranch();
  }, [companyId, formData1]);

  /* ================= HANDLE INPUT ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange1 = (e) => {
    const { name, value } = e.target;

    setFormData1((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= COMPANY FORM SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch(
        'https://hrms.mpdatahub.com/api/add-company',
        {
          method: 'POST',
          body: submitData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log(result);
        alert(result.message || 'Company Created successfully!');

        setFormData({
          company_name: '',
          company_address: '',
        });
      } else {
        alert(
          'Failed to create Company: ' + (result.message || 'Unknown error')
        );
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setActiveCompanyForm(false);
    }
  };

  /* ================= BRANCH FORM SUBMIT ================= */

  const branchUpdate = async (e) => {
    e.preventDefault();

    const submitData = new FormData();

    Object.keys(formData1).forEach((key) => {
      if (formData1[key] !== null) {
        submitData.append(key, formData1[key]);
      }
    });

    try {
      if (isEdit) {
        const response = await fetch(
          'https://hrms.mpdatahub.com/api/update-branch',
          {
            method: 'POST',
            body: submitData,
          }
        );

        const result = await response.json();

        if (response.ok) {
          console.log(result);
          alert(result.message || 'Branch Updated successfully!');

          setFormData1({
            company_id: '',
            branch_name: '',
            branch_lon: '',
            branch_lat: '',
            branch_address: '',
            branch_id: '',
          });
        } else {
          alert(
            'Failed to update Branch: ' + (result.message || 'Unknown error')
          );
        }
      } else {
        const response = await fetch(
          'https://hrms.mpdatahub.com/api/add-branch',
          {
            method: 'POST',
            body: submitData,
          }
        );

        const result = await response.json();

        if (response.ok) {
          console.log(result);
          alert(result.message || 'Branch Created successfully!');

          setFormData1({
            company_id: '',
            branch_name: '',
            branch_lon: '',
            branch_lat: '',
            branch_address: '',
            branch_id: '',
          });
        } else {
          alert(
            'Failed to create Branch: ' + (result.message || 'Unknown error')
          );
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setActiveBranchForm(false);
    }
  };

  /* ================= LOADING STATE ================= */

  if (loading) {
    return (
      <div className="attendance-page loading-container">
        <div className="loader-pulse"></div>
        <p>Loading Company records...</p>
      </div>
    );
  }

  return (
    <div className="form-containers fade-in-up">
      {/* HEADER */}
      <div className="page-headers glass-panels">
        <div className="header-content">
          <div className="permission-title-group">
            <Lottie animationData={animationData} style={{ width: "70px", height: "70px" }} />
            <div>
              <h1>Add Company</h1>
              <p>
                Create and maintain company profiles to streamline operations,
                improve data management, and support organizational growth.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="toggle-button">
        <button
          className="toggle-btn"
          onClick={() => setActiveCompanyForm((prev) => !prev)}
        >
          <IoAdd style={{ fontSize: '15px' }} /> Add Company
        </button>

        <button
          className="toggle-btn"
          onClick={() => setActiveBranchForm((prev) => !prev)}
        >
          <IoAdd style={{ fontSize: '15px' }} /> Add Branch
        </button>
      </div>

      {/* ================= COMPANY FORM ================= */}

      {activeCompanyForm &&
        createPortal(
          <div
            className="modal-overlays"
            onClick={() => setActiveCompanyForm(false)}
          >
            <div
              className="form-card modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-btn"
                onClick={() => setActiveCompanyForm(false)}
              >
                ×
              </button>
              <h2 className="form-title">Add New Company</h2>

              <form onSubmit={handleSubmit} className="registration-form">
                {/* COMPANY NAME */}

                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* COMPANY ADDRESS */}

                <div className="form-group full-width">
                  <label>Company Address</label>

                  <textarea
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleChange}
                    rows="3"
                    required
                  ></textarea>
                </div>

                {/* SUBMIT */}

                <div className="form-actions full-width">
                  <button type="submit" className="submit-btn">
                    {' '}
                    Add Company{' '}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ================= BRANCH FORM ================= */}

      {activeBranchForm &&
        createPortal(
          <div
            className="modal-overlays"
            onClick={() => {
              setActiveBranchForm(false);
              setFormData1({
                company_id: '',
                branch_name: '',
                branch_lon: '',
                branch_lat: '',
                branch_address: '',
                branch_id: '',
                meter: ''
              });
            }}
          >
            <div
              className="form-card modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-btn"
                onClick={() => {
                  setActiveBranchForm(false);
                  setFormData1({
                    company_id: '',
                    branch_name: '',
                    branch_lon: '',
                    branch_lat: '',
                    branch_address: '',
                    branch_id: '',
                    meter: ''
                  });
                }}
              >
                ×
              </button>
              <h2 className="form-title">
                {isEdit ? 'Update Branch' : 'Add New Branch'}
              </h2>

              <form onSubmit={branchUpdate} className="registration-form">
                {/* COMPANY ID */}
                <div className="form-group">
                  <label>Company ID</label>
                  <select
                    name="company_id"
                    value={formData1.company_id}
                    onChange={handleChange1}
                    required
                  >
                    <option value="">
                      {loadingCompanies ? 'Loading...' : 'Select Company'}
                    </option>

                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BRANCH NAME */}
                <div className="form-group">
                  <label>Branch Name</label>
                  <input
                    type="text"
                    name="branch_name"
                    value={formData1.branch_name}
                    onChange={handleChange1}
                    required
                  />
                </div>

                {/* BRANCH LATITUDE */}
                <div className="form-group">
                  <label>Company Latitude</label>
                  <input
                    type="text"
                    name="branch_lat"
                    value={formData1.branch_lat}
                    onChange={handleChange1}
                    required
                  />
                </div>

                {/* BRANCH LONGITUDE */}
                <div className="form-group">
                  <label>Company Longitude</label>
                  <input
                    type="text"
                    name="branch_lon"
                    value={formData1.branch_lon}
                    onChange={handleChange1}
                    required
                  />
                </div>

                {/* BRANCH ADDRESS */}
                <div className="form-group full-width">
                  <label>Branch Address</label>
                  <textarea
                    name="branch_address"
                    value={formData1.branch_address}
                    onChange={handleChange1}
                    rows="3"
                    required
                  ></textarea>
                </div>

                {/* RADIUS DROPDOWN */}
                <div className="form-group">
                  <label>Allowed Radius (Meters)</label>
                  <select name="meter" value={formData1.meter} onChange={handleChange1} required>
                    <option value="">Select Radius</option>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((meter) => (
                      <option key={meter} value={meter}>
                        {meter} meters
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUBMIT */}

                <div className="form-actions full-width">
                  <button type="submit" className="submit-btn">
                    {' '}
                    {isEdit ? 'Update Branch' : 'Add Branch'}{' '}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ================= COMPANY LIST ================= */}

      <h2 className="form-title">Company List</h2>
      <div className="card-container">
        {companies.map((data) => (
          <div className="holiday-card" key={data.id}>
            <div className="card-header">
              <h3>{data.name}</h3>
              <span className="arrow">
                <button
                  className="delete-icons"
                  onClick={() => {
                    setBranchList(true);
                    setCompanyId(data.id);
                  }}
                >
                  <FaGreaterThan style={{ color: '#5355E0' }} />
                </button>
              </span>
            </div>
            {/* <p className="description">{data.description}</p> */}
          </div>
        ))}
      </div>

      {/* ================= BRANCH LIST ================= */}

      {branchList &&
        createPortal(
          <div className="modal-overlays" onClick={() => setBranchList(false)}>
            <div
              className="form-card1 modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-btn"
                onClick={() => setBranchList(false)}
              >
                ×
              </button>
              <h2 className="form-title">Branch List</h2>

              <div className="card-containers">
                {branch.map((data) => (
                  <div className="holiday-card" key={data.id}>
                    <div className="toggle-button">
                      <button
                        className="delete-icons"
                        onClick={() => handleEdit(data)}
                      >
                        <CiEdit style={{ color: '#5355E0' }} />
                      </button>
                      {/* <button
                        className="delete-icons"
                      >
                        <MdDeleteOutline
                          style={{ fontSize: '23px', color: '#c62828' }}
                        />
                      </button> */}
                    </div>
                    <div className="card-header">
                      <h3>{data.branch_name}</h3>
                      {/* <span className="date">Lat:{data.branch_lat}</span>
                      <span className="date">Lon:{data.branch_lon}</span> */}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="date">Lat: {data.branch_lat}</span>
                      <span className="date">Lon: {data.branch_lon}</span>
                    </div>

                    <div className="meter-badge">
                      {data.meter} meters
                    </div>
                    <p className="description">{data.branch_address}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CompanyDetails;
