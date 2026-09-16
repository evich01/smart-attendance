import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Scan, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import { attendanceApi } from '../../api/endpoints';

const SCANNER_ELEMENT_ID = 'qr-reader';

export default function StaffScanner() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [componentKey, setComponentKey] = useState(0);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const resetScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
    processingRef.current = false;
    setStatus('idle');
    setMessage('');
    setComponentKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { initScanner(); }, 100);

    async function initScanner() {
      try {
        const scannerElement = document.getElementById(SCANNER_ELEMENT_ID);
        if (!scannerElement) {
          setStatus('error');
          setMessage('Scanner not ready. Please try again.');
          return;
        }

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;
        setStatus('scanning');

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => { await handleDecoded(decodedText); },
          () => {}
        );
      } catch (err) {
        console.error('Camera error:', err);
        setStatus('error');
        setMessage('Camera permission is required to scan QR codes. Please allow camera access and try again.');
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
  }, [componentKey]);

  async function handleDecoded(decodedText) {
    if (processingRef.current || status === 'success') return;
    processingRef.current = true;
    setStatus('processing');
    try {
      const payload = JSON.parse(decodedText);
      const { sessionId, sessionToken, type } = payload;
      if (!sessionId || !sessionToken || !type) throw new Error('Invalid payload');

      let response;
      if (type === 'CHECK_IN') {
        response = await attendanceApi.checkIn(sessionId, sessionToken);
      } else if (type === 'CHECK_OUT') {
        response = await attendanceApi.checkOut(sessionId, sessionToken);
      } else {
        throw new Error('Unknown QR type');
      }

      setStatus('success');
      setMessage(response.data.data.message || 'Attendance recorded successfully.');
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => {}); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setStatus('error');
      setMessage(err.response?.data?.error || err.message || 'Scan failed. Please try again.');
      processingRef.current = false;
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'idle': return <Scan size={20} />;
      case 'scanning': return <Scan size={20} className="animate-pulse" />;
      case 'success': return <CheckCircle2 size={20} />;
      case 'error': return <XCircle size={20} />;
      case 'processing': return <Clock size={20} className="animate-spin" />;
      default: return null;
    }
  };

  const getStatusClasses = () => {
    switch (status) {
      case 'scanning': return 'bg-primary-50 text-primary-800 dark:bg-primary-900/20 dark:text-primary-200';
      case 'processing': return 'bg-accent-50 text-accent-800 dark:bg-accent-900/20 dark:text-accent-200';
      case 'success': return 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-200';
      case 'error': return 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-200';
      default: return 'bg-cream-100 text-gray-700 dark:bg-gray-700 dark:text-cream-200';
    }
  };

  return (
    <Layout key={componentKey}>
      <h1 className="text-2xl font-bold mb-6">Scan QR Code</h1>
      <p className="text-sm text-gray-500 mb-4">Scan the Check-In QR when you arrive, and the Check-Out QR before you leave. The system detects the session type automatically.</p>

      <div className={`rounded-2xl px-5 py-3 text-sm font-semibold mb-4 flex items-center gap-2 border ${getStatusClasses()}`} role="status">
        {getStatusIcon()}
        {status === 'idle' ? 'Ready to scan' :
         status === 'scanning' ? 'Scanning… point your camera at the QR code' :
         status === 'processing' ? 'Processing…' :
         message}
      </div>

      <div className="card p-4 max-w-md mx-auto">
        <div id={SCANNER_ELEMENT_ID} className="w-full rounded-2xl overflow-hidden" style={{ minHeight: '300px', backgroundColor: '#000' }} />
        {(status === 'success' || status === 'error') && (
          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={resetScanner}>
              <RefreshCw size={18} /> {status === 'success' ? 'Scan Another' : 'Retry'}
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => navigate('/staff')}>
              <ArrowLeft size={18} /> Back
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
