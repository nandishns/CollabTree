import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Users, 
  UserPlus, 
  Laptop, 
  ChevronRight,
  Clock,
  Mail,
  Calendar
} from "lucide-react"
import { formatDistanceToNow, format } from 'date-fns'
import { Team, TeamMember } from '@/types/team'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TeamCardProps extends Omit<Team, 'member_count'> {
  onInvite: () => void
}

const getAvatarColor = (index: number) => {
  const colors = [
    'bg-blue-500 text-white',
    'bg-green-500 text-white',
    'bg-purple-500 text-white',
    'bg-yellow-500 text-white',
    'bg-pink-500 text-white',
    'bg-indigo-500 text-white'
  ]
  return colors[index % colors.length]
}

const getInitials = (email: string) => {
  return email.split('@')[0].slice(0, 1).toUpperCase()
}

export default function TeamCard({ id, name, created_at, members, onInvite }: TeamCardProps) {
  const router = useRouter()
  const [showMembers, setShowMembers] = useState(false)

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Created {formatDistanceToNow(new Date(created_at))} ago</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onInvite}
              className="w-full sm:w-auto flex items-center justify-center gap-2 hover:bg-gray-100"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Members</span>
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Team Members</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMembers(true)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  View all {members.length}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={() => router.push(`/workspace/${id}`)}
              >
                <Laptop className="h-4 w-4" />
                <span>Enter Workspace</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Members
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {member.email}
                      </span>
                    </div>
                    {member.joined_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 