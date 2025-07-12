import requests
import json
import os

PINATA_API_KEY = "1e67d7eaa65798ebba91"
PINATA_SECRET_API_KEY = "caf3a015d302455525c7faee3dde3c0d35a35c13f0dc4113616ab015a11bcadf"

def load_json(file_path):
    """Loads JSON data from a file."""
    if not os.path.exists(file_path):
        return {}
    with open(file_path, "r") as f:
        return json.load(f)

def save_json(file_path, data):
    """Saves JSON data to a file."""
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

def upload_to_ipfs(data, is_file=False, filename="document.txt"):
    """Uploads data (JSON or file) to IPFS and returns the IPFS hash."""
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS" if is_file else "https://api.pinata.cloud/pinning/pinJSONToIPFS"
    
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY
    }

    if is_file:
        files = {"file": (filename, data)}
        response = requests.post(url, headers=headers, files=files)
    else:
        response = requests.post(url, json={"pinataContent": data}, headers=headers)

    if response.status_code == 200:
        return f"https://gateway.pinata.cloud/ipfs/{response.json()['IpfsHash']}"
    else:
        raise Exception(f"Failed to upload to IPFS: {response.text}")
