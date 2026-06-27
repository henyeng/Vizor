# Deadline Visualization App — Implementation Plan

## Tech Stack
- **Frontend**: Plain HTML/CSS/JS (vanilla, no frameworks)
- **Backend**: Python + Flask (lightweight REST API)
- **Database**: SQLite

---

## Data Model

### `sources` table
| Column    | Type          | Notes                    |
|-----------|---------------|--------------------------|
| id        | INTEGER PK    | auto-increment           |
| name      | TEXT NOT NULL | e.g. "CS 101", "Work"    |
| project   | TEXT NOT NULL | project grouping key     |
| color     | TEXT NOT NULL | hex color (e.g. #4A90D9) |

### `deadlines` table
| Column      | Type          | Notes                       |
|-------------|---------------|-----------------------------|
| id          | INTEGER PK    | auto-increment              |
| source_id   | INTEGER FK    | references sources(id)      |
| name        | TEXT NOT NULL | e.g. "Midterm paper"        |
| start_date  | TEXT NOT NULL | ISO date (YYYY-MM-DD)       |
| end_date    | TEXT NOT NULL | ISO date (YYYY-MM-DD)       |
| description | TEXT          | optional                    |

---

## Backend API (Flask)

| Method   | Endpoint                  | Description                  |
|----------|---------------------------|------------------------------|
| GET      | `/api/sources`            | List all sources             |
| POST     | `/api/sources`            | Create a source              |
| PUT      | `/api/sources/<id>`       | Update a source              |
| DELETE   | `/api/sources/<id>`       | Delete a source (cascades)   |
| GET      | `/api/deadlines`          | List deadlines (?source_id=) |
| POST     | `/api/deadlines`          | Create a deadline            |
| PUT      | `/api/deadlines/<id>`     | Update a deadline            |
| DELETE   | `/api/deadlines/<id>`     | Delete a deadline            |
| GET      | `/api/projects`           | List distinct project names  |

---

## Frontend Layout (Minimalistic)

```
┌───────────────────────────────────────────────────────────┐
│  Header: [logo] Deadline Viz  [+ Source] [+ Deadline]    │
├────────────┬──────────────────────────────────────────────┤
│  Sources   │  ← ← ← horizontally scrollable → → →        │
│  Panel     │  Jun 1 │ Jun 2 │ Jun 3 │ Jun 4 │ Jun 5 │... │
│            │  ┌──────────┐                               │
│  ● CS 101  │  │ Midterm  │    ┌──────────────────┐       │
│  ● Work    │  └──────────┘    │  Sprint 3        │       │
│  ● Side    │                  └──────────────────┘       │
│  Project   │  ┌──────────────┐                            │
│  ● Freelanc │  │ Tax Filing  │                            │
│            │  └──────────────┘                            │
├────────────┴──────────────────────────────────────────────┤
│  Today: Jun 11, 2026              Zoom: [─] [+] [Today]   │
└───────────────────────────────────────────────────────────┘
```

- **Header**: app title + action buttons
- **Sources panel (left)**: sources grouped by project with colored dots
- **Timeline (main area)**: Gantt-like horizontal scroll view
  - Days as columns, sources as rows
  - Deadlines as colored bars spanning start→end dates
  - Vertical "Today" marker line
  - Click empty space → create deadline for that source/date
- **Controls bar (bottom)**: date info, zoom slider, scroll to today

---

## File Structure

```
C:\Users\Admin\Vizor\
├── index.html                   # Main HTML entry point
├── css/
│   └── style.css                # Minimalistic styling
├── js/
│   ├── app.js                   # App init, event binding, coordination
│   ├── api.js                   # Fetch wrapper for backend calls
│   ├── calendar.js              # Gantt timeline rendering & interactions
│   ├── sources.js               # Source list panel rendering
│   └── modals.js                # Create/edit modal forms
├── backend/
│   ├── server.py                # Flask app (routes & startup)
│   └── database.py              # SQLite setup, schema, queries
├── requirements.txt             # Python dependencies
└── data/
    └── deadlines.db             # SQLite database (auto-created)
```

---

## Key Interactions

| Interaction                          | Behavior                                                      |
|--------------------------------------|--------------------------------------------------------------|
| Click source in left panel           | Highlights that source's deadlines on the timeline           |
| Click empty space on timeline        | Opens modal to create a deadline for that source/date range  |
| Hover over deadline bar              | Shows tooltip with deadline name, dates, description         |
| Drag deadline bar edges              | Resizes the deadline (changes start/end date)                |
| Click deadline bar                   | Opens modal to edit or delete                                |
| Mousewheel on timeline area          | Horizontal scroll                                            |
| Zoom [+] / [─]                       | Adjusts day column width (compact ↔ expanded)                 |
| Click [Today] button                 | Scrolls timeline to current date                              |
| Add Source button                    | Modal: name, project, color picker                           |
| Add Deadline button                  | Modal: name, source, start date, end date, description       |

---

## Minimalistic Theme

- **Base**: white background, dark text (#111)
- **Accent colors**: each source gets a distinct color used for its deadline bars
- **Typography**: system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- **Borders**: thin 1px #eee
- **Shadows**: none, or very subtle
- **Spacing**: generous whitespace, tight padding on timeline cells
- **Transitions**: smooth 150ms ease on hover/state changes
- **Today marker**: subtle red dashed vertical line

---

## Build Order

1. **Backend**: database schema → database queries → Flask routes
2. **Frontend scaffold**: HTML skeleton, CSS base, JS modules structure
3. **API layer**: fetch wrapper + hook up to backend
4. **Sources panel**: render, add, edit, delete
5. **Calendar timeline**: render days/columns, source rows, deadline bars
6. **Modals**: create/edit forms for sources and deadlines
7. **Interactions**: click, hover, drag-resize, zoom, scroll-to-today
8. **Polish**: refine minimalistic theme, transitions, edge cases
9. **Test**: end-to-end verification of all features
