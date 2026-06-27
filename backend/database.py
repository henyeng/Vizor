import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'deadlines.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            project TEXT NOT NULL DEFAULT 'Default',
            color TEXT NOT NULL DEFAULT '#4A90D9'
        );

        CREATE TABLE IF NOT EXISTS deadlines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            description TEXT DEFAULT '',
            FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
        );
    ''')
    conn.commit()
    conn.close()


def get_sources():
    conn = get_db()
    rows = conn.execute('SELECT * FROM sources ORDER BY project, name').fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_source(name, project, color):
    conn = get_db()
    cur = conn.execute('INSERT INTO sources (name, project, color) VALUES (?, ?, ?)',
                       (name, project, color))
    conn.commit()
    source_id = cur.lastrowid
    conn.close()
    return source_id


def update_source(source_id, name, project, color):
    conn = get_db()
    conn.execute('UPDATE sources SET name=?, project=?, color=? WHERE id=?',
                 (name, project, color, source_id))
    conn.commit()
    conn.close()


def delete_source(source_id):
    conn = get_db()
    conn.execute('DELETE FROM sources WHERE id=?', (source_id,))
    conn.commit()
    conn.close()


def get_deadlines(source_id=None):
    conn = get_db()
    if source_id:
        rows = conn.execute(
            'SELECT d.*, s.name as source_name, s.color as source_color, s.project as source_project '
            'FROM deadlines d JOIN sources s ON d.source_id = s.id '
            'WHERE d.source_id=? ORDER BY d.start_date', (source_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            'SELECT d.*, s.name as source_name, s.color as source_color, s.project as source_project '
            'FROM deadlines d JOIN sources s ON d.source_id = s.id '
            'ORDER BY d.start_date'
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_deadline(source_id, name, start_date, end_date, description=''):
    conn = get_db()
    cur = conn.execute(
        'INSERT INTO deadlines (source_id, name, start_date, end_date, description) '
        'VALUES (?, ?, ?, ?, ?)',
        (source_id, name, start_date, end_date, description)
    )
    conn.commit()
    deadline_id = cur.lastrowid
    conn.close()
    return deadline_id


def update_deadline(deadline_id, name, start_date, end_date, description):
    conn = get_db()
    conn.execute(
        'UPDATE deadlines SET name=?, start_date=?, end_date=?, description=? WHERE id=?',
        (name, start_date, end_date, description, deadline_id)
    )
    conn.commit()
    conn.close()


def delete_deadline(deadline_id):
    conn = get_db()
    conn.execute('DELETE FROM deadlines WHERE id=?', (deadline_id,))
    conn.commit()
    conn.close()


def get_projects():
    conn = get_db()
    rows = conn.execute('SELECT DISTINCT project FROM sources ORDER BY project').fetchall()
    conn.close()
    return [r['project'] for r in rows]
