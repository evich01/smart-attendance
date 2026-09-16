import React from 'react';
import Layout from '../../components/Layout.jsx';
import SessionQrPanel from '../../components/SessionQrPanel.jsx';

export default function CheckInQr() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Check-In QR Session</h1>
      <SessionQrPanel
        sessionType="CHECK_IN"
        title="Check-In"
        description="Start the morning check-in session and display the QR code for staff to scan when they arrive."
      />
    </Layout>
  );
}
