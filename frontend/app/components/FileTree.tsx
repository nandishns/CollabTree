import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Trash, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Section } from '@/app/types/section';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface FileTreeProps {
  sections: Section[];
  level?: number;
  onSectionSelect?: (section: Section) => void;
  onAddSection?: (parentId: string | null) => void;
  onDeleteSection?: (sectionId: string) => void;
  activeSection?: Section | null;
}

const FileTree: React.FC<FileTreeProps> = ({ 
  sections, 
  level = 0, 
  onSectionSelect,
  onAddSection,
  onDeleteSection,
  activeSection 
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelect = (section: Section) => {
    if (onSectionSelect) {
      onSectionSelect(section);
    }
  };

  const handleAddSection = (parentId: string | null = null) => {
    if (onAddSection) {
      onAddSection(parentId);
    }
  };

  const handleDeleteSection = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteSection) {
      onDeleteSection(sectionId);
    }
  };

  const renderSection = (section: Section, level: number) => {
    const isExpanded = expandedItems[section.id] ?? true;
    const hasSubsections = section.subsections && section.subsections.length > 0;

    return (
      <div key={section.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                'flex items-center py-1.5 px-2 hover:bg-gray-100 cursor-pointer rounded group transition-colors duration-150',
                activeSection?.id === section.id && 'bg-blue-100 hover:bg-blue-200'
              )}
              style={{ paddingLeft: `${level * 12}px` }}
              onClick={() => handleSelect(section)}
            >
              {hasSubsections && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(section.id);
                  }}
                  className="mr-1 hover:bg-gray-200 rounded p-0.5"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasSubsections && <File className="h-4 w-4 mr-1 text-gray-400" />}
              <span className="flex-1 truncate text-sm">{section.title}</span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-200 hover:text-red-600"
                  onClick={(e) => handleDeleteSection(section.id, e)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={(e) => handleDeleteSection(section.id, e as any)}>
              Delete Section
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {hasSubsections && isExpanded && (
          <div>
            {section.subsections.map(subsection => renderSection(subsection, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-medium text-gray-700">Sections</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 hover:bg-gray-100"
          onClick={() => handleAddSection(null)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-y-auto flex-1 p-2">
        <div className="space-y-0.5">
          {sections.map(section => renderSection(section, 0))}
        </div>
      </div>
    </div>
  );
};

export default FileTree; 