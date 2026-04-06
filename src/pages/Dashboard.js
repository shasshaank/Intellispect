import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [inputPreview, setInputPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      alert('No user email found. Please log in again.');
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setInputPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert('Please select a file before analyzing.');
      return;
    }

    if (!email) {
      alert('User email missing. Please log in again.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_email', email); // This key must match backend

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Prediction failed.');
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Prediction error occurred.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Anomaly Detection Dashboard</h1>

      <div className="dashboard-main">
        <div className="upload-section">
          <p>Upload an image to detect defects</p>
          <input
            type="file"
            accept="image/*"
            className="file-input"
            onChange={handleFileChange}
          />
          <button
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        <div className="output-panel">
          <h2>Model Output</h2>
          {result ? (
            <>
              <p className="output-status">
                {result.anomaly_detected ? '✅ Anomaly Detected' : '✔️ No Defect'}
              </p>
              <p>
                Type: <span className="highlight">{result.type}</span>
              </p>
              <p>
                Confidence:{' '}
                <span className="confidence">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </p>
              <p>
                Severity:{' '}
                <span className={`severity-${(result.severity || '').toLowerCase()}`}>
                  {result.severity}
                </span>
              </p>
            </>
          ) : (
            <p>No prediction yet.</p>
          )}
        </div>
      </div>

      <div className="preview-section">
        <div className="image-card">
          <p className="image-label">Input Image</p>
          {inputPreview ? (
            <img
              src={inputPreview}
              alt="Input Preview"
              className="image-placeholder"
            />
          ) : (
            <div className="image-placeholder"></div>
          )}
        </div>
        <div className="image-card">
          <p className="image-label">Prediction Overlay</p>
          {result && result.heatmap ? (
            <img
              src={result.heatmap}
              alt="Prediction Overlay"
              className="image-placeholder"
            />
          ) : (
            <div className="image-placeholder"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
