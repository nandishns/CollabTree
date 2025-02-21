"use client";

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import FileTree from '@/app/components/FileTree';
import { transformApiResponse } from '@/app/utils/transformData';

// Sample response data
const sampleResponse = {
  success: true,
  message: "Team documents retrieved successfully",
  data: [
    {
      title: "What is Mixpanel?",
      content: {
        sections: [
          {
            title: "Overview",
            level: 1,
            content: "<h1>Mixpanel Overview</h1><p>Mixpanel will help you better understand your customers...</p>",
            subsections: [
              {
                title: "Getting Started",
                level: 2,
                content: "<h2>Getting Started</h2><p>Start with these basic steps...</p>",
                subsections: []
              },
              {
                title: "Key Features",
                level: 2,
                content: "<h2>Key Features</h2><p>Explore our main features...</p>",
                subsections: [
                  {
                    title: "Analytics",
                    level: 3,
                    content: "<h3>Analytics</h3><p>Deep dive into analytics...</p>",
                    subsections: []
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ],
  metadata: {},
  timestamp: "2024-02-20T16:57:09.475634",
  error: {}
};

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<any>(null);
  const transformedData = transformApiResponse(sampleResponse);

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
    ],
    content: activeSection?.content || '',
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none max-w-none',
      },
    },
  });

  // Update editor content when active section changes
  if (editor && activeSection?.content !== editor.getHTML()) {
    editor.commands.setContent(activeSection?.content || '');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4">Document Structure</h2>
              <FileTree 
                data={transformedData} 
                onSelect={setActiveSection}
                activeSection={activeSection}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {activeSection ? (
                <>
                  <h1 className="text-2xl font-bold mb-6">{activeSection.title}</h1>
                  <div className="prose-container">
                    <EditorContent editor={editor} />
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <p>Select a section from the sidebar to view its content</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 