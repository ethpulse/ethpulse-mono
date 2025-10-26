"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Web3Context, connectWallet } from "@/lib/web3"

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Check if already connected
    if (typeof window.ethereum !== "undefined") {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0])
          }
        })
        .catch(console.error)

      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
        } else {
          setAccount(null)
        }
      })
    }
  }, [])

  const connect = async () => {
    setIsConnecting(true)
    try {
      const address = await connectWallet()
      setAccount(address)
    } catch (error) {
      console.error("Failed to connect:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
  }

  return <Web3Context.Provider value={{ account, isConnecting, connect, disconnect }}>{children}</Web3Context.Provider>
}
