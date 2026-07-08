import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { settingApi } from '../../api/endpoints';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    settingApi.get()
      .then(({ data }) => {
        setSettings(data.data);
        const v = {};
        data.data.forEach((s) => { v[s.key] = s.value; });
        setValues(v);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load settings'));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setNotice(''); setError('');
    try {
      await settingApi.update(values);
      setNotice('Settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {notice && <p className="text-green-600 mb-4">{notice}</p>}

      <form onSubmit={handleSave} className="card p-6 max-w-xl space-y-4">
        {settings.map((s) => (
          <div key={s.key}>
            <label className="label">{s.label}</label>
            <input
              className="input"
              type={s.key.toLowerCase().includes('seconds') || s.key.toLowerCase().includes('minutes') || s.key.toLowerCase().includes('hours') ? 'number' : 'text'}
              value={values[s.key] ?? ''}
              onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
            />
          </div>
        ))}
        <p className="text-xs text-gray-400">
          Note: this system uses the 30-second rotating QR token as its sole anti-proxy mechanism — there is no GPS/location verification anywhere in the app.
        </p>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </Layout>
  );
}
