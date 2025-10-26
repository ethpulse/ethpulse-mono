"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWeb3 } from "@/lib/web3"
import { createPoll } from "@/lib/polls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CreatePollPage() {
  const router = useRouter()
  const { account } = useWeb3()
  const { toast } = useToast()
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a poll",
        variant: "destructive",
      })
      return
    }

    if (!question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a poll question",
        variant: "destructive",
      })
      return
    }

    const validOptions = options.filter((opt) => opt.trim())
    if (validOptions.length < 2) {
      toast({
        title: "Not enough options",
        description: "Please provide at least 2 options",
        variant: "destructive",
      })
      return
    }

    createPoll(question, validOptions, account)
    toast({
      title: "Poll created!",
      description: "Your poll has been created successfully",
    })
    router.push("/polls")
  }

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to create a poll</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Create a New Poll</CardTitle>
          <CardDescription>Create a decentralized poll and let the community vote</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Poll Question</Label>
              <Input
                id="question"
                placeholder="What would you like to ask?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-4">
              <Label>Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="text-base"
                  />
                  {options.length > 2 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeOption(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 10 && (
                <Button type="button" variant="outline" onClick={addOption} className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg">
              Create Poll
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
