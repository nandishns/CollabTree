"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import TeamCard from "@/components/dashboard/TeamCard"
import InviteTeamDialog from "@/components/dashboard/InviteTeamDialog"
import { useToast } from "@/hooks/use-toast"
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
import { Team } from "@/types/team"
import { teamService } from "@/services/teamService"
import { 
  Users,
  Plus,
  LogOut,
  Search,
  Loader2,
  UserCircle2
} from "lucide-react"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("queue")
  const { setTheme, theme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTeams()
  }, [user])

  const fetchTeams = async () => {
    if (!user) return
    
    try {
      const teams = await teamService.getTeams(user.id)
      setTeams(teams)
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to load teams. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !user) return

    try {
      await teamService.createTeam({
        name: newTeamName,
        created_by: user.id.toString()
      })

      toast({
        description: "Team created successfully!",
      })
      
      setNewTeamName('')
      setIsCreateTeamOpen(false)
      fetchTeams()
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to create team. Please try again.",
      })
    }
  }

  const handleInvite = (team: Team) => {
    setSelectedTeam(team)
    setIsInviteOpen(true)
  }

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
              <div className="flex items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 mr-2" />
                  CollabTree
                </h1>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <UserCircle2 className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <span className="text-sm text-gray-600 truncate">{user?.email}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateTeamOpen(true)}
                    className="flex items-center justify-center flex-1 sm:flex-none"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Team
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Your Teams</h2>
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
              <p className="text-sm text-gray-500 mb-6">Get started by creating your first team</p>
              <Button
                onClick={() => setIsCreateTeamOpen(true)}
                className="flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  {...team}
                  onInvite={() => handleInvite(team)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Create Team Dialog */}
        <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Create New Team
              </DialogTitle>
              <DialogDescription>
                Add a name for your new team to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                  id="team-name"
                  placeholder="Enter team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Dialog */}
        {selectedTeam && (
          <InviteTeamDialog
            isOpen={isInviteOpen}
            setIsOpen={setIsInviteOpen}
            teamId={selectedTeam.id.toString()}
            teamName={selectedTeam.name}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

