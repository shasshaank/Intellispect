// src/pages/About.js
import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <h1 className="about-title">About IntelliInspect</h1>
        <p className="about-subtitle">
          We believe industrial inspection should be faster, smarter, and more accurate.
        </p>
      </section>

      <section className="about-content">
        <div className="about-card">
          <h2>Our Mission</h2>
          <p>
            We combine synthetic data generation with cutting-edge Transformer-based AI models to create a reliable, real-time industrial anomaly detection system. Our goal is to improve quality, reduce errors, and streamline production.
          </p>
        </div>

        <div className="about-card">
          <h2>Why Choose Us?</h2>
          <ul>
            <li>✅ Transformer models for high-precision detection</li>
            <li>✅ Synthetic data via Diffusion Models for training enhancement</li>
            <li>✅ Real-time dashboard visualization</li>
            <li>✅ Edge & cloud deployment options</li>
            <li>✅ Role-based access and secure systems</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default About;
