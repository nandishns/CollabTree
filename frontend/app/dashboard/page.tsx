"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from '../contexts/AuthContext'
import Image from 'next/image'
import { useRouter } from 'next/navigation'


export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("queue")
  const { setTheme, theme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()

  const createNewDocument = () => {
    const documentName = prompt('Enter document name:')
    if (documentName) {
      const safeName = encodeURIComponent(documentName.trim())
      router.push(`/edit/${safeName}/${user?.id}`)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center w-full sm:w-auto justify-center sm:justify-start">
                <h1 className="ml-4 text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  CollabTree
                </h1>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto justify-center sm:justify-end">
                <span className="text-gray-700 text-sm sm:text-base">Welcome, {user?.email}</span>

                <Button size="sm" onClick={logout}>Logout</Button>
                <div className="flex items-center gap-2">
                  
                  <Button
                    variant="ghost" 
                    size="icon"
                    asChild
                  >
                    <a href="https://github.com/nandishns/" target="_blank" rel="noopener noreferrer">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                      </svg>
                      <span className="sr-only">GitHub repository</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl text-black">Your Documents</h1>
            <Button onClick={createNewDocument}>
              Create New Document
            </Button>
          </div>
          
          {/* Add your documents list here */}
        </main>
      </div>
    </ProtectedRoute>
  )
}

