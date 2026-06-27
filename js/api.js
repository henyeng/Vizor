const API = {
  async getSources() {
    const res = await fetch('/api/sources');
    return res.json();
  },
  async createSource(data) {
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateSource(id, data) {
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async deleteSource(id) {
    await fetch(`/api/sources/${id}`, { method: 'DELETE' });
  },
  async getDeadlines(sourceId) {
    const params = sourceId ? `?source_id=${sourceId}` : '';
    const res = await fetch(`/api/deadlines${params}`);
    return res.json();
  },
  async createDeadline(data) {
    const res = await fetch('/api/deadlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateDeadline(id, data) {
    await fetch(`/api/deadlines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async deleteDeadline(id) {
    await fetch(`/api/deadlines/${id}`, { method: 'DELETE' });
  },
  async getProjects() {
    const res = await fetch('/api/projects');
    return res.json();
  },
};
