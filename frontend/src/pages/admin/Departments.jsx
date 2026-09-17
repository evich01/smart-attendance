import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { departmentApi, userApi } from '../../api/endpoints';

const EMPTY = { name: '', description: '', managerId: '' };

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  function load() {
    departmentApi.list()
      .then(({ data }) => setDepartments(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load departments'));
  }

  useEffect(() => {
    load();
    userApi.list({ role: 'manager', limit: 100 })
      .then(({ data }) => setManagers(data.data))
      .catch(() => {});
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(dept) {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '', managerId: dept.managerId || '' });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, managerId: form.managerId || null };
      if (editing) await departmentApi.update(editing.id, payload);
      else await departmentApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this department? Staff will be unassigned.')) return;
    await departmentApi.remove(id);
    load();
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Departments</h1>
        <button className="btn-primary" onClick={openCreate}>+ New Department</button>
      </div>


      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="card p-5">
            <h2 className="font-bold text-lg">{d.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{d.description || 'No description'}</p>
            <p className="text-sm mt-3"><span className="text-gray-400">Manager:</span> {d.managerName || 'Unassigned'}</p>
            <p className="text-sm"><span className="text-gray-400">Staff:</span> {d.staffCount}</p>
            <div className="flex gap-3 mt-4">
              <button className="text-primary-600 hover:underline text-sm" onClick={() => openEdit(d)}>Edit</button>
              <button className="text-red-600 hover:underline text-sm" onClick={() => handleDelete(d.id)}>Delete</button>
            </div>
          </div>
        ))}
        {departments.length === 0 && <p className="text-gray-500">No departments yet.</p>}
      </div>

      {modalOpen && ( 
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Department' : 'New Department'}</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Manager</label>
                <select className="input" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                  <option value="">None</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
