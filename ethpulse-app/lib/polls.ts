export interface Poll {
  id: string
  question: string
  options: string[]
  votes: number[]
  creator: string
  createdAt: number
  voters: string[]
}

// Mock data storage (in a real app, this would be on-chain)
const polls: Poll[] = [
  {
    id: "1",
    question: "Which blockchain should we integrate next?",
    options: ["Ethereum", "Polygon", "Arbitrum", "Optimism"],
    votes: [45, 32, 28, 19],
    creator: "0x1234...5678",
    createdAt: Date.now() - 86400000,
    voters: [],
  },
  {
    id: "2",
    question: "What feature should we prioritize?",
    options: ["NFT Voting", "Token Gating", "Multi-sig Polls", "Anonymous Voting"],
    votes: [67, 43, 38, 52],
    creator: "0xabcd...efgh",
    createdAt: Date.now() - 172800000,
    voters: [],
  },
]

export function getPolls(): Poll[] {
  return polls
}

export function getPoll(id: string): Poll | undefined {
  return polls.find((p) => p.id === id)
}

export function createPoll(question: string, options: string[], creator: string): Poll {
  const newPoll: Poll = {
    id: Date.now().toString(),
    question,
    options,
    votes: new Array(options.length).fill(0),
    creator,
    createdAt: Date.now(),
    voters: [],
  }
  polls.push(newPoll)
  return newPoll
}

export function vote(pollId: string, optionIndex: number, voter: string): boolean {
  const poll = polls.find((p) => p.id === pollId)
  if (!poll) return false

  // Check if already voted
  if (poll.voters.includes(voter)) {
    return false
  }

  poll.votes[optionIndex]++
  poll.voters.push(voter)
  return true
}
