import React from 'react';
import Layout from '../../components/Layout.jsx';
import SessionQrPanel from '../../components/SessionQrPanel.jsx';

export default function CheckOutQr() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Check-Out QR Session</h1>
      <SessionQrPanel
        sessionType="CHECK_OUT"
        title="Check-Out"
        description="Start the end-of-day check-out session so staff can scan before leaving."
      />
    </Layout>
  );
}
