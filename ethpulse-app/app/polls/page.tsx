"use client"

import { useState } from "react"
import { getPolls, vote } from "@/lib/polls"
import { useWeb3 } from "@/lib/web3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, Clock } from "lucide-react"
import { PollResults } from "@/components/poll-results"

export default function PollsPage() {
  const { account } = useWeb3()
  const { toast } = useToast()
  const [polls, setPolls] = useState(getPolls())
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [showResults, setShowResults] = useState<string | null>(null)

  const handleVote = () => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      })
      return
    }

    if (!selectedPoll || !selectedOption) return

    const optionIndex = Number.parseInt(selectedOption)
    const success = vote(selectedPoll, optionIndex, account)

    if (success) {
      toast({
        title: "Vote submitted!",
        description: "Your vote has been recorded on-chain",
      })
      setPolls(getPolls())
      setSelectedPoll(null)
      setSelectedOption("")
    } else {
      toast({
        title: "Already voted",
        description: "You have already voted on this poll",
        variant: "destructive",
      })
    }
  }

  const getTotalVotes = (votes: number[]) => votes.reduce((a, b) => a + b, 0)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    return `${days} days ago`
  }

  const currentPoll = polls.find((p) => p.id === selectedPoll)
  const resultsPoll = polls.find((p) => p.id === showResults)

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Active Polls</h1>
        <p className="text-muted-foreground">Browse and vote on community polls</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {polls.map((poll) => {
          const totalVotes = getTotalVotes(poll.votes)
          const hasVoted = account ? poll.voters.includes(account) : false

          return (
            <Card key={poll.id} className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 flex items-start justify-between">
                  <CardTitle className="text-xl">{poll.question}</CardTitle>
                  {hasVoted && <Badge variant="secondary">Voted</Badge>}
                </div>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(poll.createdAt)}
                  </span>
                  <span>{totalVotes} votes</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={() => setSelectedPoll(poll.id)} disabled={hasVoted || !account} className="flex-1">
                    {hasVoted ? "Already Voted" : "Vote Now"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowResults(poll.id)} className="flex-1">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Voting Dialog */}
      <Dialog open={!!selectedPoll} onOpenChange={() => setSelectedPoll(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentPoll?.question}</DialogTitle>
            <DialogDescription>Select your choice and submit your vote</DialogDescription>
          </DialogHeader>
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {currentPoll?.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={handleVote} disabled={!selectedOption} className="w-full">
            Submit Vote
          </Button>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={!!showResults} onOpenChange={() => setShowResults(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{resultsPoll?.question}</DialogTitle>
            <DialogDescription>Poll results and statistics</DialogDescription>
          </DialogHeader>
          {resultsPoll && <PollResults poll={resultsPoll} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
