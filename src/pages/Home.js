// src/pages/Home.js
import React from 'react';
import '../styles/Home.css';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">AI-powered Anomaly Detection</h1>
          <p className="hero-subtitle">
            Detect industrial defects in real-time using Swin Transformers and synthetic data.
          </p>
          <Link to="/login" className="get-started-btn">Get Started</Link>
        </div>
        <div className="hero-image">
          {/* Optional: add background illustration or logo here */}
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Why Choose IntelliInspect?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Transformer-Based Detection</h3>
            <p>High-accuracy AI models trained on real + synthetic data.</p>
          </div>
          <div className="feature-card">
            <h3>Real-Time Insights</h3>
            <p>Live predictions and defect classification with visual overlays.</p>
          </div>
          <div className="feature-card">
            <h3>Edge & Cloud Ready</h3>
            <p>Deploy models anywhere — from smart devices to scalable cloud setups.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
