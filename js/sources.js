const CALENDAR_COLORS = [
  '#4A90D9', '#7B61FF', '#E86F6F', '#F5A623', '#7ED321',
  '#50E3C2', '#4A4A4A', '#F8E71C', '#D0021B', '#9013FE',
  '#1FA8A0', '#E06B9D', '#5B9BD5', '#B8860B', '#2E8B57',
];

const Sources = {
  render(state) {
    const { sources, activeSourceId } = state;
    const container = document.getElementById('sources-list');

    if (sources.length === 0) {
      container.innerHTML = '<div class="blank-state" style="padding:20px;text-align:center"><p style="font-size:12px;color:var(--text-dim)">No sources yet.<br>Click "+ Source" to add one.</p></div>';
      return;
    }

    const grouped = {};
    for (const s of sources) {
      if (!grouped[s.project]) grouped[s.project] = [];
      grouped[s.project].push(s);
    }

    let html = '';
    for (const [project, items] of Object.entries(grouped)) {
      html += `<div class="source-group">`;
      html += `<div class="source-group-header">${escapeHtml(project)}</div>`;
      for (const s of items) {
        const active = s.id === activeSourceId ? ' active' : '';
        html += `
          <div class="source-item${active}" data-source-id="${s.id}">
            <span class="source-dot" style="background:${s.color}"></span>
            <span class="source-name">${escapeHtml(s.name)}</span>
            <span class="source-actions">
              <button class="btn-edit-source" title="Edit">✎</button>
              <button class="btn-delete-source" title="Delete">✕</button>
            </span>
          </div>
        `;
      }
      html += `</div>`;
    }
    container.innerHTML = html;
  },
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
