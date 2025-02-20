"use client"

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import EditorMenuBar from '@/components/editor/MenuBar'
import InviteDialog from '@/components/editor/InviteDialog'
import ProtectedRoute from '@/components/ProtectedRoute'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import FileTree from '@/app/components/editor/FileTree'
import AutoSaveIndicator, { SaveStatus } from '@/app/components/editor/AutoSaveIndicator'
import { documentService } from '@/app/services/documentService'
import { Loader2, ChevronLeft, Share2, Menu, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function CollaborativeEditor() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [documentData, setDocumentData] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    const docName = typeof params.pageName === 'string' ? params.pageName.split('-')[1] : '';
    const docId = typeof params.pageName === 'string' ? params.pageName.split('-')[0] : '';

    const loadDocument = async () => {
      try {
        const response = await documentService.getDocument(docId);
        setDocumentData(response.data);
        if (response.data.sections.length > 0) {
          setActiveSection(response.data.sections[0]);
        }
        setIsLoading(false);
      } catch (error) {
        toast({ 
          description: 'Failed to load document', 
          variant: 'destructive' 
        });
        setIsLoading(false);
      }
    };

    loadDocument();

    const newProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || '',
      name: docName,
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
    content: activeSection?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none relative',
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeSection) return;
      
      setSaveStatus('saving');
      const docId = typeof params.pageName === 'string' ? params.pageName.split('-')[0] : '';
      
      // Debounce save
      const timeoutId = setTimeout(async () => {
        try {
          const updatedContent = editor.getHTML();
          await documentService.updateDocument(docId, {
            title: documentData.title,
            content: {
              ...documentData.content,
              sections: documentData.sections.map((section: any) => 
                section.id === activeSection.id 
                  ? { ...section, content: updatedContent }
                  : section
              )
            }
          });
          setSaveStatus('saved');
        } catch (error) {
          setSaveStatus('error');
          toast({ 
            description: 'Failed to save changes', 
            variant: 'destructive' 
          });
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    },
  }, [provider, activeSection])

  useEffect(() => {
    if (editor && activeSection) {
      editor.commands.setContent(activeSection.content);
    }
  }, [activeSection, editor]);

  const handleBack = () => {
    window.history.back();
  };

  if (!user) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 relative">
        <header className="bg-white shadow-sm border-b py-3 relative z-10">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="hover:bg-gray-100 -ml-3"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden ml-2"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                  </Sheet>
                </div>
                <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                <div className="flex items-center space-x-4 min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {documentData?.title || 'Untitled Document'}
                  </h1>
                  <AutoSaveIndicator status={saveStatus} className="hidden sm:flex" />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => setIsInviteOpen(true)}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-3.5rem)] relative">
          <div className="hidden lg:block w-64 border-r">
            <FileTree
              sections={documentData?.sections || []}
              activeSection={activeSection}
              onSectionSelect={setActiveSection}
            />
          </div>
          
          <main className="flex-1 overflow-y-auto bg-blue-50/30">
            <div className="max-w-5xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow-sm border">
                {editor && <EditorMenuBar editor={editor} />}
                <div className="min-h-[500px] p-3 sm:p-4 bg-blue-50/50">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </main>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetContent side="left" className="w-[300px] p-0 z-50">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Document Sections</SheetTitle>
              </SheetHeader>
              <FileTree
                sections={documentData?.sections || []}
                activeSection={activeSection}
                onSectionSelect={(section) => {
                  setActiveSection(section);
                  setIsMobileMenuOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="relative z-50">
          <InviteDialog 
            isOpen={isInviteOpen} 
            setIsOpen={setIsInviteOpen}
            documentId={`${params.pageName}-${params.uuid}`}
            documentName={params.pageName as string}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
} 