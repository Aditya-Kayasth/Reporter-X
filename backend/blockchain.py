from web3 import Web3
import json

# Connect to Linea Sepolia testnet
w3 = Web3(Web3.HTTPProvider("https://rpc.linea.build"))

# Load contract ABI and address
with open("contract/compiled_contract.json") as f:
    contract_data = json.load(f)

contract_address = contract_data["contractAddress"]
contract_abi = contract_data["abi"]
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

def send_report_to_blockchain(ipfs_hash, sender_address):
    """Sends a report reference (IPFS hash) to the blockchain via MetaMask."""
    nonce = w3.eth.get_transaction_count(sender_address)

    tx = contract.functions.submitReport(ipfs_hash).build_transaction({
        "from": sender_address,
        "gas": 2000000,
        "gasPrice": w3.eth.gas_price,
        "nonce": nonce
    })

    return tx  # Return the unsigned transaction to be signed by MetaMask
