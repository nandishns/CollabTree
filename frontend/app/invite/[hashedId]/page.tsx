"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { teamService } from "@/services/teamService"

export default function InvitePage() {
  const { hashedId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [teamName, setTeamName] = useState("")
  const [teamId, setTeamId] = useState<number>()
  const [error, setError] = useState("")

  useEffect(() => {
    validateAndFetchTeamDetails()
  }, [hashedId, user])

  const validateAndFetchTeamDetails = async () => {
    if (!hashedId || !user) return

    try {
      setIsLoading(true)
      setError("")

      const result = await teamService.validateInvite(hashedId as string, user.email)

      if (!result.isValid) {
        setError(result.error || "Invalid invite link")
        return
      }

      setTeamName(result.teamName || "")
      setTeamId(result.teamId)

    } catch (error) {
      setError("Failed to validate invite")
      toast({
        variant: "destructive",
        description: "An error occurred while validating the invite.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!teamId || !user) return

    try {
      setIsLoading(true)

      await teamService.joinTeam({
        team_id: teamId,
        user_id: parseInt(user.id)
      })

      toast({
        description: "Successfully joined the team!",
      })

      // Redirect to dashboard
      router.push("/dashboard")

    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to join the team. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto text-center p-8">
          <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto text-center p-8">
        <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h2>
        <p className="text-gray-600 mb-6">
          You've been invited to join <span className="font-semibold">{teamName}</span>
        </p>
        <div className="space-x-4">
          <Button onClick={handleJoinTeam} disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Team"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
} 