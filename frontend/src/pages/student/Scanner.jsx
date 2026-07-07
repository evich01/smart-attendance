import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { attendanceApi } from '../../api/endpoints';

// NOTE: This screen never calls navigator.geolocation and never collects
// location of any kind — the only signal used to validate attendance is the
// scanned QR payload (sessionId + token), per the build spec's exclusions.

const SCANNER_ELEMENT_ID = 'qr-reader';

export default function Scanner() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | scanning | processing | success | error
  const [message, setMessage] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSessionId, setManualSessionId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [componentKey, setComponentKey] = useState(0); // To fully re-mount the scanner
  const scannerRef = useRef(null);

  // Reset function to fully reset the scanner
  const resetScanner = useCallback(() => {
    // Clean up old scanner if it exists
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
    // Reset state
    setStatus('idle');
    setMessage('');
    setManualOpen(false);
    setManualSessionId('');
    setManualToken('');
    // Force a full re-mount of the scanner component
    setComponentKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Wait a tiny bit for DOM to be fully ready
    const timer = setTimeout(() => {
      initScanner();
    }, 100);

    async function initScanner() {
      try {
        const scannerElement = document.getElementById(SCANNER_ELEMENT_ID);
        if (!scannerElement) {
          setStatus('error');
          setMessage('Scanner not ready. Please try again.');
          return;
        }

        // Create new scanner
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;
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
        try {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current.clear().catch(() => {});
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
    };
  }, [componentKey]); // Re-run effect when componentKey changes (to re-mount)

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
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {
          console.error('Error stopping scanner after success:', e);
        }
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

  return (
    <Layout key={componentKey}>
      <h1 className="text-2xl font-bold mb-6">Scan QR Code</h1>

      <div className={`rounded-lg px-4 py-3 text-sm font-medium mb-4 ${
        status === 'idle' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
        status === 'scanning' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
        status === 'processing' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
        status === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      }`} role="status">
        {status === 'idle' ? 'Ready to scan' :
         status === 'scanning' ? 'Scanning… point your camera at the QR code' :
         status === 'processing' ? 'Processing…' :
         status === 'success' ? message : message}
      </div>

      <div className="card p-4 max-w-md mx-auto">
        <div id={SCANNER_ELEMENT_ID} className="w-full rounded-lg overflow-hidden" style={{ minHeight: '300px', backgroundColor: '#000' }} />
        {status === 'success' && (
          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1" onClick={resetScanner}>Scan Another</button>
            <button className="btn-secondary flex-1" onClick={() => navigate('/student')}>Back to Dashboard</button>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1" onClick={resetScanner}>Retry Camera</button>
            <button className="btn-secondary flex-1" onClick={() => navigate('/student')}>Back to Dashboard</button>
          </div>
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
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Submit</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => navigate('/student')}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
