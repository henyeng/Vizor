# Vizor

A minimalistic scrolling calendar app for visualizing deadlines. Create sources (classes, work, projects) and add deadlines that span across days on a Gantt-like timeline.

## Features

- Horizontal scrolling Gantt timeline
- Organize deadlines by source, grouped by project
- Click any date cell to quickly add a deadline
- Drag deadline edges to resize date ranges
- Zoom controls (Compact / Day / Wide / Detail)
- Color-coded sources with overlap detection
- Minimalistic UI

## How to Run

```bash
cd backend
pip install -r ../requirements.txt
python server.py
```

Open http://localhost:8000 in your browser.

## Tech

- **Frontend:** Plain HTML, CSS, JS
- **Backend:** Python + Flask
- **Database:** SQLite
