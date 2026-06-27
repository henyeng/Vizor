from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, get_sources, create_source, update_source, delete_source
from database import get_deadlines, create_deadline, update_deadline, delete_deadline
from database import get_projects
import os

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__))))
CORS(app)

# --- Sources ---

@app.route('/api/sources', methods=['GET'])
def api_get_sources():
    return jsonify(get_sources())


@app.route('/api/sources', methods=['POST'])
def api_create_source():
    data = request.get_json()
    source_id = create_source(
        data['name'],
        data.get('project', 'Default'),
        data.get('color', '#4A90D9')
    )
    return jsonify({'id': source_id}), 201


@app.route('/api/sources/<int:source_id>', methods=['PUT'])
def api_update_source(source_id):
    data = request.get_json()
    update_source(source_id, data['name'], data.get('project', 'Default'), data.get('color', '#4A90D9'))
    return jsonify({'ok': True})


@app.route('/api/sources/<int:source_id>', methods=['DELETE'])
def api_delete_source(source_id):
    delete_source(source_id)
    return jsonify({'ok': True})


# --- Deadlines ---

@app.route('/api/deadlines', methods=['GET'])
def api_get_deadlines():
    source_id = request.args.get('source_id', type=int)
    return jsonify(get_deadlines(source_id))


@app.route('/api/deadlines', methods=['POST'])
def api_create_deadline():
    data = request.get_json()
    deadline_id = create_deadline(
        data['source_id'],
        data['name'],
        data['start_date'],
        data['end_date'],
        data.get('description', '')
    )
    return jsonify({'id': deadline_id}), 201


@app.route('/api/deadlines/<int:deadline_id>', methods=['PUT'])
def api_update_deadline(deadline_id):
    data = request.get_json()
    update_deadline(deadline_id, data['name'], data['start_date'], data['end_date'], data.get('description', ''))
    return jsonify({'ok': True})


@app.route('/api/deadlines/<int:deadline_id>', methods=['DELETE'])
def api_delete_deadline(deadline_id):
    delete_deadline(deadline_id)
    return jsonify({'ok': True})


# --- Projects ---

@app.route('/api/projects', methods=['GET'])
def api_get_projects():
    return jsonify(get_projects())


# --- Serve frontend ---

@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=8000, debug=True)
