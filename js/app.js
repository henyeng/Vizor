const App = {
  state: {
    sources: [],
    deadlines: [],
    activeSourceId: null,
    dayWidth: 50,
    viewStart: null,
    viewEnd: null,
  },

  async init() {
    const now = new Date();
    this.state.viewStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    this.state.viewEnd = new Date(now.getFullYear(), now.getMonth() + 6, 1);

    await this.refresh();
    this.bindEvents();
    this.scrollToToday();

    document.getElementById('footer-date').textContent =
      `Today: ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  },

  async refresh() {
    this.state.sources = await API.getSources();
    this.state.deadlines = await API.getDeadlines();

    Sources.render(this.state);
    Calendar.render(this.state);
  },

  bindEvents() {
    // Add Source button
    document.getElementById('btn-add-source').addEventListener('click', () => {
      Modals.openSourceModal();
    });

    // Add Deadline button
    document.getElementById('btn-add-deadline').addEventListener('click', () => {
      if (this.state.sources.length === 0) {
        Modals.openSourceModal();
        return;
      }
      Modals.openDeadlineModal(null);
    });

    // Source list clicks
    document.getElementById('sources-list').addEventListener('click', (e) => {
      const item = e.target.closest('.source-item');
      if (!item) return;

      if (e.target.closest('.btn-edit-source')) {
        const id = parseInt(item.dataset.sourceId);
        const source = this.state.sources.find(s => s.id === id);
        if (source) Modals.openSourceModal(source);
        return;
      }

      if (e.target.closest('.btn-delete-source')) {
        const id = parseInt(item.dataset.sourceId);
        const source = this.state.sources.find(s => s.id === id);
        if (source && confirm(`Delete "${source.name}" and all its deadlines?`)) {
          API.deleteSource(id).then(() => this.refresh());
        }
        return;
      }

      // Toggle active source
      const id = parseInt(item.dataset.sourceId);
      this.state.activeSourceId = this.state.activeSourceId === id ? null : id;
      Sources.render(this.state);
      Calendar.render(this.state);
    });

    // Calendar body clicks (deadline bars + empty cells)
    document.getElementById('calendar-body').addEventListener('click', (e) => {
      if (e.target.closest('.bar-resize-left, .bar-resize-right')) return;

      const bar = e.target.closest('.deadline-bar');
      if (bar) {
        const id = parseInt(bar.dataset.deadlineId);
        const deadline = this.state.deadlines.find(d => d.id === id);
        if (deadline) Modals.openDeadlineModal(deadline);
        return;
      }

      const cell = e.target.closest('.cal-cell');
      if (cell) {
        const row = cell.closest('.cal-row');
        if (!row) return;
        const sourceId = parseInt(row.dataset.sourceId);
        const day = cell.dataset.day;
        Modals.openDeadlineModal(null, { source_id: sourceId, start_date: day, end_date: day });
      }
    });

    // Tooltip on deadline hover
    document.getElementById('calendar-body').addEventListener('mouseover', (e) => {
      const bar = e.target.closest('.deadline-bar');
      if (!bar) {
        document.getElementById('tooltip').classList.add('hidden');
        return;
      }
      const tooltip = document.getElementById('tooltip');
      const id = parseInt(bar.dataset.deadlineId);
      const deadline = this.state.deadlines.find(d => d.id === id);
      if (!deadline) return;

      const source = this.state.sources.find(s => s.id === deadline.source_id);
      tooltip.innerHTML = `
        <strong>${escapeHtml(deadline.name)}</strong><br>
        ${source ? escapeHtml(source.name) : ''}<br>
        ${deadline.start_date} → ${deadline.end_date}
        ${deadline.description ? `<br>${escapeHtml(deadline.description)}` : ''}
      `;
      tooltip.classList.remove('hidden');
    });

    document.getElementById('calendar-body').addEventListener('mousemove', (e) => {
      const tooltip = document.getElementById('tooltip');
      if (tooltip.classList.contains('hidden')) return;
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY - 10) + 'px';
    });

    document.getElementById('calendar-body').addEventListener('mouseleave', () => {
      document.getElementById('tooltip').classList.add('hidden');
    });

    // Drag resize
    let resizeState = null;
    document.getElementById('calendar-body').addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.bar-resize-left, .bar-resize-right');
      if (!handle) return;

      e.preventDefault();
      const bar = handle.closest('.deadline-bar');
      const id = parseInt(bar.dataset.deadlineId);
      const deadline = this.state.deadlines.find(d => d.id === id);
      if (!deadline) return;

      const isLeft = handle.classList.contains('bar-resize-left');
      resizeState = {
        deadline: deadline,
        isLeft: isLeft,
        startX: e.clientX,
        startDate: isLeft ? dateFromStr(deadline.start_date) : dateFromStr(deadline.end_date),
        barEl: bar,
      };

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeUp);
    });

    const onResizeMove = (e) => {
      if (!resizeState) return;
      const dx = e.clientX - resizeState.startX;
      const dd = Math.round(dx / this.state.dayWidth);
      if (dd === 0) return;

      const newDate = addDays(resizeState.startDate, dd);
      const dateStr = formatDateStr(newDate);

      if (resizeState.isLeft) {
        const endDate = dateFromStr(resizeState.deadline.end_date);
        if (newDate >= endDate) return;
        resizeState.barEl.style.left = `${daysBetween(this.state.viewStart, newDate) * this.state.dayWidth}px`;
        resizeState.barEl.style.width = `${(daysBetween(newDate, endDate) + 1) * this.state.dayWidth}px`;
        resizeState.barEl.dataset.tempStart = dateStr;
      } else {
        const startDate = dateFromStr(resizeState.deadline.start_date);
        if (newDate <= startDate) return;
        resizeState.barEl.style.width = `${(daysBetween(startDate, newDate) + 1) * this.state.dayWidth}px`;
        resizeState.barEl.dataset.tempEnd = dateStr;
      }
    };

    const onResizeUp = async (e) => {
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeUp);
      if (!resizeState) return;

      const data = {
        name: resizeState.deadline.name,
        start_date: resizeState.barEl.dataset.tempStart || resizeState.deadline.start_date,
        end_date: resizeState.barEl.dataset.tempEnd || resizeState.deadline.end_date,
        description: resizeState.deadline.description || '',
      };

      delete resizeState.barEl.dataset.tempStart;
      delete resizeState.barEl.dataset.tempEnd;

      await API.updateDeadline(resizeState.deadline.id, data);
      resizeState = null;
      await this.refresh();
    };

    // Zoom
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      const levels = [30, 50, 80, 120];
      let idx = levels.indexOf(this.state.dayWidth);
      if (idx < levels.length - 1) idx++;
      this.state.dayWidth = levels[idx];
      this.updateZoomLabel();
      Calendar.render(this.state);
      this.scrollToToday();
    });

    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      const levels = [30, 50, 80, 120];
      let idx = levels.indexOf(this.state.dayWidth);
      if (idx > 0) idx--;
      this.state.dayWidth = levels[idx];
      this.updateZoomLabel();
      Calendar.render(this.state);
      this.scrollToToday();
    });

    // Today button
    document.getElementById('btn-today').addEventListener('click', () => {
      this.scrollToToday();
    });
  },

  scrollToToday() {
    const today = new Date();
    if (today < this.state.viewStart || today >= this.state.viewEnd) return;
    const offset = daysBetween(this.state.viewStart, today);
    const scrollLeft = offset * this.state.dayWidth - window.innerWidth / 3;
    document.getElementById('calendar-scroll').scrollLeft = Math.max(0, scrollLeft);
  },

  updateZoomLabel() {
    const labels = { 30: 'Compact', 50: 'Day', 80: 'Wide', 120: 'Detail' };
    document.getElementById('zoom-label').textContent = labels[this.state.dayWidth] || `${this.state.dayWidth}px`;
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
