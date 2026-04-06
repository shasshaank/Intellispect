import React, { useState } from "react";
import axios from "axios";

function Predict() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null); // Changed from string to object to store full prediction data
  const [loading, setLoading] = useState(false); // Added loading state for better UX
  const [error, setError] = useState(""); // Added error state for better error handling

  const handleUpload = async () => {
    // Clear previous results and errors
    setError("");
    setPrediction(null);

    // FIX 1: Check if file is selected before proceeding
    if (!file) {
      setError("Please select an image file.");
      return;
    }

    // FIX 2: Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to make predictions.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file); // FIX 3: Use 'file' instead of undefined 'selectedFile'

    setLoading(true); // Set loading state

    try {
      const res = await axios.post("http://localhost:5000/predict", formData, {
        headers: {
          Authorization: `Bearer ${token}`, // FIX 4: Added backticks for template literal syntax
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Prediction result:", res.data);
      
      // FIX 5: Actually update state with prediction results instead of just commenting
      setPrediction({
        anomalyDetected: res.data.anomaly_detected,
        type: res.data.type,
        confidence: res.data.confidence,
        severity: res.data.severity,
        imageId: res.data.image_id,
        predictionId: res.data.prediction_id
      });

    } catch (err) {
      console.error("Prediction failed:", err);
      
      // FIX 6: Enhanced error handling with specific error messages
      if (err.response) {
        // Server responded with an error status
        const status = err.response.status;
        const message = err.response.data?.error || "Unknown server error";
        
        switch (status) {
          case 400:
            setError(`Invalid request: ${message}`);
            break;
          case 401:
            setError("Session expired. Please log in again.");
            localStorage.removeItem("token"); // Clear invalid token
            break;
          case 413:
            setError("File too large. Please select a smaller image (max 16MB).");
            break;
          case 503:
            setError("Service temporarily unavailable. Please try again later.");
            break;
          default:
            setError(`Server error (${status}): ${message}`);
        }
      } else if (err.request) {
        // Network error - no response received
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        // Other error (request setup, etc.)
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false); // Always clear loading state
    }
  };

  // Helper function to format confidence as percentage
  const formatConfidence = (confidence) => {
    return (confidence * 100).toFixed(2);
  };

  // Helper function to handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Clear previous results when new file is selected
    setPrediction(null);
    setError("");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Screw Anomaly Detection</h1>
      
      {/* File input section */}
      <div style={{ marginBottom: "1rem" }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} // FIX 7: Use dedicated handler function
          disabled={loading} // Disable during upload
          style={{ marginBottom: "0.5rem" }}
        />
        {/* Show selected file info */}
        {file && (
          <p style={{ fontSize: "0.9rem", color: "#666", margin: "0.5rem 0" }}>
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Upload button */}
      <button 
        onClick={handleUpload} 
        disabled={loading || !file} // FIX 8: Disable when loading or no file selected
        style={{ 
          margin: "1rem 0",
          padding: "0.5rem 1rem",
          backgroundColor: loading || !file ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading || !file ? "not-allowed" : "pointer",
          fontSize: "1rem"
        }}
      >
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>

      {/* Error display */}
      {error && (
        <div style={{ 
          color: "#dc3545", 
          backgroundColor: "#f8d7da", 
          padding: "0.75rem", 
          borderRadius: "4px",
          marginBottom: "1rem",
          border: "1px solid #f5c6cb"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div style={{ 
          textAlign: "center", 
          marginTop: "1rem",
          color: "#666"
        }}>
          <p>🔍 Analyzing image... Please wait.</p>
        </div>
      )}

      {/* FIX 9: Enhanced prediction results display */}
      {prediction && (
        <div style={{ 
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: prediction.anomalyDetected ? "#f8d7da" : "#d4edda",
          border: `1px solid ${prediction.anomalyDetected ? "#f5c6cb" : "#c3e6cb"}`,
          borderRadius: "4px"
        }}>
          <h3 style={{ marginTop: 0 }}>Prediction Results:</h3>
          <div style={{ lineHeight: "1.6" }}>
            <p><strong>Status:</strong> {prediction.type}</p>
            <p><strong>Anomaly Detected:</strong> {prediction.anomalyDetected ? "Yes" : "No"}</p>
            <p><strong>Confidence:</strong> {formatConfidence(prediction.confidence)}%</p>
            <p><strong>Severity:</strong> {prediction.severity}</p>
          </div>
          
          {/* Warning for detected anomalies */}
          {prediction.anomalyDetected && (
            <div style={{ 
              marginTop: "1rem", 
              padding: "0.75rem", 
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "4px"
            }}>
              <strong>⚠️ Defect Detected!</strong> Please inspect the screw carefully and consider replacement.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Predict;