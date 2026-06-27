const Modals = {
  openSourceModal(source) {
    const isEdit = !!source;
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Source' : 'New Source';

    const colorOptions = CALENDAR_COLORS.map(c =>
      `<div class="color-option${source && source.color === c ? ' selected' : ''}" style="background:${c}" data-color="${c}"></div>`
    ).join('');

    const projects = App.state.sources.map(s => s.project).filter((p, i, a) => a.indexOf(p) === i);

    const body = document.getElementById('modal-body');
    body.innerHTML = `
      <form id="source-form">
        <div class="form-group">
          <label for="source-name">Name</label>
          <input type="text" id="source-name" value="${isEdit ? escapeHtml(source.name) : ''}" required>
        </div>
        <div class="form-group">
          <label for="source-project">Project</label>
          <input type="text" id="source-project" value="${isEdit ? escapeHtml(source.project) : ''}" list="project-list" required>
          <datalist id="project-list">
            ${projects.map(p => `<option value="${escapeHtml(p)}">`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label>Color</label>
          <div class="color-options" id="color-options">${colorOptions}</div>
          <input type="hidden" id="source-color" value="${isEdit ? source.color : CALENDAR_COLORS[0]}">
        </div>
        ${isEdit ? `<button type="button" class="btn" id="btn-delete-source" style="color:var(--danger)">Delete this source</button>` : ''}
        <div class="form-actions">
          <button type="button" class="btn" data-action="cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save' : 'Create'}</button>
        </div>
      </form>
    `;

    document.getElementById('color-options').addEventListener('click', (e) => {
      const opt = e.target.closest('.color-option');
      if (!opt) return;
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      document.getElementById('source-color').value = opt.dataset.color;
    });

    document.getElementById('source-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('source-name').value.trim(),
        project: document.getElementById('source-project').value.trim(),
        color: document.getElementById('source-color').value,
      };
      if (!data.name || !data.project) return;

      if (isEdit) {
        await API.updateSource(source.id, data);
      } else {
        await API.createSource(data);
      }
      Modals.close();
      await App.refresh();
    });

    if (isEdit) {
      document.getElementById('btn-delete-source').addEventListener('click', async () => {
        if (!confirm('Delete this source and all its deadlines?')) return;
        await API.deleteSource(source.id);
        Modals.close();
        await App.refresh();
      });
    }

    document.getElementById('modal-overlay').classList.remove('hidden');

    // Focus first input
    setTimeout(() => document.getElementById('source-name').focus(), 100);
  },

  openDeadlineModal(deadline, prefill) {
    const isEdit = !!deadline;
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Deadline' : 'New Deadline';

    const sources = App.state.sources;
    const options = sources.map(s =>
      `<option value="${s.id}"${(prefill && prefill.source_id === s.id) || (isEdit && deadline.source_id === s.id) ? ' selected' : ''}>${escapeHtml(s.project)} / ${escapeHtml(s.name)}</option>`
    ).join('');

    const todayStr = formatDateStr(new Date());

    const body = document.getElementById('modal-body');
    body.innerHTML = `
      <form id="deadline-form">
        <div class="form-group">
          <label for="deadline-name">Name</label>
          <input type="text" id="deadline-name" value="${isEdit ? escapeHtml(deadline.name) : ''}" required>
        </div>
        <div class="form-group">
          <label for="deadline-source">Source</label>
          <select id="deadline-source" required>
            <option value="">Select source...</option>
            ${options}
          </select>
        </div>
        <div class="form-group">
          <label for="deadline-start">Start Date</label>
          <input type="date" id="deadline-start" value="${isEdit ? deadline.start_date : (prefill ? prefill.start_date : todayStr)}" required>
        </div>
        <div class="form-group">
          <label for="deadline-end">End Date</label>
          <input type="date" id="deadline-end" value="${isEdit ? deadline.end_date : (prefill ? prefill.end_date : todayStr)}" required>
        </div>
        <div class="form-group">
          <label for="deadline-description">Description</label>
          <textarea id="deadline-description">${isEdit ? escapeHtml(deadline.description || '') : ''}</textarea>
        </div>
        ${isEdit ? `<button type="button" class="btn" id="btn-delete-deadline" style="color:var(--danger)">Delete this deadline</button>` : ''}
        <div class="form-actions">
          <button type="button" class="btn" data-action="cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save' : 'Create'}</button>
        </div>
      </form>
    `;

    document.getElementById('deadline-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        source_id: parseInt(document.getElementById('deadline-source').value),
        name: document.getElementById('deadline-name').value.trim(),
        start_date: document.getElementById('deadline-start').value,
        end_date: document.getElementById('deadline-end').value,
        description: document.getElementById('deadline-description').value.trim(),
      };
      if (!data.source_id || !data.name || !data.start_date || !data.end_date) return;

      if (isEdit) {
        await API.updateDeadline(deadline.id, data);
      } else {
        await API.createDeadline(data);
      }
      Modals.close();
      await App.refresh();
    });

    if (isEdit) {
      document.getElementById('btn-delete-deadline').addEventListener('click', async () => {
        if (!confirm('Delete this deadline?')) return;
        await API.deleteDeadline(deadline.id);
        Modals.close();
        await App.refresh();
      });
    }

    document.getElementById('modal-overlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('deadline-name').focus(), 100);
  },

  close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
  },
};

// Close modal on overlay click or cancel
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) Modals.close();
});
document.getElementById('btn-modal-close').addEventListener('click', Modals.close);
document.addEventListener('click', (e) => {
  if (e.target.dataset.action === 'cancel') Modals.close();
});
// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') Modals.close();
});
