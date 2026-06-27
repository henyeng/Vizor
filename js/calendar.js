const Calendar = {
  render(state) {
    const { sources, deadlines, dayWidth, activeSourceId, viewStart, viewEnd } = state;

    if (sources.length === 0) {
      document.getElementById('calendar-head').innerHTML = '';
      document.getElementById('calendar-body').innerHTML = '';
      return;
    }

    const days = getDaysBetween(viewStart, viewEnd);

    renderHead(days, dayWidth);
    renderBody(sources, deadlines, days, dayWidth, activeSourceId, viewStart);
    renderTodayMarker(days, dayWidth, viewStart);
  },
};

function getDaysBetween(start, end) {
  const days = [];
  const d = new Date(start);
  while (d < end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateFromStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isToday(date) {
  const t = new Date();
  return date.getFullYear() === t.getFullYear() &&
         date.getMonth() === t.getMonth() &&
         date.getDate() === t.getDate();
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function getMonthName(m) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m];
}

function renderHead(days, dayWidth) {
  const head = document.getElementById('calendar-head');
  const totalWidth = days.length * dayWidth;

  let monthHtml = '';
  let dayHtml = '';
  let i = 0;
  while (i < days.length) {
    const start = i;
    const month = days[i].getMonth();
    const year = days[i].getFullYear();
    while (i < days.length && days[i].getMonth() === month && days[i].getFullYear() === year) {
      i++;
    }
    const span = (i - start) * dayWidth;
    const todayClass = monthHasToday(days, start, i) ? ' today' : '';
    monthHtml += `<div class="cal-head-cell cal-head-month${todayClass}" style="width:${span}px;font-size:11px;font-weight:600;color:var(--text)">${getMonthName(month)} ${year}</div>`;
  }

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const cls = `cal-head-cell${isToday(d) ? ' today' : ''}${isWeekend(d) ? ' weekend' : ''}`;
    const label = d.getDate() === 1 ? `${getMonthName(d.getMonth())} ${d.getDate()}` : d.getDate();
    dayHtml += `<div class="${cls}" style="width:${dayWidth}px">${label}</div>`;
  }

  head.innerHTML = `
    <div class="cal-head-row" style="width:${totalWidth}px">${monthHtml}</div>
    <div class="cal-head-row" style="width:${totalWidth}px">${dayHtml}</div>
  `;
}

function monthHasToday(days, start, end) {
  const t = new Date();
  for (let i = start; i < end; i++) {
    if (isToday(days[i])) return true;
  }
  return false;
}

function deadlinesOverlap(a, b) {
  return a.start_date <= b.end_date && a.end_date >= b.start_date;
}

function assignSubRows(deadlines) {
  if (deadlines.length === 0) return [];

  const sorted = [...deadlines].sort(
    (a, b) => dateFromStr(a.start_date) - dateFromStr(b.start_date)
  );

  const subRows = [];
  for (const dl of sorted) {
    let placed = false;
    for (const row of subRows) {
      let overlaps = false;
      for (const placedDl of row) {
        if (deadlinesOverlap(dl, placedDl)) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        row.push(dl);
        placed = true;
        break;
      }
    }
    if (!placed) {
      subRows.push([dl]);
    }
  }
  return subRows;
}

function renderBody(sources, deadlines, days, dayWidth, activeSourceId, viewStart) {
  const body = document.getElementById('calendar-body');
  const totalWidth = days.length * dayWidth;
  const ROW_HEIGHT = 60;

  const deadlinesBySource = {};
  for (const d of deadlines) {
    if (!deadlinesBySource[d.source_id]) deadlinesBySource[d.source_id] = [];
    deadlinesBySource[d.source_id].push(d);
  }

  let html = '';
  for (const source of sources) {
    const sourceDeadlines = deadlinesBySource[source.id] || [];
    const isDimmed = activeSourceId !== null && source.id !== activeSourceId;

    const subRows = assignSubRows(sourceDeadlines);

    for (let si = 0; si < subRows.length; si++) {
      const isLastSubRow = si === subRows.length - 1;

      html += `<div class="cal-row" data-source-id="${source.id}" style="position:relative;height:${ROW_HEIGHT}px;width:${totalWidth}px"${isLastSubRow ? '' : ' data-sub-row="true"'}>`;

      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        const cls = `cal-cell${isToday(d) ? ' today' : ''}${isWeekend(d) ? ' weekend' : ''}`;
        html += `<div class="${cls}" style="width:${dayWidth}px;height:${ROW_HEIGHT}px" data-day="${formatDateStr(d)}"></div>`;
      }

      for (const dl of subRows[si]) {
        const dlStart = dateFromStr(dl.start_date);
        const dlEnd = dateFromStr(dl.end_date);
        const leftDays = daysBetween(viewStart, dlStart);
        const spanDays = daysBetween(dlStart, dlEnd) + 1;

        let left = Math.max(0, leftDays) * dayWidth;
        let width = spanDays * dayWidth;

        if (leftDays < 0) {
          width = width + leftDays * dayWidth;
          if (width <= 0) continue;
          left = 0;
        }

        if (left > totalWidth) continue;

        const dimClass = isDimmed ? ' dimmed' : '';
        html += `
          <div class="deadline-bar${dimClass}" style="left:${left}px;width:${width}px;background:${dl.source_color || source.color}"
               data-deadline-id="${dl.id}" data-source-id="${source.id}">
            <span class="bar-resize-left"></span>
            <span class="bar-label">${escapeHtml(dl.name)}</span>
            <span class="bar-resize-right"></span>
          </div>
        `;
      }

      html += '</div>';
    }
  }
  body.innerHTML = html;
}

function renderTodayMarker(days, dayWidth, viewStart) {
  const body = document.getElementById('calendar-body');
  const existing = document.querySelector('.today-marker');
  if (existing) existing.remove();

  const td = new Date();
  if (td < viewStart || td >= addDays(viewStart, days.length)) return;

  const offset = daysBetween(viewStart, td);
  const left = offset * dayWidth;

  const marker = document.createElement('div');
  marker.className = 'today-marker';
  marker.style.left = `${left}px`;
  body.appendChild(marker);
}
