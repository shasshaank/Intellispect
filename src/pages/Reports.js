import React, { useEffect, useState } from 'react';
import '../styles/Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);

  const handleDownload = (report) => {
    const reportText = `IntelliInspect Anomaly Report\n\n` +
      `ID: ${report._id || 'N/A'}\n` +
      `Type: ${report.type}\n` +
      `Confidence: ${(parseFloat(report.confidence) * 100).toFixed(1)}%\n` +
      `Severity: ${report.severity}\n` +
      `Timestamp: ${new Date(report.timestamp).toLocaleString()}\n` +
      `Filename: ${report.filename || 'N/A'}\n`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IntelliInspect_Report_${report.filename ? report.filename.split('.')[0] : 'Anomaly'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchReports = async () => {
      const email = localStorage.getItem('userEmail'); // Move it here
      if (!email) {
        alert('No user email found. Please log in again.');
        window.location.href = '/';
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/get-reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_email: email }),
        });

        const data = await response.json();
        if (response.ok) {
          setReports(data);
        } else {
          console.error('Failed to fetch reports:', data.error);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="reports-page">
      <h1 className="reports-title">Anomaly Reports</h1>

      <div className="reports-table">
        <div className="table-header">
          <span>ID</span>
          <span>Type</span>
          <span>Confidence</span>
          <span>Severity</span>
          <span>Timestamp</span>
          <span>Report</span>
        </div>

        {reports.map((r, index) => (
          <div key={r._id || index} className="table-row">
            <span>{index + 1}</span>
            <span>{r.type}</span>
            <span>{(parseFloat(r.confidence) * 100).toFixed(1)}%</span>
            <span className={`severity ${r.severity.toLowerCase()}`}>{r.severity}</span>
            <span>{new Date(r.timestamp).toLocaleString()}</span>
            <span>
              <button className="download-btn" onClick={() => handleDownload(r)}>Download</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
