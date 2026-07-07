import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { userApi } from '../../api/endpoints';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'student' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    userApi.list({ search, role: roleFilter, page, limit: 8 })
      .then(({ data }) => { setUsers(data.data); setPagination(data.pagination); })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load users'));
  }, [search, roleFilter, page]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await userApi.update(editing.id, { name: form.name, email: form.email });
      } else {
        await userApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    await userApi.remove(id);
    load();
  }

  async function handleToggle(id) {
    await userApi.toggleStatus(id);
    load();
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button className="btn-primary" onClick={openCreate}>+ New User</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          className="input sm:max-w-xs" placeholder="Search name or email…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="input sm:max-w-[160px]" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="lecturer">Lecturer</option>
          <option value="student">Student</option>
        </select>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th>
              <th className="p-3">Status</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3">
                  <button onClick={() => handleToggle(u.id)} className={u.isActive ? 'badge-good' : 'badge-risk'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 space-x-2">
                  <button className="text-primary-600 hover:underline" onClick={() => openEdit(u)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn-primary px-3 py-1' : 'btn-secondary px-3 py-1'}>
              {p}
            </button>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit User' : 'New User'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {!editing && (
                <>
                  <div>
                    <label className="label">Password</label>
                    <input required type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </>
              )}
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
