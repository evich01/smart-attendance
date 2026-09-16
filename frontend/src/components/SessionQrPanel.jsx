import React, { useCallback, useEffect, useRef, useState } from 'react';
import CountdownTimer from './CountdownTimer.jsx';
import { attendanceApi } from '../api/endpoints';

export default function SessionQrPanel({ sessionType, title, description }) {
  const [session, setSession] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const qrPollRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await attendanceApi.todaySessions();
      const active = data.data.find((s) => s.type === sessionType && s.status === 'active');
      setSession(active || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [sessionType]);

  const fetchQr = useCallback(async (sessionId) => {
    try {
      const { data } = await attendanceApi.getSessionQr(sessionId);
      setQrData(data.data);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to refresh QR code';
      setError(msg);
      if (msg.includes('no longer active')) {
        setSession(null);
        setQrData(null);
        clearInterval(qrPollRef.current);
      }
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!session?.sessionId) {
      setQrData(null);
      clearInterval(qrPollRef.current);
      return undefined;
    }
    fetchQr(session.sessionId);
    qrPollRef.current = setInterval(() => fetchQr(session.sessionId), 5000);
    return () => clearInterval(qrPollRef.current);
  }, [session?.sessionId, fetchQr]);

  async function handleStart() {
    setStarting(true);
    setError('');
    try {
      const api = sessionType === 'CHECK_IN' ? attendanceApi.startCheckIn : attendanceApi.startCheckOut;
      const { data } = await api();
      setSession({ sessionId: data.data.sessionId, type: sessionType, status: 'active' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  }

  async function handleClose() {
    if (!session?.sessionId) return;
    if (!window.confirm('Close this session? Staff will no longer be able to scan.')) return;
    try {
      await attendanceApi.closeSession(session.sessionId);
      setSession(null);
      setQrData(null);
      clearInterval(qrPollRef.current);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close session');
    }
  }

  if (loading) return <p className="text-gray-500">Loading session…</p>;

  return (
    <div>
      <p className="text-gray-500 mb-6">{description}</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!session ? (
        <div className="card p-8 text-center max-w-lg mx-auto">
          <p className="text-lg font-semibold mb-2">No active {title} session</p>
          <p className="text-gray-500 mb-6">Start a session to display the QR code for staff to scan.</p>
          <button className="btn-primary" onClick={handleStart} disabled={starting}>
            {starting ? 'Starting…' : `Start ${title}`}
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6 flex flex-col items-center">
            {qrData ? (
              <>
                <img src={qrData.qrDataUrl} alt={`${title} QR code`} className="w-64 h-64 rounded-lg border border-gray-200 dark:border-gray-700" />
                <div className="mt-4">
                  <CountdownTimer
                    expiresAt={qrData.expiresAt}
                    totalSeconds={qrData.qrExpirySeconds}
                    onExpire={() => fetchQr(session.sessionId)}
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-500">Loading QR code…</p>
            )}
            <button className="btn-danger mt-6" onClick={handleClose}>Close Session</button>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-3">Session Info</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Type</dt><dd className="font-medium">{sessionType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><span className="badge-good">Active</span></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Started</dt><dd>{session.startTime ? new Date(session.startTime).toLocaleTimeString() : '—'}</dd></div>
            </dl>
            <p className="text-xs text-gray-400 mt-6">The QR code refreshes automatically. Staff must scan the current code — expired codes are rejected.</p>
          </div>
        </div>
      )}
    </div>
  );
}
