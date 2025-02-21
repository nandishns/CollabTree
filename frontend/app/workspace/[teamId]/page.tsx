"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/contexts/AuthContext"
import { 
  FileText, 
  Plus,
  Globe,
  Calendar,
  ChevronRight,
  Check,
  Loader2,
  RefreshCw,
  ArrowLeft,
  PenSquare,
  Users,
  ChevronLeft,
  Mail,
  Menu
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import axios from "axios"
import { Team } from "@/types/team"
import { documentService } from "@/services/documentService"
import { teamService } from "@/services/teamService"
import { useQuery, useQueryClient, useMutation, UseQueryResult } from "@tanstack/react-query"

interface Document {
  id: number
  title: string
  url: string
  content: any
  team_id: number
  created_at: string
  updated_at: string
  sections: any[]
}

// Use the TeamExistsResponse type from teamService for the team state
type TeamState = {
  exists: boolean
  team_id?: number
  name?: string
  created_at?: string
  message?: string
  members?: Array<{
    id: number
    email: string
    joined_at: string
  }>
}

export default function WorkspacePage() {
  const { teamId } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")
  const [documentName, setDocumentName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [processStage, setProcessStage] = useState<{
    scraping: boolean
    processing: boolean
    completed: boolean
  }>({
    scraping: false,
    processing: false,
    completed: false
  })
  const queryClient = useQueryClient()

  // Use React Query for team data
  const { data: team } = useQuery<TeamState, Error>({
    queryKey: ['team', teamId],
    queryFn: () => teamService.checkTeamExists(teamId?.toString() || ''),
    enabled: !!teamId,
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  })

  // Use React Query for documents data
  const { data: documents = [], isLoading }: UseQueryResult<Document[], Error> = useQuery({
    queryKey: ['documents', teamId],
    queryFn: () => documentService.getTeamDocuments(teamId?.toString() || ''),
    enabled: !!teamId,
    gcTime: 1000 * 60 * 15, // Keep unused data in cache for 15 minutes
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  })

  // Use mutation for document import
  const importDocumentMutation = useMutation<
    { docID: number; docName: string },
    Error,
    { docID: number; docName: string }
  >({
    mutationFn: async (docData) => {
      setProcessStage({ scraping: true, processing: false, completed: false })
      await new Promise(resolve => setTimeout(resolve, 2000))
      setProcessStage({ scraping: true, processing: true, completed: false })

      const response = await documentService.scrapeDocument({
        url: documentUrl,
        team_id: parseInt(teamId as string),
        user_id: parseInt(user?.id as string),
        document_name: documentName
      })

      await new Promise(resolve => setTimeout(resolve, 1500))
      setProcessStage({ scraping: true, processing: true, completed: true })
      await new Promise(resolve => setTimeout(resolve, 1000))

      return docData
    },
    onSuccess: (data) => {
      router.push(`/edit/${data.docID}-${data.docName.replace(/[^a-zA-Z0-9]/g, '')}/${user?.id || ''}`)
      // Invalidate documents query to refetch
      queryClient.invalidateQueries({ queryKey: ['documents', teamId] })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        description: "Failed to import document. Please try again.",
      })
      setProcessStage({ scraping: false, processing: false, completed: false })
    },
    onSettled: () => {
      setIsProcessing(false)
    }
  })

  const handleImport = async (docID: number, docName: string) => {
    if (!documentUrl.trim() || !documentName.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter both URL and document name",
      })
      return
    }

    setIsProcessing(true)
    importDocumentMutation.mutate({ docID, docName })
  }

  const ProcessingStep = ({ done, processing, label }: { done: boolean; processing: boolean; label: string }) => (
    <div className="flex items-center gap-3">
      {done ? (
        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-4 w-4 text-green-600" />
        </div>
      ) : processing ? (
        <div className="h-6 w-6 flex items-center justify-center">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="h-6 w-6 rounded-full border-2 border-gray-200" />
      )}
      <span className={`text-sm ${done ? 'text-green-600' : processing ? 'text-blue-600' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {team?.name || "Team Workspace"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Team Members</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Team Members
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {team?.members?.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
                      >
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-600">
                            {member.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.email}
                          </p>
                          {member.joined_at && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Joined {formatDistanceToNow(new Date(member.joined_at))} ago
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
              <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Document</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-6">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex flex-col gap-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-sm text-gray-500 mb-6">Get started by adding your first document</p>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Document
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {documents.map((doc: Document) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {doc.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Updated {formatDistanceToNow(new Date(doc.updated_at))} ago</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => router.push(`/edit/${doc.id}-${doc.title.replace(/[^a-zA-Z0-9]/g, '')}/${user?.id || ''}`)}
                    >
                      <PenSquare className="h-4 w-4" />
                      Open Editor
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Import Document
            </DialogTitle>
          </DialogHeader>

          {isProcessing ? (
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                <ProcessingStep 
                  done={processStage.scraping && processStage.processing} 
                  processing={processStage.scraping && !processStage.processing}
                  label="Scraping data..." 
                />
                <ProcessingStep 
                  done={processStage.completed} 
                  processing={processStage.processing && !processStage.completed}
                  label="Processing content..." 
                />
              </div>

              {processStage.completed && (
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsCreateOpen(false)
                      setIsProcessing(false)
                      setProcessStage({ scraping: false, processing: false, completed: false })
                      setDocumentUrl("")
                      setDocumentName("")
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => router.push(`/edit/${teamId}`)}
                  >
                    <PenSquare className="h-4 w-4 mr-2" />
                    Open Editor
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="doc-name" className="text-sm font-medium text-gray-700">
                    Document Name
                  </label>
                  <Input
                    id="doc-name"
                    placeholder="Enter document name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="doc-url" className="text-sm font-medium text-gray-700">
                    Documentation URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="doc-url"
                      type="url"
                      placeholder="https://docs.example.com"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={() => handleImport(documents[0].id, documents[0].title)}
                  disabled={!documentUrl.trim() || !documentName.trim()}
                >
                  Import Document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 