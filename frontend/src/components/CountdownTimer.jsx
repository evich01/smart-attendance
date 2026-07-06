import React, { useEffect, useState } from 'react';

export default function CountdownTimer({ expiresAt, totalSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const target = new Date(expiresAt).getTime();

    function tick() {
      const secs = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0 && onExpire) onExpire();
    }

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const pct = totalSeconds ? Math.max(0, Math.min(100, (remaining / totalSeconds) * 100)) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
          <circle
            cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 100.5} 100.5`}
            className={remaining <= 5 ? 'text-red-500' : 'text-primary-600'}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{remaining}s</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">Code refreshes automatically</p>
    </div>
  );
}
