"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Vote, Shield, Zap, Users } from "lucide-react"
import { useWeb3 } from "@/lib/web3"

export default function HomePage() {
  const { account, connect } = useWeb3()

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Vote className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight md:text-6xl">
          Decentralized Polling Platform
        </h1>
        <p className="mb-8 text-pretty text-xl text-muted-foreground">
          Create transparent, tamper-proof polls on the blockchain. Vote with your wallet and see real-time results
          powered by Web3 technology.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {account ? (
            <>
              <Link href="/create">
                <Button size="lg" className="text-lg">
                  Create a Poll
                </Button>
              </Link>
              <Link href="/polls">
                <Button size="lg" variant="outline" className="text-lg bg-transparent">
                  Browse Polls
                </Button>
              </Link>
            </>
          ) : (
            <Button size="lg" onClick={connect} className="text-lg">
              Connect Wallet to Start
            </Button>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto mt-24 grid max-w-5xl gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Transparent & Secure</h3>
          <p className="text-muted-foreground">
            All votes are recorded on-chain, ensuring complete transparency and immutability.
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
            <Zap className="h-6 w-6 text-accent" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Instant Results</h3>
          <p className="text-muted-foreground">
            See real-time voting results with beautiful visualizations and analytics.
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
            <Users className="h-6 w-6 text-chart-3" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Community Driven</h3>
          <p className="text-muted-foreground">
            One wallet, one vote. Fair and democratic decision-making for everyone.
          </p>
        </Card>
      </div>

      {/* Stats */}
      <div className="mx-auto mt-24 max-w-5xl">
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-primary">1,234</div>
            <div className="text-sm text-muted-foreground">Total Polls Created</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-accent">45,678</div>
            <div className="text-sm text-muted-foreground">Votes Cast</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-chart-3">8,901</div>
            <div className="text-sm text-muted-foreground">Active Voters</div>
          </div>
        </div>
      </div>
    </div>
  )
}
