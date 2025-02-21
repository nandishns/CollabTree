"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import EditorMenuBar from '@/components/editor/MenuBar'
import InviteDialog from '@/components/editor/InviteDialog'
import ProtectedRoute from '@/components/ProtectedRoute'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import FileTree from '@/app/components/FileTree'
import AutoSaveIndicator, { SaveStatus } from '@/app/components/editor/AutoSaveIndicator'
import { documentService } from '@/app/services/documentService'
import { Loader2, ChevronLeft, Share2, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from '@/app/types/section'
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'

interface ApiSection {
  title: string;
  level: number;
  content: string;
  subsections: ApiSection[];
}

interface DocumentPage {
  title: string;
  url: string;
  content: {
    sections: ApiSection[];
  };
}

interface DocumentData {
  title: string;
  url: string;
  content: {
    pages: DocumentPage[];
  };
  id: number;
  team_id: number;
  created_at: string;
  updated_at: string;
}

const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

const convertToSection = (apiSection: ApiSection): Section => ({
  id: generateUniqueId(),
  title: apiSection.title,
  level: apiSection.level || 1,
  content: apiSection.content || '',
  subsections: apiSection.subsections ? apiSection.subsections.map(convertToSection) : []
});

const convertToApiSection = (section: Section): ApiSection => ({
  title: section.title,
  level: section.level,
  content: section.content,
  subsections: section.subsections.map(convertToApiSection)
});

export default function CollaborativeEditor() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNewSectionDialogOpen, setIsNewSectionDialogOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionParentId, setNewSectionParentId] = useState<string | null>(null)
  const [isSectionLoading, setIsSectionLoading] = useState(false)
  const lastSavedContent = useRef<string>('')
  const hasUnsavedChanges = useRef(false)
  
  // Use a ref for the section cache to avoid re-renders on every keystroke
  const sectionCacheRef = useRef<Record<string, string>>({});

  // Memoized conversion of API sections for the FileTree
  const convertedSections = useMemo(() => {
    if (!documentData) return [];
    return documentData.content.pages.flatMap(page =>
      page.content.sections.map((s: ApiSection) => convertToSection(s))
    );
  }, [documentData]);

  // Memoized function to update section content within pages
  const updateSectionContent = useCallback((pages: DocumentData['content']['pages'], sectionId: string, newContent: string): DocumentData['content']['pages'] => {
    return pages.map(page => ({
      ...page,
      content: {
        sections: page.content.sections.map(section => {
          const converted = convertToSection(section);
          if (converted.id === sectionId) {
            const updated = { ...converted, content: newContent };
            return convertToApiSection(updated);
          }
          if (converted.subsections?.length) {
            const updated = {
              ...converted,
              subsections: converted.subsections.map(subsection => 
                subsection.id === sectionId 
                  ? { ...subsection, content: newContent }
                  : subsection
              )
            };
            return convertToApiSection(updated);
          }
          return convertToApiSection(converted);
        })
      }
    }));
  }, []);

  // Optimized debounced save with a 3-second delay
  const debouncedSave = useMemo(
    () =>
      debounce(async (docId: string, content: string, sectionId: string) => {
        try {
          const updatedSections = updateSectionContent(
            documentData?.content?.pages || [],
            sectionId,
            content
          );

          await documentService.updateDocument(docId, {
            title: documentData?.title || 'Untitled Document',
            content: {
              ...documentData?.content,
              pages: updatedSections
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
      }, 3000),
    [documentData, updateSectionContent, toast]
  );

  // Initialize editor with collaboration and other extensions
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
        }),
      ] : []),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none relative',
      },
      handleDOMEvents: {
        keydown: () => {
          hasUnsavedChanges.current = true;
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeSection) return;
      
      const content = editor.getHTML();
      if (content === lastSavedContent.current) return;

      // Use ref for caching to avoid triggering re-renders
      sectionCacheRef.current[activeSection.id] = content;

      hasUnsavedChanges.current = true;
      setSaveStatus('saving');
    },
  }, [provider, activeSection]);

  // Throttled content update for smooth typing (if needed)
  const updateEditorContent = useMemo(
    () =>
      throttle((content: string) => {
        if (editor) {
          editor.commands.setContent(content);
        }
      }, 50),
    [editor]
  );

  useEffect(() => {
    if (!editor || !activeSection) return;
    
    const cachedContent = sectionCacheRef.current[activeSection.id];
    if (cachedContent) {
      editor.commands.setContent(cachedContent);
    } else {
      editor.commands.setContent(activeSection.content || '');
      sectionCacheRef.current[activeSection.id] = activeSection.content || '';
    }
  }, [activeSection, editor]);

  // Clear section cache when document changes
  useEffect(() => {
    sectionCacheRef.current = {};
  }, [documentData?.id]);

  // Optimized section change handler
  const handleSectionChange = useCallback(async (section: Section) => {
    if (hasUnsavedChanges.current && editor && activeSection) {
      const content = editor.getHTML();
      if (content !== lastSavedContent.current) {
        const docId = typeof params.pageName === 'string' ? params.pageName.split('-')[0] : '';
        debouncedSave(docId, content, activeSection.id);
        lastSavedContent.current = content;
        hasUnsavedChanges.current = false;
      }
    }

    setIsSectionLoading(true);
    setActiveSection(section);
    setIsSectionLoading(false);
  }, [editor, activeSection, debouncedSave, params.pageName]);

  // Auto-save effect with a 3-second interval
  useEffect(() => {
    if (!activeSection || !documentData || !editor) return;

    const autoSaveInterval = setInterval(() => {
      if (!hasUnsavedChanges.current) return;

      const content = editor.getHTML();
      if (content === lastSavedContent.current) {
        hasUnsavedChanges.current = false;
        setSaveStatus('saved');
        return;
      }

      const docId = typeof params.pageName === 'string' ? params.pageName.split('-')[0] : '';
      debouncedSave(docId, content, activeSection.id);
      lastSavedContent.current = content;
      hasUnsavedChanges.current = false;
    }, 3000);

    return () => {
      clearInterval(autoSaveInterval);
      if (hasUnsavedChanges.current) {
        const content = editor.getHTML();
        if (content !== lastSavedContent.current) {
          const docId = typeof params.pageName === 'string' ? params.pageName.split('-')[0] : '';
          debouncedSave(docId, content, activeSection.id);
        }
      }
    };
  }, [activeSection, documentData, editor, debouncedSave, params.pageName]);

  
  useEffect(() => {
    if (!user) return
    const docName = typeof params.pageName === 'string' ? params.pageName.split('-')[1] : '';
    const docId = typeof params.pageName === 'string' ? params.pageName.split('-')[0] : '';

    const loadDocument = async () => {
      try {
        const response = await documentService.getDocument(docId);
        const data = response.data;
        
        if (data.content.pages[0]?.content.sections) {
          const convertedSections = data.content.pages[0].content.sections.map(convertToSection);
          
          if (convertedSections.length > 0) {
            setActiveSection(convertedSections[0]);
          }
          
          const updatedData = {
            ...data,
            content: {
              pages: data.content.pages.map((page: DocumentPage) => ({
                ...page,
                content: {
                  sections: page.content.sections.map((s: ApiSection) => convertToApiSection(convertToSection(s)))
                }
              }))
            }
          };
          setDocumentData(updatedData);
        } else {
          setDocumentData(data);
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
  }, [user, params, toast]);


  const addNewSection = (pages: DocumentData['content']['pages'], parentId: string | null, newSection: Section): DocumentData['content']['pages'] => {
    return pages.map(page => ({
      ...page,
      content: {
        sections: !parentId 
          ? [...page.content.sections.map(s => convertToApiSection(convertToSection(s))), convertToApiSection(newSection)]
          : page.content.sections.map(section => {
              const converted = convertToSection(section);
              if (converted.id === parentId) {
                const updated = {
                  ...converted,
                  subsections: [...converted.subsections, newSection]
                };
                return convertToApiSection(updated);
              }
              if (converted.subsections?.length) {
                const updated = {
                  ...converted,
                  subsections: converted.subsections.map(subsection =>
                    subsection.id === parentId
                      ? { ...subsection, subsections: [...subsection.subsections, newSection] }
                      : subsection
                  )
                };
                return convertToApiSection(updated);
              }
              return convertToApiSection(converted);
            })
      }
    }));
  };

  const deleteSectionById = (pages: DocumentData['content']['pages'], sectionId: string): DocumentData['content']['pages'] => {
    return pages.map(page => ({
      ...page,
      content: {
        sections: page.content.sections
          .map(section => {
            const converted = convertToSection(section);
            if (converted.id === sectionId) {
              return null;
            }
            if (converted.subsections?.length) {
              const updated = {
                ...converted,
                subsections: converted.subsections.filter(subsection => subsection.id !== sectionId)
              };
              return convertToApiSection(updated);
            }
            return convertToApiSection(converted);
          })
          .filter(Boolean) as ApiSection[]
      }
    }));
  };

  const handleAddSection = (parentId: string | null) => {
    setNewSectionParentId(parentId);
    setIsNewSectionDialogOpen(true);
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim() || !documentData) return;

    const docId = typeof params.pageName === 'string' ? params.pageName.split('-')[0] : '';
    const newSection: Section = {
      id: generateUniqueId(),
      title: newSectionTitle.trim(),
      level: 1,
      content: '<p>Start writing here...</p>',
      subsections: []
    };

    try {
      const updatedPages = addNewSection(
        documentData.content.pages,
        newSectionParentId,
        newSection
      );

      const updatedDoc = {
        ...documentData,
        content: {
          ...documentData.content,
          pages: updatedPages
        }
      };

      await documentService.updateDocument(docId, updatedDoc);

      setDocumentData(updatedDoc);
      setActiveSection(newSection);
      setNewSectionTitle('');
      setIsNewSectionDialogOpen(false);
      toast({ description: 'Section created successfully' });
    } catch (error) {
      toast({ 
        description: 'Failed to create section', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!documentData) return;
    
    const docId = typeof params.pageName === 'string' ? params.pageName.split('-')[0] : '';

    try {
      const updatedSections = deleteSectionById(
        documentData.content.pages,
        sectionId
      );

      const updatedDoc = {
        ...documentData,
        content: {
          ...documentData.content,
          pages: updatedSections
        }
      };

      await documentService.updateDocument(docId, updatedDoc);
      setDocumentData(updatedDoc);

      if (activeSection?.id === sectionId) {
        const firstSection = updatedSections[0]?.content?.sections[0];
        setActiveSection(firstSection ? convertToSection(firstSection) : null);
      }

      toast({ description: 'Section deleted successfully' });
    } catch (error) {
      toast({ 
        description: 'Failed to delete section', 
        variant: 'destructive' 
      });
    }
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
                    onClick={() => window.history.back()}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="lg:hidden ml-2">
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
          <div className="hidden lg:block w-64 border-r bg-white overflow-hidden">
            <FileTree
              sections={convertedSections}
              activeSection={activeSection}
              onSectionSelect={handleSectionChange}
              onAddSection={handleAddSection}
              onDeleteSection={handleDeleteSection}
            />
          </div>
          
          <main className="flex-1 overflow-y-auto bg-blue-50/30">
            <div className="max-w-5xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow-sm border">
                {editor && <EditorMenuBar editor={editor} />}
                <div className="min-h-[500px] p-3 sm:p-4 bg-blue-50/50 relative">
                  {isSectionLoading ? (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <EditorContent editor={editor} />
                  )}
                </div>
              </div>
            </div>
          </main>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Document Sections</SheetTitle>
              </SheetHeader>
              <div className="h-full">
                <FileTree
                  sections={convertedSections}
                  activeSection={activeSection}
                  onSectionSelect={(section: Section) => {
                    setActiveSection(section);
                    setIsMobileMenuOpen(false);
                  }}
                  onAddSection={handleAddSection}
                  onDeleteSection={handleDeleteSection}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Dialog open={isNewSectionDialogOpen} onOpenChange={setIsNewSectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Section Title</Label>
                <Input
                  id="title"
                  placeholder="Enter section title..."
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewSectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSection}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <InviteDialog 
          isOpen={isInviteOpen} 
          setIsOpen={setIsInviteOpen}
          documentId={`${params.pageName}-${params.uuid}`}
          documentName={params.pageName as string}
        />
      </div>
    </ProtectedRoute>
  );
}