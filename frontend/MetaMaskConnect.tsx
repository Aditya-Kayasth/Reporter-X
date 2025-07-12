"use client";

import { useState } from "react";
import { ethers } from "ethers";
import type { Ethereum } from "@metamask/providers";

declare global {
  interface Window {
    ethereum?: Ethereum;
  }
}

export default function MetaMaskConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function connectMetaMask() {
    if (loading || account) return;
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        setLoading(true);
        // ethers v6: BrowserProvider expects a valid EIP-1193 provider
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const accounts: string[] = await provider.send("eth_requestAccounts", []);
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          alert("No accounts found in MetaMask.");
        }
      } catch (error: any) {
        console.error("Error details:", error);
        alert(`MetaMask Error: ${error?.message || JSON.stringify(error, null, 2)}`);
      } finally {
        setLoading(false);
      }
    } else {
      alert("MetaMask is not installed. Please install it.");
    }
  }

  return (
    <div
      onClick={connectMetaMask}
      className={`px-8 py-2 bg-white text-black text-lg rounded-[0.75rem] scale-110 
             cursor-pointer text-center transition duration-300 
             hover:bg-gradient-to-r hover:from-purple-500  hover:to-pink-500 
             hover:text-white ${loading || account ? "opacity-60 pointer-events-none" : ""}`}
      aria-disabled={loading || !!account}
    >
      {loading
        ? "Connecting..."
        : account
        ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
        : "Connect to MetaMask"}
    </div>
  );
}