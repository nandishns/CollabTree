import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { teamService } from "@/services/teamService"

interface InviteTeamDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  teamId: string
  teamName: string
}

export default function InviteTeamDialog({ isOpen, setIsOpen, teamId, teamName }: InviteTeamDialogProps) {
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  const handleCopyLink = () => {
    const link = teamService.generateInviteLink(teamId, email)
    navigator.clipboard.writeText(link)
    toast({
      description: "Invite link copied to clipboard!",
    })
    setEmail('')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite to {teamName}</DialogTitle>
          <DialogDescription>
            Generate an invite link for your team member.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCopyLink}
            disabled={!email}
          >
            Generate & Copy Invite Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 