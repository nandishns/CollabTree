import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from "@/hooks/use-toast"

interface InviteDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  documentId: string
  documentName: string
}

export default function InviteDialog({
  isOpen,
  setIsOpen,
  documentId,
  documentName,
}: InviteDialogProps) {
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  const handleInvite = async () => {
    try {
      // Here you would implement your invitation logic
      // For example, sending an email or creating a database record
      const inviteLink = `${window.location.origin}/edit/${documentName}/${documentId}`
      
      await navigator.clipboard.writeText(inviteLink)
      toast({ description: 'Collaboration link copied to clipboard!' })
      setIsOpen(false)
    } catch (error) {
      toast({ description: 'Failed to generate invite link', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Collaborators</DialogTitle>
          <DialogDescription>
            Share this document with others to collaborate in real-time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Document Link
            </label>
            <div className="mt-1 flex gap-2">
              <Input
                value={`${window.location.href}`}
                readOnly
              />
              <Button onClick={handleInvite}>
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 