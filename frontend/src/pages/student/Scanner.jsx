import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Scan, CheckCircle2, XCircle, Clock } from 'lucide-react';
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
        setMessage('Could not access the camera.');
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
    if (status === 'processing' || status === 'success') return;
    setStatus('processing');
    try {
      const payload = JSON.parse(decodedText);
      await submitScan(payload.sessionId, payload.token);
    } catch (e) {
      console.error('QR parse error:', e);
      setStatus('error');
      setMessage('Invalid QR Code');
    }
  }

  async function submitScan(sessionId, token) {
    try {
      const { data } = await attendanceApi.scan(sessionId, token);
      setStatus('success');
      setMessage(`Verified! Attendance marked as ${data.data.status}.`);
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {
          console.error('Error stopping scanner after success:', e);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setStatus('error');
      setMessage(err.response?.data?.error || 'Scan failed. Please try again.');
    }
  }

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <Scan size={20} />;
      case 'scanning':
        return <Scan size={20} className="animate-pulse" />;
      case 'success':
        return <CheckCircle2 size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'processing':
        return <Clock size={20} className="animate-spin" />;
      default:
        return null;
    }
  };

  // Determine status colors
  const getStatusClasses = () => {
    switch (status) {
      case 'idle':
        return 'bg-cream-100 text-gray-700 dark:bg-gray-700 dark:text-cream-200';
      case 'scanning':
        return 'bg-primary-50 text-primary-800 dark:bg-primary-900/20 dark:text-primary-200';
      case 'processing':
        return 'bg-accent-50 text-accent-800 dark:bg-accent-900/20 dark:text-accent-200';
      case 'success':
        return 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-200 dark:border-green-800/30';
      case 'error':
        return 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-200 dark:border-red-800/30';
      default:
        return 'bg-cream-100 text-gray-700 dark:bg-gray-700 dark:text-cream-200';
    }
  };

  return (
    <Layout key={componentKey}>
      <h1 className="text-2xl font-bold mb-6">Scan QR Code</h1>

      <div className={`rounded-2xl px-5 py-3 text-sm font-semibold mb-4 flex items-center gap-2 border ${getStatusClasses()}`} role="status">
        {getStatusIcon()}
        {status === 'idle' ? 'Ready to scan' :
         status === 'scanning' ? 'Scanning… point your camera at the QR code' :
         status === 'processing' ? 'Processing…' :
         message}
      </div>

      <div className="card p-4 max-w-md mx-auto">
        <div id={SCANNER_ELEMENT_ID} className="w-full rounded-2xl overflow-hidden" style={{ minHeight: '300px', backgroundColor: '#000' }} />
        {status === 'success' && (
          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={resetScanner}>
              <RefreshCw size={18} />
              Scan Another
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => navigate('/student')}>
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={resetScanner}>
              <RefreshCw size={18} />
              Retry
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => navigate('/student')}>
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
