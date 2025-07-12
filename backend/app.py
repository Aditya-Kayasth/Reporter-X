from flask import Flask, jsonify, request, render_template
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from datetime import datetime
import json
import os
import uuid
from utils import load_json, save_json, upload_to_ipfs
from blockchain import send_report_to_blockchain, contract

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'sup3r_s3cr3t_k3y_123!'
CORS(app)  # Enable CORS for all routes
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins for WebSocket

# File paths
USERS_FILE = "data/users.json"
REPORTS_FILE = "data/reports.json"

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# In-memory data storage for concerns (merged with reports)
concerns = []

# Load initial data from JSON files (if any)
try:
    concerns = load_json(REPORTS_FILE) or []
except FileNotFoundError:
    concerns = []

# ====================== Routes ======================

@app.route("/")
def index():
    """Home page with links to actions."""
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register_user():
    """Registers a new user with their MetaMask address."""
    if request.method == "POST":
        metamask_address = request.form.get("metamask_address")
        if not metamask_address:
            return render_template("register.html", error="MetaMask address is required")
        
        users = load_json(USERS_FILE)
        if metamask_address in users:
            message = "User already registered"
        else:
            users[metamask_address] = {"reported_issues": []}
            save_json(USERS_FILE, users)
            message = "User registered successfully"
        return render_template("register.html", message=message)
    return render_template("register.html")

@app.route("/report", methods=["GET", "POST"])
def report_issue():
    """Displays a form and handles submission of a whistleblower report."""
    if request.method == "POST":
        metamask_address = request.form.get("metamask_address")
        organization = request.form.get("organization")
        description = request.form.get("description")

        if not all([metamask_address, organization, description]):
            return render_template("report_form.html", error="All fields are required")

        # Handle file upload (if any)
        file = request.files.get("document")
        ipfs_document_url = None
        if file:
            ipfs_document_url = upload_to_ipfs(file.read(), is_file=True, filename=file.filename)  

        # Prepare report data to store locally
        report = {
            "id": f"#WB{len(concerns) + 1000}",  # Generate a unique ID
            "metamask_address": metamask_address,
            "organization": organization,
            "description": description,
            "document_url": ipfs_document_url,
            "status": "Pending",
            "date": datetime.now().strftime('%Y-%m-%d'),
            "comments": []
        }

        # Save to local JSON storage
        concerns.append(report)
        save_json(REPORTS_FILE, concerns)

        # Convert to JSON and upload to IPFS
        ipfs_hash = upload_to_ipfs(json.dumps(report))

        # Send the IPFS hash to blockchain
        tx_object = send_report_to_blockchain(ipfs_hash, metamask_address)

        return render_template("report_form.html", message="Report submitted successfully", 
                               tx_object=tx_object, ipfs_hash=ipfs_hash, document_url=ipfs_document_url)
    return render_template("report_form.html")

@app.route("/api/concerns", methods=["GET"])
def get_concerns():
    """Fetch all concerns (reports)."""
    return jsonify(concerns)

@app.route("/api/concerns", methods=["POST"])
def create_concern():
    """Create a new concern (report)."""
    new_concern = request.json
    new_concern['id'] = f"#WB{len(concerns) + 1000}"  # Generate a unique ID
    new_concern['status'] = 'Pending'
    new_concern['date'] = datetime.now().strftime('%Y-%m-%d')
    new_concern['category'] = new_concern.get('title', 'Uncategorized')
    new_concern['comments'] = []
    concerns.append(new_concern)
    save_json(REPORTS_FILE, concerns)
    return jsonify(new_concern), 201

@app.route("/api/concerns/<concern_id>/status", methods=["PUT"])
def update_concern_status(concern_id):
    """Update the status of a concern."""
    concern = next((c for c in concerns if c['id'] == concern_id), None)
    if not concern:
        return jsonify({"error": "Concern not found"}), 404
    new_status = request.json.get('status')
    if new_status:
        concern['status'] = new_status
        save_json(REPORTS_FILE, concerns)
        return jsonify(concern)
    else:
        return jsonify({"error": "Status is required"}), 400

@app.route("/my_reports/<string:metamask_address>")
def get_my_reports(metamask_address):
    """Fetch and display reports for a specific user."""
    user_reports = [r for r in concerns if r["metamask_address"] == metamask_address]
    return render_template("my_reports.html", reports=user_reports, metamask_address=metamask_address)

@app.route("/report/<int:report_id>", methods=["GET"])
def get_report(report_id):
    """Retrieve a specific report from the blockchain by its ID."""
    try:
        # Call the smart contract function getReport(report_id)
        ipfs_hash, reporter, resolved = contract.functions.getReport(report_id).call()
        return jsonify({
            "id": report_id,
            "ipfs_hash": ipfs_hash,
            "reporter": reporter,
            "resolved": resolved
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

# ====================== WebSocket Handlers ======================


@socketio.on('join_room')
def handle_join_room(data):
    concern_id = data['concernId']
    join_room(concern_id)
    print(f"Client joined room: {concern_id}")
    
    concern = next((c for c in concerns if 'id' in c and c['id'] == concern_id), None)
    if concern and 'comments' in concern:
        for comment in concern['comments']:
            emit('receive_message', comment, room=concern_id)

@socketio.on('send_message')
def handle_message(data):
    concern_id = data['concernId']
    message = data['message']
    sender = data['sender']
    
    concern = next((c for c in concerns if 'id' in c and c['id'] == concern_id), None)
    if concern:
        if 'comments' not in concern:
            concern['comments'] = []
            
        comment = {
            "id": str(uuid.uuid4()),  # Generate a unique UUID
            "text": message,
            "author": sender,
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        concern['comments'].append(comment)
        emit('receive_message', comment, room=concern_id)
        print(f"Message sent to room {concern_id}: {message}")
# ====================== Main ======================

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)

# from flask import Flask, request, jsonify
# import json
# import os
# from utils import load_json, save_json, upload_to_ipfs
# from blockchain import send_report_to_blockchain

# app = Flask(__name__)

# # File paths
# USERS_FILE = "data/users.json"
# REPORTS_FILE = "data/reports.json"

# # Ensure data directory exists
# os.makedirs("data", exist_ok=True)

# @app.route("/register", methods=["POST"])
# def register_user():
#     """Registers a new user with their MetaMask address."""
#     data = request.json
#     metamask_address = data.get("metamask_address")

#     if not metamask_address:
#         return jsonify({"error": "MetaMask address is required"}), 400

#     users = load_json(USERS_FILE)

#     if metamask_address in users:
#         return jsonify({"message": "User already registered"}), 200

#     users[metamask_address] = {"reported_issues": []}
#     save_json(USERS_FILE, users)

#     return jsonify({"message": "User registered successfully"}), 201

# @app.route("/report", methods=["POST"])
# def report_issue():
#     """Handles a whistleblower report with an optional document upload."""
#     metamask_address = request.form.get("metamask_address")
#     organization = request.form.get("organization")
#     description = request.form.get("description")

#     if not all([metamask_address, organization, description]):
#         return jsonify({"error": "Missing required fields"}), 400

#     # Handle file upload (if any)
#     file = request.files.get("document")
#     ipfs_document_url = None
#     if file:
#         ipfs_document_url = upload_to_ipfs(file.read(), is_file=True, filename=file.filename)  

#     # Prepare report data
#     report = {
#         "metamask_address": metamask_address,
#         "organization": organization,
#         "description": description,
#         "document_url": ipfs_document_url,
#         "status": "Pending"
#     }

#     # Save to local JSON storage
#     reports = load_json(REPORTS_FILE)
#     reports.append(report)
#     save_json(REPORTS_FILE, reports)

#     # Convert to JSON and upload to IPFS
#     ipfs_hash = upload_to_ipfs(json.dumps(report))

#     # Send the IPFS hash to blockchain using private key (from .env)
#     tx_hash = send_report_to_blockchain(ipfs_hash, metamask_address)

#     return jsonify({
#         "message": "Report submitted successfully",
#         "tx_hash": tx_hash,
#         "ipfs_hash": ipfs_hash,
#         "document_url": ipfs_document_url
#     }), 201

# @app.route("/my_reports/<string:metamask_address>", methods=["GET"])
# def get_my_reports(metamask_address):
#     """Fetch reports for a specific user."""
#     reports = load_json(REPORTS_FILE)
#     user_reports = [r for r in reports if r["metamask_address"] == metamask_address]
#     return jsonify(user_reports)

# if __name__ == "__main__":
#     app.run(debug=True)

