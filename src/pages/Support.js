// src/pages/Support.js
import React from 'react';
import '../styles/Support.css';

const Support = () => {
  return (
    <div className="support-page">
      <section className="support-header">
        <h1>Support</h1>
        <p>Need help? We're here to assist you with anything related to IntelliInspect.</p>
      </section>

      <section className="support-options">
        <div className="support-card">
          <h2>Email Us</h2>
          <p>Send your queries or issues to: <br /><strong>support@intelliinspect.ai</strong></p>
        </div>

        <div className="support-card">
          <h2>Help Center</h2>
          <p>Browse common FAQs and user guides in our documentation portal.</p>
          <button className="support-btn">Go to Help Center</button>
        </div>
      </section>
    </div>
  );
};

export default Support;
