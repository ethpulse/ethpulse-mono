"use client"

import Link from "next/link"
import { useWeb3 } from "@/lib/web3"
import { Button } from "@/components/ui/button"
import { shortenAddress } from "@/lib/web3"
import { Wallet, Vote } from "lucide-react"

export function Navbar() {
  const { account, isConnecting, connect, disconnect } = useWeb3()

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Vote className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PulseVote</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/polls">
              <Button variant="ghost">Browse Polls</Button>
            </Link>
            <Link href="/create">
              <Button variant="ghost">Create Poll</Button>
            </Link>

            {account ? (
              <Button variant="outline" onClick={disconnect}>
                <Wallet className="mr-2 h-4 w-4" />
                {shortenAddress(account)}
              </Button>
            ) : (
              <Button onClick={connect} disabled={isConnecting}>
                <Wallet className="mr-2 h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
