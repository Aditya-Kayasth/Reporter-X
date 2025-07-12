"use client"; // Required for Next.js App Router

import { useState } from "react";
import { ethers } from "ethers";
import { LockIcon, ShieldIcon, AnonymousIcon, SendIcon } from '../components/Icons';

// Define window.ethereum globally
declare global {
  interface Window {
    ethereum?: any; // You can replace `any` with a stricter type if needed
  }
}

export default function MetaMaskConnect() {
  const [account, setAccount] = useState<string | null>(null);

  async function connectMetaMask() {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error details:", error);
        alert(`MetaMask Error: ${JSON.stringify(error, null, 2)}`);/* to be removed afterwords */
      }
    } else {
      alert("MetaMask is not installed. Please install it.");
    }
  }

  return (
    <div 
      
        onClick={connectMetaMask}
       
        className="px-8 py-2 bg-white text-black text-lg rounded-[0.75rem] scale-110 
             cursor-pointer text-center transition duration-300 
             hover:bg-gradient-to-r hover:from-purple-500  hover:to-pink-500 
             hover:text-white"


      >
        
        {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect to MetaMask"}
      
    </div>
  );
}

