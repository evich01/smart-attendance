import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import CountdownTimer from '../../components/CountdownTimer.jsx';
import { attendanceApi } from '../../api/endpoints';

export default function LiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const qrPollRef = useRef(null);
  const livePollRef = useRef(null);

  const fetchQr = useCallback(async () => {
    try {
      const { data } = await attendanceApi.getSessionQr(sessionId);
      setQrData(data.data);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to refresh QR code';
      setError(errorMsg);
      // If the error says the session has ended, set ended to true
      if (errorMsg.includes('Session has ended')) {
        setEnded(true);
        clearInterval(livePollRef.current);
        clearInterval(qrPollRef.current);
      }
    }
  }, [sessionId]);

  const fetchLive = useCallback(async () => {
    try {
      const { data } = await attendanceApi.liveAttendance(sessionId);
      setAttendance(data.data);
    } catch {
      // non-fatal, keep last known list
    }
  }, [sessionId]);

  useEffect(() => {
    fetchQr();
    fetchLive();
    // Poll live attendance every 5 seconds, per FR-04
    livePollRef.current = setInterval(fetchLive, 5000);
    // Poll QR every 10 seconds to check for auto-ended sessions
    qrPollRef.current = setInterval(fetchQr, 10000);
    return () => {
      clearInterval(livePollRef.current);
      clearInterval(qrPollRef.current);
    };
  }, [fetchQr, fetchLive]);

  async function handleEnd() {
    if (!window.confirm('End this attendance session?')) return;
    await attendanceApi.endSession(sessionId);
    setEnded(true);
    clearInterval(livePollRef.current);
    clearInterval(qrPollRef.current);
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Live Session</h1>
        {!ended && <button onClick={handleEnd} className="btn-danger">End Session</button>}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {ended ? (
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold mb-2">Session ended.</p>
          <p className="text-gray-500 mb-4">{attendance.length} student(s) checked in.</p>
          <button className="btn-primary" onClick={() => navigate('/lecturer')}>Back to Courses</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6 flex flex-col items-center">
            {qrData ? (
              <>
                <img src={qrData.qrDataUrl} alt="Attendance QR code" className="w-64 h-64 rounded-lg border border-gray-200 dark:border-gray-700" />
                <div className="mt-4">
                  <CountdownTimer
                    expiresAt={qrData.expiresAt}
                    totalSeconds={qrData.qrExpirySeconds}
                    onExpire={fetchQr}
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-500">Loading QR code…</p>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-3">Live Attendance ({attendance.length})</h2>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {attendance.map((a) => (
                <div key={a.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{a.studentName}</p>
                    <p className="text-gray-400 text-xs">{a.studentNumber}</p>
                  </div>
                  <span className={a.status === 'present' ? 'badge-good' : 'badge-warning'}>{a.status}</span>
                </div>
              ))}
              {attendance.length === 0 && <p className="text-gray-500 text-sm py-4">Waiting for check-ins…</p>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
