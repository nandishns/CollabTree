"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/contexts/AuthContext"
import { 
  Globe, 
  FileText, 
  ArrowRight, 
  Link as LinkIcon,
  BookOpen,
  AlertCircle
} from "lucide-react"

export default function WorkspacePage() {
  const { teamId } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [documentUrl, setDocumentUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleImport = async () => {
    if (!documentUrl.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter a valid documentation URL",
      })
      return
    }

    setIsLoading(true)
    try {
      // Here you'll add the logic to send the URL to your backend for scraping
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        description: "Documentation imported successfully!",
      })
      
      // Navigate back to dashboard or documentation view
      router.push("/dashboard")
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to import documentation. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Import Documentation
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Add documentation from external sources to your workspace
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <label 
                  htmlFor="doc-url" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Documentation URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="doc-url"
                    type="url"
                    placeholder="https://docs.example.com"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Enter the URL of the documentation you want to import
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-amber-800">
                    Before you import
                  </h3>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                    <li>Make sure you have permission to use the documentation</li>
                    <li>The content should be publicly accessible</li>
                    <li>Currently supports HTML and Markdown formats</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  onClick={handleImport}
                  disabled={isLoading || !documentUrl.trim()}
                  className="flex-1 sm:flex-none sm:min-w-[200px] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>Import Documentation</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 