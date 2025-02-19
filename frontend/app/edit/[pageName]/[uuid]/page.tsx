"use client"

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useAuth } from '@/app/contexts/AuthContext'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import EditorMenuBar from '@/components/editor/MenuBar'
import InviteDialog from '@/components/editor/InviteDialog'
import ProtectedRoute from '@/components/ProtectedRoute'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'

export default function CollaborativeEditor() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    const newProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || '',
      name: `${params.pageName}-${params.uuid}`,
      token: user.accessToken || '',
    })

    newProvider.on('connection', () => {
      toast({ description: 'Connected to collaboration server' })
    })

    newProvider.on('disconnect', () => {
      toast({ description: 'Disconnected from server', variant: 'destructive' })
    })

    newProvider.on('error', () => {
      toast({ description: 'Error connecting to collaboration server', variant: 'destructive' })
    })

    setProvider(newProvider)

    return () => {
      newProvider.destroy()
    }
  }, [user, params, toast])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      ...(provider ? [
        Collaboration.configure({
          document: provider.document,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: user?.email?.split('@')[0] || 'Anonymous',
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          },
          render: user => {
            const cursor = document.createElement('div')
            cursor.classList.add('collaboration-cursor')
            cursor.style.cssText = `
              width: 2px;
              height: 1.2em;
              background-color: ${user.color};
              position: relative;
              display: inline-block;
              vertical-align: text-top;
              margin-left: -1px;
              pointer-events: none;
            `

            const label = document.createElement('div')
            label.classList.add('collaboration-cursor-label')
            label.style.cssText = `
              position: absolute;
              top: -20px;
              left: -3px;
              font-size: 12px;
              font-weight: 500;
              background-color: ${user.color};
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              white-space: nowrap;
              pointer-events: none;
              user-select: none;
              opacity: 0.9;
              z-index: 20;
            `
            label.textContent = user.name

            cursor.appendChild(label)
            return cursor
          },
        }),
      ] : []),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none relative',
      },
    },
  }, [provider])

  if (!user) return null

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {decodeURIComponent(params.pageName as string)}
              </h1>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Back to Dashboard
                </Button>
                <Button
                  onClick={() => setIsInviteOpen(true)}
                >
                  Invite Collaborators
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            {editor && <EditorMenuBar editor={editor} />}
            <div className="mt-4 min-h-[500px] border rounded-lg p-4">
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>

        <InviteDialog 
          isOpen={isInviteOpen} 
          setIsOpen={setIsInviteOpen}
          documentId={`${params.pageName}-${params.uuid}`}
          documentName={params.pageName as string}
        />
      </div>
    </ProtectedRoute>
  )
} 