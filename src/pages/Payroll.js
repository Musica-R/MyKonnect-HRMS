import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx-js-style';
import '../styles/Payroll.css';
import logo from "../assets/ass.jpeg";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ─────────────────────────────────────────────
   AMOUNT TO WORDS
───────────────────────────────────────────── */
function amountToWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];

  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (amount === 0) return 'Zero Rupees Only';

  function convertHundreds(n) {
    let str = '';
    if (n >= 100) { str += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20) { str += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    if (n > 0) str += ones[n] + ' ';
    return str;
  }

  let n = Math.floor(amount);
  let result = '';
  if (n >= 10000000) { result += convertHundreds(Math.floor(n / 10000000)) + 'Crore '; n %= 10000000; }
  if (n >= 100000) { result += convertHundreds(Math.floor(n / 100000)) + 'Lakh '; n %= 100000; }
  if (n >= 1000) { result += convertHundreds(Math.floor(n / 1000)) + 'Thousand '; n %= 1000; }
  if (n > 0) result += convertHundreds(n);

  return result.trim() + ' Rupees Only';
}

/* ─────────────────────────────────────────────
   PAYSLIP PRINT MODAL
───────────────────────────────────────────── */
function PayslipModal({ slip, employee, onClose, logoSrc }) {
  const printRef = useRef();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    let clone = null;
    try {
      const DESKTOP_W = 780;

      clone = printRef.current.cloneNode(true);

      Object.assign(clone.style, {
        position: 'fixed',
        top: '-99999px',
        left: '-99999px',
        width: `${DESKTOP_W}px`,
        minWidth: `${DESKTOP_W}px`,
        maxWidth: `${DESKTOP_W}px`,
        background: '#ffffff',
        padding: '28px 32px',
        boxSizing: 'border-box',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        color: '#111110',
        overflow: 'visible',
        zIndex: '-1',
      });

      const edGrid = clone.querySelector('.ps-ed-grid');
      if (edGrid) {
        edGrid.style.display = 'grid';
        edGrid.style.gridTemplateColumns = '1fr 1fr';
        edGrid.style.gap = '14px';
      }

      const infoBand = clone.querySelector('.ps-info-band');
      if (infoBand) {
        infoBand.style.display = 'grid';
        infoBand.style.gridTemplateColumns = 'repeat(3, 1fr)';
      }

      const attGrid = clone.querySelector('.ps-attendance-grid');
      if (attGrid) {
        attGrid.style.display = 'grid';
        attGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      }

      const logoImg = clone.querySelector('.ps-logo');
      if (logoImg && logoSrc) logoImg.src = logoSrc;

      document.body.appendChild(clone);

      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: DESKTOP_W,
        width: DESKTOP_W,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 10;
      const printW = A4_W - MARGIN * 2;

      const pxPerMm = canvas.width / printW;
      const contentH = canvas.height / pxPerMm;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      if (contentH <= A4_H - MARGIN * 2) {
        pdf.addImage(imgData, 'JPEG', MARGIN, MARGIN, printW, contentH);
      } else {
        const pageContentH = A4_H - MARGIN * 2;
        let yOffset = 0;
        let pageNum = 0;
        while (yOffset < contentH) {
          if (pageNum > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', MARGIN, MARGIN - yOffset, printW, contentH);
          yOffset += pageContentH;
          pageNum++;
        }
      }

      const fileName = `Payslip_${slip.employee_name?.replace(/\s+/g, '_')}_${MONTH_NAMES[slip.month]}_${slip.year}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      setDownloading(false);
    }
  };

  if (!slip) return null;

  const generatedDate = slip.generated_at
    ? new Date(slip.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const grossEarnings = Number(slip.gross_salary ?? 0);
  const netPay = Number(slip.net_payable ?? 0);
  const netInWords = amountToWords(netPay);

  const totalDays = slip.month_days ?? '—';
  const holidays = slip.holiday_count ?? '—';
  const presentDays = slip.present_days ?? '—';
  const absentDays = slip.absent_days ?? '—';
  const compOffDays = slip.comp_off_days ?? 0;
  const clDays = slip.cl_days ?? 0;

  const scheduledHours = slip.scheduled_hours ?? '—';
  const effectiveHours = slip.effective_hours ?? '—';
  const overtimeHours = slip.overtime_hours ?? 0;
  const netHours = slip.net_hours ?? '—';
  const breakHours = slip.break_hours ?? 0;
  const idleHours = slip.idle_hours ?? 0;
  const increment = slip.increment ?? 0;
  const dailyWorkHours = slip.daily_work_hours ?? '—';

  return createPortal(
    <div className="pay-modal-overlay" onClick={onClose}>
      <div className="pay-modal" onClick={e => e.stopPropagation()}>
        <div className="pay-modal-toolbar">
          <span className="pay-modal-toolbar-title">Pay Slip</span>
          <div className="pay-modal-toolbar-actions">
            <button
              className="pay-modal-btn pay-modal-btn--print"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? '⏳ Generating…' : '⬇ Download PDF'}
            </button>
            <button className="pay-modal-btn pay-modal-btn--close" onClick={onClose}>✕ Close</button>
          </div>
        </div>

        <div className="pay-slip-scroll">
          <div className="pay-slip-paper" ref={printRef}>

            <div className="ps-header">
              <div className="ps-brand">
                {logoSrc && <img src={logoSrc} alt="Logo" className="ps-logo" crossOrigin="anonymous" />}
                <div>
                  <div className="ps-company-name">Muthu & Co</div>
                  <div className="ps-company-addr">Salem, Tamil Nadu, India</div>
                </div>
              </div>
              <div className="ps-title-block">
                <div className="ps-slip-badge">Salary Slip</div>
                <div className="ps-period">{MONTH_NAMES[slip.month]} {slip.year}</div>
              </div>
            </div>

            <div className="ps-info-band">
              <div className="ps-info-cell">
                <div className="ps-info-lbl">Employee Name</div>
                <div className="ps-info-val">{slip.employee_name}</div>
              </div>
              <div className="ps-info-cell">
                <div className="ps-info-lbl">Employee ID</div>
                <div className="ps-info-val">
                  {employee?.empid ?? slip.employee_id ?? '—'}
                </div>
              </div>
              <div className="ps-info-cell">
                <div className="ps-info-lbl">Pay Period</div>
                <div className="ps-info-val">{MONTH_NAMES[slip.month]} {slip.year}</div>
              </div>
              <div className="ps-info-cell">
                <div className="ps-info-lbl">Designation</div>
                <div className="ps-info-val">{employee?.designation || slip.designation || '—'}</div>
              </div>
              <div className="ps-info-cell">
                <div className="ps-info-lbl">Department</div>
                <div className="ps-info-val">{employee?.position || slip.position || '—'}</div>
              </div>
              <div className="ps-info-cell">
                <div className="ps-info-lbl">Generated On</div>
                <div className="ps-info-val">{generatedDate}</div>
              </div>
            </div>

            <div className="ps-sec">Attendance Summary</div>
            <div className="ps-attendance-grid">
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Month Days</div>
                <div className="ps-att-val">{totalDays}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Holidays</div>
                <div className="ps-att-val">{holidays}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Days Present</div>
                <div className="ps-att-val green">{presentDays}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Absent Days</div>
                <div className="ps-att-val red">{absentDays}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Comp Off</div>
                <div className="ps-att-val">{compOffDays}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">CL Days</div>
                <div className="ps-att-val">{clDays}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Daily Work Hrs</div>
                <div className="ps-att-val">{slip.daily_work_hours ?? '—'}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Increment</div>
                <div className="ps-att-val">₹ {Number(slip.increment ?? 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="ps-sec">Hours Summary</div>
            <div className="ps-attendance-grid">
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Daily Work Hrs</div>
                <div className="ps-att-val">{dailyWorkHours}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Scheduled Hrs</div>
                <div className="ps-att-val">{scheduledHours}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Break Hrs</div>
                <div className="ps-att-val">{breakHours}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Idle Hrs</div>
                <div className="ps-att-val red">{idleHours}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Effective Hrs</div>
                <div className="ps-att-val green">{effectiveHours}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Overtime Hrs</div>
                <div className="ps-att-val green">{overtimeHours}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Sunday Worked Days</div>
                <div className="ps-att-val">
                  {slip.sunday_worked_days_count ?? 0}
                </div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Sunday Worked Hours</div>
                <div className="ps-att-val green">
                  {slip.sunday_worked_hours ?? 0}
                </div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Net Hrs</div>
                <div className="ps-att-val">{netHours}</div>
              </div>
              <div className="ps-att-cell">
                <div className="ps-att-lbl">Effective?</div>
                <div className={`ps-att-val ${String(slip.effective_condition).toUpperCase() === 'TRUE' || slip.effective_condition === true ? 'green' : 'red'}`}>
                  {String(slip.effective_condition).toUpperCase() === 'TRUE' || slip.effective_condition === true ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            <div className="ps-sec">Earnings &amp; Deductions</div>
            <div className="ps-ed-grid">
              <table className="ps-tbl">
                <thead>
                  <tr><th>Earnings</th><th style={{ textAlign: 'right' }}>Amount (₹)</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Monthly Salary</td>
                    <td style={{ textAlign: 'right' }}>₹ {Number(slip.total_salary ?? slip.salary ?? 0).toLocaleString()}</td>
                  </tr>
                  {increment > 0 && (
                    <tr>
                      <td>Increment</td>
                      <td style={{ textAlign: 'right' }}>₹ {Number(increment).toLocaleString()}</td>
                    </tr>
                  )}
                  {Number(slip.overtime_hours) > 0 && (
                    <tr>
                      <td>Overtime Pay ({slip.overtime_hours}h)</td>
                      <td style={{ textAlign: 'right' }}>₹ {Number(slip.overtime_pay ?? 0).toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Gross Salary</td>
                    <td style={{ textAlign: 'right' }}>₹ {grossEarnings.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              <table className="ps-tbl">
                <thead>
                  <tr><th>Deductions</th><th style={{ textAlign: 'right' }}>Amount (₹)</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Loss of Pay ({slip.lop_days ?? 0} days)</td>
                    <td className="td-red" style={{ textAlign: 'right' }}>
                      ₹ {Number(slip.lop_amount ?? 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total Deductions</td>
                    <td className="td-red" style={{ textAlign: 'right' }}>
                      ₹ {Number(slip.lop_amount ?? 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="ps-net-row">
              <div className="ps-net-left">
                <div className="ps-net-title">Net Pay</div>
                <div className="ps-net-month">{MONTH_NAMES[slip.month]} {slip.year}</div>
              </div>
              <div className="ps-net-right">
                <div className="ps-net-amount">₹ {netPay.toLocaleString()}</div>
              </div>
            </div>

            <div className="ps-words-row">
              <span className="ps-words-label">Amount in Words:</span>
              <span className="ps-words-value">{netInWords}</span>
            </div>

            <div className="ps-slip-footer">
              <div className="ps-footer-note">
                <div>Payroll processed by Muthu & Co</div>
                <div className="ps-footer-conf">This is a system-generated document. No signature required.</div>
              </div>
              <div className="ps-signature-block">
                <div className="ps-sig-line"></div>
                <div className="ps-sig-lbl">Authorised Signatory</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────
   SUMMARY CARDS COMPONENT
───────────────────────────────────────────── */
function SummaryCards({ data, period, meta }) {
  const totalFinal = data.reduce((s, e) => s + Number(e.net_payable ?? e.final_salary ?? 0), 0);

  const first = data[0] || {};
  const totalDays = meta?.month_days ?? first.month_days ?? '—';
  const holidays = meta?.holiday_count ?? first.holiday_count ?? '—';

  return (
    <div className="pay-summary-row">
      <div className="pay-summary-card">
        <span className="pay-summary-label">Employees</span>
        <span className="pay-summary-value">{data.length}</span>
      </div>
      <div className="pay-summary-card">
        <span className="pay-summary-label">Total Payable</span>
        <span className="pay-summary-value pay-summary-value--success">₹ {totalFinal.toLocaleString()}</span>
      </div>
      <div className="pay-summary-card pay-summary-card--sm">
        <span className="pay-summary-label">Month Days</span>
        <span className="pay-summary-value pay-summary-value--neutral">{totalDays}</span>
      </div>
      <div className="pay-summary-card pay-summary-card--sm">
        <span className="pay-summary-label">Holidays</span>
        <span className="pay-summary-value pay-summary-value--muted">{holidays}</span>
      </div>
      {period && (
        <div className="pay-summary-card pay-summary-card--sm">
          <span className="pay-summary-label">Period</span>
          <span className="pay-summary-value pay-summary-value--period">{period}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TABLE COLUMNS DEFINITION (shared for PDF & Excel)
───────────────────────────────────────────── */
const TABLE_COLUMNS = [
  { label: '#',                  key: null,                    type: 'index' },
  { label: 'Employee',           key: 'employee_name',         type: 'text' },
  { label: 'Salary',             key: 'total_salary',          type: 'currency', fallback: 'salary' },
  { label: 'Month Days',         key: 'month_days',            type: 'plain' },
  { label: 'Holidays',           key: 'holiday_count',         type: 'plain' },
  { label: 'Present',            key: 'present_days',          type: 'plain' },
  { label: 'Absent',             key: 'absent_days',           type: 'plain' },
  { label: 'Comp Off',           key: 'comp_off_days',         type: 'plain', default: 0 },
  { label: 'CL',                 key: 'cl_days',               type: 'plain', default: 0 },
  { label: 'Increment',          key: 'increment',             type: 'currency', default: 0 },
  { label: 'Daily Hrs',          key: 'daily_work_hours',      type: 'hours' },
  { label: 'Sched. Hrs',         key: 'scheduled_hours',       type: 'hours' },
  { label: 'Idle Hrs',           key: 'idle_hours',            type: 'hours', default: 0 },
  { label: 'Effective Hrs',      key: 'effective_hours',       type: 'hours' },
  { label: 'OT Hrs',             key: 'overtime_hours',        type: 'hours', default: 0 },
  { label: 'OT Pay',             key: 'overtime_pay',          type: 'currency', default: 0 },
  { label: 'Gross Salary',       key: 'gross_salary',          type: 'currency', default: 0 },
  { label: 'Break Hrs',          key: 'break_hours',           type: 'hours', default: 0 },
  { label: 'Sunday Worked Days', key: 'sunday_worked_days_count', type: 'plain', default: 0 },
  { label: 'Net Hrs',            key: 'net_hours',             type: 'hours' },
  { label: 'Effective?',         key: 'effective_condition',   type: 'bool' },
  { label: 'LOP Days',           key: 'lop_days',              type: 'plain', default: 0 },
  { label: 'LOP Amt',            key: 'lop_amount',            type: 'currency', default: 0 },
  { label: 'Net Payable',        key: 'net_payable',           type: 'currency', default: 0 },
];

/* resolve raw value from a row */
function rawVal(col, row, idx) {
  if (col.type === 'index') return idx + 1;
  const v = row[col.key] ?? row[col.fallback] ?? col.default ?? '—';
  return v;
}

/* human-readable cell text for PDF — use Rs. not ₹ (jsPDF built-in font can't render ₹) */
// function cellText(col, row, idx) {
//   const v = rawVal(col, row, idx);
//   if (col.type === 'index') return String(v);
//   if (col.type === 'currency') return `Rs.${Number(v).toLocaleString('en-IN')}`;
//   if (col.type === 'hours') return v !== '—' ? `${v}h` : '—';
//   if (col.type === 'bool') {
//     return (String(v).toUpperCase() === 'TRUE' || v === true) ? 'Yes' : 'No';
//   }
//   return v !== null && v !== undefined ? String(v) : '—';
// }

/* numeric value for Excel cells */
function excelVal(col, row, idx) {
  const v = rawVal(col, row, idx);
  if (col.type === 'index') return idx + 1;
  if (col.type === 'currency') return Number(v) || 0;
  if (col.type === 'hours') return v !== '—' ? Number(v) : '';
  if (col.type === 'bool') return (String(v).toUpperCase() === 'TRUE' || v === true) ? 'Yes' : 'No';
  if (col.type === 'plain') return v !== '—' ? (isNaN(v) ? v : Number(v)) : '';
  return v !== '—' ? v : '';
}

/* ─────────────────────────────────────────────
   DOWNLOAD AS EXCEL
───────────────────────────────────────────── */
function downloadExcel(list, month, year) {
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: '1a56db' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top:    { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left:   { style: 'thin', color: { rgb: 'CCCCCC' } },
      right:  { style: 'thin', color: { rgb: 'CCCCCC' } },
    },
  };

  const cellStyle = (isEven) => ({
    font: { sz: 10 },
    fill: { fgColor: { rgb: isEven ? 'F0F5FF' : 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left:   { style: 'thin', color: { rgb: 'DDDDDD' } },
      right:  { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  });

  const totalStyle = {
    font: { bold: true, sz: 11 },
    fill: { fgColor: { rgb: 'E8F0FE' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'medium', color: { rgb: '1a56db' } },
      bottom: { style: 'medium', color: { rgb: '1a56db' } },
      left:   { style: 'thin', color: { rgb: 'DDDDDD' } },
      right:  { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  };

  /* Header row */
  const headerRow = TABLE_COLUMNS.map(col => ({
    v: col.label,
    t: 's',
    s: headerStyle,
  }));

  /* Data rows */
  const dataRows = list.map((emp, idx) =>
    TABLE_COLUMNS.map(col => {
      const v = excelVal(col, emp, idx);
      const t = typeof v === 'number' ? 'n' : 's';
      return { v, t, s: cellStyle(idx % 2 === 1) };
    })
  );

  /* Total row */
  const totalNetPayable = list.reduce((s, e) => s + Number(e.net_payable ?? 0), 0);
  const totalRow = TABLE_COLUMNS.map((col, ci) => {
    if (ci === 0) return { v: 'Total', t: 's', s: { ...totalStyle, font: { ...totalStyle.font, bold: true } } };
    if (col.label === 'Net Payable') return { v: totalNetPayable, t: 'n', s: totalStyle };
    return { v: '', t: 's', s: totalStyle };
  });

  const wsData = [headerRow, ...dataRows, totalRow];

  const ws = XLSX.utils.aoa_to_sheet(wsData.map(row => row.map(c => c.v)));

  /* Apply styles */
  wsData.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (!ws[addr]) ws[addr] = {};
      ws[addr].s = cell.s;
      ws[addr].t = cell.t;
      ws[addr].v = cell.v;
    });
  });

  /* Column widths */
  ws['!cols'] = TABLE_COLUMNS.map((col, i) => {
    if (i === 0) return { wch: 4 };
    if (col.type === 'currency') return { wch: 14 };
    if (col.type === 'hours') return { wch: 12 };
    if (col.label === 'Employee') return { wch: 22 };
    return { wch: 13 };
  });

  /* Row heights */
  ws['!rows'] = [{ hpt: 32 }, ...list.map(() => ({ hpt: 22 })), { hpt: 26 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${MONTH_NAMES[Number(month)]} ${year}`);
  XLSX.writeFile(wb, `Payroll_${MONTH_NAMES[Number(month)]}_${year}.xlsx`);
}

/* ─────────────────────────────────────────────
   DOWNLOAD AS PDF — all 24 cols on ONE landscape page
   • Uses short header labels so everything fits in 281 mm
   • Rs. instead of ₹  (jsPDF built-in font can't render ₹)
   • Auto-paginates rows if employee count exceeds page height
───────────────────────────────────────────── */
async function downloadTablePDF(list, month, year) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297;
  const PH = 210;
  const M  = 4;           // tight margin so table gets max width
  const UW = PW - M * 2;  // 289 mm usable

  /* ── Short header labels that fit in narrow columns ── */
  const PDF_COLS = [
    { label: '#',          key: null,                     type: 'index'    },
    { label: 'Employee',   key: 'employee_name',           type: 'text'     },
    { label: 'Salary',     key: 'total_salary',            type: 'currency', fallback: 'salary' },
    { label: 'Days',       key: 'month_days',              type: 'plain'    },
    { label: 'Hols',       key: 'holiday_count',           type: 'plain'    },
    { label: 'Pres',       key: 'present_days',            type: 'plain'    },
    { label: 'Abs',        key: 'absent_days',             type: 'plain'    },
    { label: 'Comp',       key: 'comp_off_days',           type: 'plain',   default: 0 },
    { label: 'CL',         key: 'cl_days',                 type: 'plain',   default: 0 },
    { label: 'Incr',       key: 'increment',               type: 'currency', default: 0 },
    { label: 'DlyHr',      key: 'daily_work_hours',        type: 'hours'    },
    { label: 'SchHr',      key: 'scheduled_hours',         type: 'hours'    },
    { label: 'IdleHr',     key: 'idle_hours',              type: 'hours',   default: 0 },
    { label: 'EffHr',      key: 'effective_hours',         type: 'hours'    },
    { label: 'OTHr',       key: 'overtime_hours',          type: 'hours',   default: 0 },
    { label: 'OTPay',      key: 'overtime_pay',            type: 'currency', default: 0 },
    { label: 'Gross',      key: 'gross_salary',            type: 'currency', default: 0 },
    { label: 'BrkHr',      key: 'break_hours',             type: 'hours',   default: 0 },
    { label: 'SunDays',    key: 'sunday_worked_days_count', type: 'plain',  default: 0 },
    { label: 'NetHr',      key: 'net_hours',               type: 'hours'    },
    { label: 'Eff?',       key: 'effective_condition',     type: 'bool'     },
    { label: 'LOPd',       key: 'lop_days',                type: 'plain',   default: 0 },
    { label: 'LOPAmt',     key: 'lop_amount',              type: 'currency', default: 0 },
    { label: 'Net Pay',    key: 'net_payable',             type: 'currency', default: 0 },
  ];

  /* column widths in mm — total must equal UW (289) */
  const COL_W = [
    6,   // #
    28,  // Employee
    17,  // Salary
    9,   // Days
    8,   // Hols
    8,   // Pres
    8,   // Abs
    9,   // Comp
    7,   // CL
    13,  // Incr
    10,  // DlyHr
    10,  // SchHr
    10,  // IdleHr
    10,  // EffHr
    10,  // OTHr
    13,  // OTPay
    16,  // Gross
    10,  // BrkHr
    12,  // SunDays
    10,  // NetHr
    8,   // Eff?
    8,   // LOPd
    13,  // LOPAmt
    17,  // Net Pay
  ];
  // verify / auto-scale so widths always equal UW exactly
  const rawSum = COL_W.reduce((a, b) => a + b, 0);
  const scaledW = COL_W.map(w => (w / rawSum) * UW);

  /* cell text resolver — Rs. not ₹ */
  const pdfCellText = (col, row, idx) => {
    const v = col.type === 'index'
      ? idx + 1
      : row[col.key] ?? row[col.fallback] ?? col.default ?? '—';
    if (col.type === 'index')    return String(v);
    if (col.type === 'currency') return `Rs.${Number(v).toLocaleString('en-IN')}`;
    if (col.type === 'hours')    return v !== '—' ? `${v}h` : '—';
    if (col.type === 'bool')     return (String(v).toUpperCase() === 'TRUE' || v === true) ? 'Yes' : 'No';
    return v !== null && v !== undefined ? String(v) : '—';
  };

  const TITLE_H  = 14;   // mm reserved for title block
  const HEADER_H = 9;    // mm for column header row
  const ROW_H    = 7;    // mm per data row
  const FS_HDR   = 5.5;  // pt — header font
  const FS_DATA  = 5.5;  // pt — data font

  /* ── Draw title ── */
  const drawPageTitle = () => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(26, 86, 219);
    pdf.text('Muthu & Co  -  Payroll Report', M, M + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Period: ${MONTH_NAMES[Number(month)]} ${year}`, M, M + 10);
    pdf.setDrawColor(26, 86, 219);
    pdf.setLineWidth(0.4);
    pdf.line(M, M + 12, PW - M, M + 12);
  };

  /* ── Draw column header row ── */
  const drawHeader = (y) => {
    pdf.setFillColor(26, 86, 219);
    pdf.rect(M, y, UW, HEADER_H, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FS_HDR);
    pdf.setTextColor(255, 255, 255);
    let x = M;
    PDF_COLS.forEach((col, ci) => {
      const w = scaledW[ci];
      pdf.text(col.label, x + w / 2, y + HEADER_H / 2 + 1.5, { align: 'center', maxWidth: w - 0.5 });
      x += w;
    });
    /* white vertical dividers */
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.15);
    let dx = M;
    scaledW.forEach((w, ci) => {
      dx += w;
      if (ci < scaledW.length - 1) pdf.line(dx, y, dx, y + HEADER_H);
    });
  };

  /* ── Draw one data row ── */
  const drawRow = (emp, idx, y) => {
    if (idx % 2 === 1) {
      pdf.setFillColor(240, 246, 255);
      pdf.rect(M, y, UW, ROW_H, 'F');
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FS_DATA);
    pdf.setTextColor(25, 25, 25);
    let x = M;
    PDF_COLS.forEach((col, ci) => {
      const w = scaledW[ci];
      const txt = pdfCellText(col, emp, idx);
      pdf.text(txt, x + w / 2, y + ROW_H / 2 + 1.5, { align: 'center', maxWidth: w - 0.5 });
      x += w;
    });
    pdf.setDrawColor(210, 210, 210);
    pdf.setLineWidth(0.08);
    pdf.line(M, y + ROW_H, M + UW, y + ROW_H);
  };

  /* ── Draw total footer row ── */
  const drawTotalRow = (y) => {
    const totalNet = list.reduce((s, e) => s + Number(e.net_payable ?? 0), 0);
    pdf.setFillColor(224, 236, 255);
    pdf.rect(M, y, UW, ROW_H, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FS_DATA);
    pdf.setTextColor(26, 86, 219);
    let x = M;
    PDF_COLS.forEach((col, ci) => {
      const w = scaledW[ci];
      let txt = '';
      if (ci === 1) txt = 'Total Net Payable';
      if (col.label === 'Net Pay') txt = `Rs.${totalNet.toLocaleString('en-IN')}`;
      if (txt) pdf.text(txt, x + w / 2, y + ROW_H / 2 + 1.5, { align: 'center', maxWidth: w - 0.5 });
      x += w;
    });
    pdf.setDrawColor(26, 86, 219);
    pdf.setLineWidth(0.4);
    pdf.line(M, y, M + UW, y);
    pdf.line(M, y + ROW_H, M + UW, y + ROW_H);
  };

  /* ── Render all rows with auto page-break ── */
  drawPageTitle();
  let y = M + TITLE_H;
  drawHeader(y);
  y += HEADER_H;

  list.forEach((emp, idx) => {
    if (y + ROW_H > PH - M - ROW_H) {
      /* new page — redraw title + header */
      pdf.addPage();
      drawPageTitle();
      y = M + TITLE_H;
      drawHeader(y);
      y += HEADER_H;
    }
    drawRow(emp, idx, y);
    y += ROW_H;
  });

  drawTotalRow(y);

  /* outer table border */
  pdf.setDrawColor(160, 160, 190);
  pdf.setLineWidth(0.3);
  pdf.rect(M, M + TITLE_H, UW, y + ROW_H - (M + TITLE_H));

  pdf.save(`Payroll_${MONTH_NAMES[Number(month)]}_${year}.pdf`);
}

/* ─────────────────────────────────────────────
   MONTHLY PAYROLL TAB
───────────────────────────────────────────── */
function MonthlyPayroll({ employees }) {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [list, setList] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [slipLoading, setSlipLoading] = useState(null);
  const [activeSlip, setActiveSlip] = useState(null);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleViewReport = async () => {
    setViewing(true);
    setError(null);
    setList([]);
    setMode(null);
    try {
      const res = await fetch(`${BASE_URL}/salarySlipList`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: Number(month), year: Number(year) }),
      });
      const result = await res.json();
      if (result.success) {
        if (!result.data || result.data.length === 0) {
          setError(`No salary data found for ${MONTH_NAMES[Number(month)]} ${year}. Use "Generate Salary" to create it.`);
        } else {
          setList(result.data);
          setMode('viewed');
        }
      } else {
        setError(result.message || 'Failed to fetch salary report.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setViewing(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setList([]);
    setMode(null);
    try {
      const res = await fetch(`${BASE_URL}/salary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: Number(month), year: Number(year) }),
      });
      const result = await res.json();
      if (result.success) {
        setList(result.data || []);
        setMode('generated');
      } else {
        setError(result.message || 'Failed to generate salary.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewSlip = async (emp) => {
    setSlipLoading(emp.user_id);
    try {
      const res = await fetch(`${BASE_URL}/salarySlipList`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: Number(month), year: Number(year) }),
      });
      const result = await res.json();
      if (result.success && result.data?.length > 0) {
        const empSlip = result.data.find(s => s.user_id === emp.user_id) || result.data[0];
        setActiveSlip(empSlip);
        setActiveEmployee(employees.find(e => e.id === emp.user_id) || null);
      } else {
        setActiveSlip(emp);
        setActiveEmployee(employees.find(e => e.id === emp.user_id) || null);
      }
    } catch {
      alert('Error fetching payslip.');
    } finally {
      setSlipLoading(null);
    }
  };

  /* ── Download handlers ── */
  const handleDownloadExcel = () => {
    setDownloadingExcel(true);
    try {
      downloadExcel(list, month, year);
    } catch (err) {
      console.error('Excel generation failed:', err);
      alert('Could not generate Excel. Please try again.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      await downloadTablePDF(list, month, year);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const monthOptions = [
    { v: '1', l: 'January' }, { v: '2', l: 'February' }, { v: '3', l: 'March' },
    { v: '4', l: 'April' }, { v: '5', l: 'May' }, { v: '6', l: 'June' },
    { v: '7', l: 'July' }, { v: '8', l: 'August' }, { v: '9', l: 'September' },
    { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
  ];
  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  const isBusy = generating || viewing;

  return (
    <div className="pay-content">
      <div className="pay-monthly-controls">
        <div className="pay-filter-row pay-filter-row--monthly">

          {/* LEFT: selectors */}
          <div className="pay-filter-selectors">
            <label className="pay-filter-label">Month</label>
            <select
              className="pay-select"
              value={month}
              onChange={e => { setMonth(e.target.value); setMode(null); setList([]); setError(null); }}
            >
              {monthOptions.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
            <label className="pay-filter-label">Year</label>
            <select
              className="pay-select"
              value={year}
              onChange={e => { setYear(e.target.value); setMode(null); setList([]); setError(null); }}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* RIGHT: actions */}
          <div className="pay-filter-actions">
            <button
              className="pay-view-report-btn"
              onClick={handleViewReport}
              disabled={isBusy}
            >
              {viewing ? 'Loading…' : 'View Report'}
            </button>
            <button
              className="pay-generate-btn"
              onClick={handleGenerate}
              disabled={isBusy}
            >
              {generating ? 'Generating…' : 'Generate Salary'}
            </button>
          </div>

        </div>
      </div>

      {error && <div className="pay-state pay-state--error">{error}</div>}

      {!mode && !error && (
        <div className="pay-state">
          Select a month and year — click <strong>View Report</strong> to see existing payroll,
          or <strong>Generate Salary</strong> to compute a new month.
        </div>
      )}

      {mode && list.length > 0 && (
        <>
          {/* Summary + Download buttons row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <SummaryCards
              data={list}
              period={`${MONTH_NAMES[Number(month)]} ${year}`}
            />
            {/* ── Download buttons — only shown in "viewed" mode ── */}
            {mode === 'viewed' && (
              <div className="pay-download-actions">
                <button
                  className="pay-download-btn pay-download-btn--excel"
                  onClick={handleDownloadExcel}
                  disabled={downloadingExcel || downloadingPDF}
                  title="Download as Excel"
                >
                  {downloadingExcel ? (
                    <>⏳ Exporting…</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="11" x2="12" y2="17"/>
                        <polyline points="9 14 12 17 15 14"/>
                      </svg>
                      Download Excel
                    </>
                  )}
                </button>
                <button
                  className="pay-download-btn pay-download-btn--pdf"
                  onClick={handleDownloadPDF}
                  disabled={downloadingExcel || downloadingPDF}
                  title="Download as PDF"
                >
                  {downloadingPDF ? (
                    <>⏳ Generating…</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="11" x2="12" y2="17"/>
                        <polyline points="9 14 12 17 15 14"/>
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {mode === 'generated' && (
            <div className="pay-state pay-state--success" style={{ padding: '10px 16px', textAlign: 'left' }}>
              ✅ Salary generated successfully for <strong>{MONTH_NAMES[Number(month)]} {year}</strong>.
            </div>
          )}

          <div className="pay-table-wrapper">
            <table className="pay-table">
              <thead>
                <tr>
                  <th className="pay-th pay-th--num">#</th>
                  <th className="pay-th">Employee</th>
                  <th className="pay-th pay-th--r">Salary</th>
                  <th className="pay-th pay-th--c">Month Days</th>
                  <th className="pay-th pay-th--c">Holidays</th>
                  <th className="pay-th pay-th--c">Present</th>
                  <th className="pay-th pay-th--c">Absent</th>
                  <th className="pay-th pay-th--c">Comp Off</th>
                  <th className="pay-th pay-th--c">CL</th>
                  <th className="pay-th pay-th--r">Increment</th>
                  <th className="pay-th pay-th--r">Daily Hrs</th>
                  <th className="pay-th pay-th--r">Sched. Hrs</th>
                  <th className="pay-th pay-th--r">Idle Hrs</th>
                  <th className="pay-th pay-th--r">Effective Hrs</th>
                  <th className="pay-th pay-th--r">OT Hrs</th>
                  <th className="pay-th pay-th--r">OT Pay</th>
                  <th className="pay-th pay-th--r">Gross Salary</th>
                  <th className="pay-th pay-th--r">Break Hrs</th>
                  <th className="pay-th pay-th--c">Sunday Worked Days</th>
                  <th className="pay-th pay-th--r">Net Hrs</th>
                  <th className="pay-th pay-th--c">Effective?</th>
                  <th className="pay-th pay-th--r">LOP Days</th>
                  <th className="pay-th pay-th--r">LOP Amt</th>
                  <th className="pay-th pay-th--final pay-th--r">Net Payable</th>
                  <th className="pay-th pay-th--action">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((emp, idx) => (
                  <tr key={`${emp.user_id}-${idx}`}>
                    <td className="pay-td pay-td--num">{idx + 1}</td>
                    <td className="pay-td pay-td--bold">{emp.employee_name}</td>
                    <td className="pay-td pay-td--r">₹ {Number(emp.total_salary ?? emp.salary ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--c">{emp.month_days ?? '—'}</td>
                    <td className="pay-td pay-td--c pay-td--muted">{emp.holiday_count ?? '—'}</td>
                    <td className="pay-td pay-td--c pay-td--success">{emp.present_days ?? '—'}</td>
                    <td className="pay-td pay-td--c pay-td--danger">{emp.absent_days ?? '—'}</td>
                    <td className="pay-td pay-td--c">{emp.comp_off_days ?? 0}</td>
                    <td className="pay-td pay-td--c">{emp.cl_days ?? 0}</td>
                    <td className="pay-td pay-td--r">₹ {Number(emp.increment ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--r">{emp.daily_work_hours != null ? `${emp.daily_work_hours} hrs` : '—'}</td>
                    <td className="pay-td pay-td--r">{emp.scheduled_hours != null ? `${emp.scheduled_hours} hrs` : '—'}</td>
                    <td className="pay-td pay-td--r pay-td--amount-danger">{emp.idle_hours != null ? `${emp.idle_hours} hrs` : '0 hrs'}</td>
                    <td className="pay-td pay-td--r">{emp.effective_hours != null ? `${emp.effective_hours} hrs` : '—'}</td>
                    <td className="pay-td pay-td--r">{emp.overtime_hours != null ? `${emp.overtime_hours} hrs` : '0 hrs'}</td>
                    <td className="pay-td pay-td--r pay-td--success">₹ {Number(emp.overtime_pay ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--r">₹ {Number(emp.gross_salary ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--r pay-td--muted">{emp.break_hours != null ? `${emp.break_hours} hrs` : '0 hrs'}</td>
                    <td className="pay-td pay-td--c">
                      {emp.sunday_worked_days_count ?? 0}
                    </td>
                    <td className="pay-td pay-td--r">{emp.net_hours != null ? `${emp.net_hours} hrs` : '—'}</td>
                    <td className="pay-td pay-td--c">
                      <span className={String(emp.effective_condition).toUpperCase() === 'TRUE' || emp.effective_condition === true ? 'pay-badge pay-badge--success' : 'pay-badge pay-badge--danger'}>
                        {String(emp.effective_condition).toUpperCase() === 'TRUE' || emp.effective_condition === true ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="pay-td pay-td--c pay-td--danger">{emp.lop_days ?? 0}</td>
                    <td className="pay-td pay-td--r pay-td--amount-danger">₹ {Number(emp.lop_amount ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--final pay-td--r">₹ {Number(emp.net_payable ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--action">
                      <button
                        className="pay-view-btn"
                        onClick={() => handleViewSlip(emp)}
                        disabled={slipLoading !== null}
                      >
                        {slipLoading === emp.user_id ? <span className="pay-btn-spinner"></span> : 'View Slip'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pay-td pay-tfoot-label" colSpan={24}>Total Net Payable</td>
                  <td className="pay-td pay-td--final pay-td--r">
                    ₹ {list.reduce((s, e) => s + Number(e.net_payable ?? 0), 0).toLocaleString()}
                  </td>
                  <td className="pay-td"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {activeSlip && (
        <PayslipModal
          slip={activeSlip}
          employee={activeEmployee}
          onClose={() => { setActiveSlip(null); setActiveEmployee(null); }}
          logoSrc={logo}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DAILY PAYROLL TAB
───────────────────────────────────────────── */
function DailyPayroll() {
  const [date] = useState(todayStr);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const fetchDaily = async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/generate-Salary-TillDate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: d }),
      });
      const result = await res.json();
      if (result.success) {
        const rows = result.data || [];
        setData(rows);
        const first = rows[0] || {};
        setMeta({
          month_days: first.month_days,
          holiday_count: first.holiday_count,
          from_date: first.from_date,
          to_date: first.to_date,
          month: first.month,
          year: first.year,
        });
      } else {
        setError('Failed to fetch payroll data.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDaily(date); }, [date]);

  return (
    <div className="pay-content">
      <div className="pay-filter-row pay-filter-row--daily">
        {meta && (
          <span className="pay-meta-tag">
            Period: {meta.from_date} → {meta.to_date}
          </span>
        )}
      </div>

      {loading && <div className="pay-state">Loading payroll data…</div>}
      {error && <div className="pay-state pay-state--error">{error}</div>}
      {!loading && !error && data.length === 0 && (
        <div className="pay-state">No records found for the selected date.</div>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          <SummaryCards data={data} meta={meta} />
          <div className="pay-table-wrapper">
            <table className="pay-table">
              <thead>
                <tr>
                  <th className="pay-th pay-th--num">#</th>
                  <th className="pay-th">Employee</th>
                  <th className="pay-th pay-th--r">Salary</th>
                  <th className="pay-th pay-th--c">Month Days</th>
                  <th className="pay-th pay-th--c">Holidays</th>
                  <th className="pay-th pay-th--c">Present</th>
                  <th className="pay-th pay-th--c">Absent</th>
                  <th className="pay-th pay-th--c">Comp Off</th>
                  <th className="pay-th pay-th--c">CL</th>
                  <th className="pay-th pay-th--r">Increment</th>
                  <th className="pay-th pay-th--r">Daily Hrs</th>
                  <th className="pay-th pay-th--r">Sched. Hrs</th>
                  <th className="pay-th pay-th--r">Idle Hrs</th>
                  <th className="pay-th pay-th--r">Effective Hrs</th>
                  <th className="pay-th pay-th--r">OT Hrs</th>
                  <th className="pay-th pay-th--r">OT Pay</th>
                  <th className="pay-th pay-th--r">Break Hrs</th>
                  <th className="pay-th">Sunday Worked Days</th>
                  <th className="pay-th pay-th--r">Net Hrs</th>
                  <th className="pay-th pay-th--c">Effective?</th>
                  <th className="pay-th pay-th--r">LOP Days</th>
                  <th className="pay-th pay-th--r">LOP Amt</th>
                  <th className="pay-th pay-th--r">Per Hr</th>
                  <th className="pay-th pay-th--r">Gross Salary</th>
                  <th className="pay-th pay-th--final pay-th--r">Net Payable</th>
                </tr>
              </thead>
              <tbody>
                {data.map((emp, idx) => (
                  <tr key={`${emp.user_id}-${idx}`}>
                    <td className="pay-td pay-td--num">{idx + 1}</td>
                    <td className="pay-td pay-td--bold">{emp.employee_name}</td>
                    <td className="pay-td pay-td--r">₹ {Number(emp.total_salary ?? emp.base_salary ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--c">{emp.month_days ?? '—'}</td>
                    <td className="pay-td pay-td--c pay-td--muted">{emp.holiday_count ?? '—'}</td>
                    <td className="pay-td pay-td--c pay-td--success">{emp.present_days ?? '—'}</td>
                    <td className="pay-td pay-td--c pay-td--danger">{emp.absent_days ?? '—'}</td>
                    <td className="pay-td pay-td--c">{emp.comp_off_days ?? 0}</td>
                    <td className="pay-td pay-td--c">{emp.cl_days ?? 0}</td>
                    <td className="pay-td pay-td--r">₹ {Number(emp.increment ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--r">{emp.daily_work_hours != null ? `${emp.daily_work_hours} hrs` : '—'}</td>
                    <td className="pay-td pay-td--r">{emp.scheduled_hours != null ? `${emp.scheduled_hours} hrs` : '—'}</td>
                    <td className="pay-td pay-td--r pay-td--amount-danger">{emp.idle_hours != null ? `${emp.idle_hours} hrs` : '0 hrs'}</td>
                    <td className="pay-td pay-td--r">{emp.effective_hours != null ? `${emp.effective_hours} hrs` : '—'}</td>
                    <td className="pay-td pay-td--r">{emp.overtime_hours != null ? `${emp.overtime_hours} hrs` : '0 hrs'}</td>
                    <td className="pay-td pay-td--r pay-td--success">₹ {Number(emp.overtime_pay ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--r pay-td--muted">{emp.break_hours != null ? `${emp.break_hours} hrs` : '0 hrs'}</td>               
                    <td className="pay-td pay-td--c">
                      {emp.sunday_worked_days_count ?? 0}
                    </td>              
                    <td className="pay-td pay-td--r">{emp.net_hours != null ? `${emp.net_hours} hrs` : '—'}</td>
                    <td className="pay-td pay-td--c">
                      <span className={String(emp.effective_condition).toUpperCase() === 'TRUE' ? 'pay-badge pay-badge--success' : 'pay-badge pay-badge--danger'}>
                        {String(emp.effective_condition).toUpperCase() === 'TRUE' ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="pay-td pay-td--c pay-td--danger">{emp.lop_days ?? 0}</td>
                    <td className="pay-td pay-td--r pay-td--amount-danger">₹ {Number(emp.lop_amount ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--r">₹ {Number(emp.per_hour_salary ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--r">₹ {Number(emp.gross_salary ?? 0).toLocaleString()}</td>
                    <td className="pay-td pay-td--final pay-td--r">₹ {Number(emp.net_payable ?? emp.final_salary ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pay-td pay-tfoot-label" colSpan={24}>Total Net Payable</td>
                  <td className="pay-td pay-td--final pay-td--r">
                    ₹ {data.reduce((s, e) => s + Number(e.net_payable ?? e.final_salary ?? 0), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
export default function Payroll() {
  const [activeTab, setActiveTab] = useState('daily');
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/employee-List`)
      .then(r => r.json())
      .then(res => { if (res.success) setEmployees(res.data || []); })
      .catch(() => { });
  }, []);

  return (
    <div className="pay-page">
      <div className="pay-header">
        <h1 className="pay-title">Payroll</h1>
        <p className="pay-subtitle">Salary computation and disbursement records</p>
      </div>

      <div className="pay-tabbar">
        <button
          className={`pay-tab${activeTab === 'daily' ? ' pay-tab--active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          Daily Payroll
        </button>
        <button
          className={`pay-tab${activeTab === 'monthly' ? ' pay-tab--active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Payroll
        </button>
      </div>

      {activeTab === 'daily' && <DailyPayroll />}
      {activeTab === 'monthly' && <MonthlyPayroll employees={employees} />}
    </div>
  );
}
