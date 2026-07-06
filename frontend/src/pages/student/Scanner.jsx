import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Layout from '../../components/Layout.jsx';
import { attendanceApi } from '../../api/endpoints';

// NOTE: This screen never calls navigator.geolocation and never collects
// location of any kind — the only signal used to validate attendance is the
// scanned QR payload (sessionId + token), per the build spec's exclusions.

const SCANNER_ELEMENT_ID = 'qr-reader';

export default function Scanner() {
  const [status, setStatus] = useState('idle'); // idle | scanning | processing | success | error
  const [message, setMessage] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSessionId, setManualSessionId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const scannerRef = useRef(null);
  const scannerDivRef = useRef(null);

  useEffect(() => {
    // Wait a tiny bit for DOM to be fully ready
    const timer = setTimeout(() => {
      initScanner();
    }, 100);

    async function initScanner() {
      try {
        if (!document.getElementById(SCANNER_ELEMENT_ID)) {
          setStatus('error');
          setMessage('Scanner not ready. Please refresh the page.');
          return;
        }

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;
        setScannerInitialized(true);
        setStatus('scanning');

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            await handleDecoded(decodedText);
          },
          () => { /* per-frame scan failures are expected and ignored */ }
        );
      } catch (err) {
        console.error('Camera error:', err);
        setStatus('error');
        setMessage('Could not access the camera. You can use manual entry below instead.');
      }
    }

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
    };
  }, []);

  async function handleDecoded(decodedText) {
    if (status === 'processing') return;
    setStatus('processing');
    try {
      const payload = JSON.parse(decodedText);
      await submitScan(payload.sessionId, payload.token);
    } catch {
      setStatus('error');
      setMessage('Unrecognized QR code format.');
    }
  }

  async function submitScan(sessionId, token) {
    try {
      const { data } = await attendanceApi.scan(sessionId, token);
      setStatus('success');
      setMessage(`Checked in — marked ${data.data.status}.`);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Scan failed. Please try again.');
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    setStatus('processing');
    await submitScan(manualSessionId.trim(), manualToken.trim());
  }

  function handleRetry() {
    setStatus('idle');
    setMessage('');
    window.location.reload();
  }

  const bannerClass = {
    idle: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    scanning: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    processing: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    success: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  }[status];

  const bannerText = {
    idle: 'Ready to scan',
    scanning: 'Scanning… point your camera at the QR code',
    processing: 'Processing…',
    success: message,
    error: message
  }[status];

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Scan QR Code</h1>

      <div className={`rounded-lg px-4 py-3 text-sm font-medium mb-4 ${bannerClass}`} role="status">
        {bannerText}
      </div>

      <div className="card p-4 max-w-md mx-auto">
        <div ref={scannerDivRef} id={SCANNER_ELEMENT_ID} className="w-full rounded-lg overflow-hidden" style={{ minHeight: '300px', backgroundColor: '#000' }} />
        {status === 'success' && (
          <button className="btn-primary w-full mt-4" onClick={() => window.location.reload()}>Scan Another</button>
        )}
        {status === 'error' && (
          <button className="btn-secondary w-full mt-4" onClick={handleRetry}>Retry Camera</button>
        )}
      </div>

      <div className="max-w-md mx-auto mt-4">
        <button
          className="text-sm text-primary-600 font-medium"
          onClick={() => setManualOpen((o) => !o)}
        >
          {manualOpen ? '▾ Hide manual entry' : '▸ Can\'t use the camera? Enter code manually'}
        </button>
        {manualOpen && (
          <form onSubmit={handleManualSubmit} className="card p-4 mt-2 space-y-3">
            <div>
              <label className="label">Session ID</label>
              <input required className="input" value={manualSessionId} onChange={(e) => setManualSessionId(e.target.value)} />
            </div>
            <div>
              <label className="label">Token</label>
              <input required className="input" value={manualToken} onChange={(e) => setManualToken(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full">Submit</button>
          </form>
        )}
      </div>
    </Layout>
  );
}
