import React from 'react';
import { ChevronRight, ChevronDown, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  title: string;
  content: string;
  order: number;
  parent_section_id: number | null;
  id: number;
  subsections?: Section[];
}

interface FileTreeProps {
  sections: Section[];
  activeSection: Section | null;
  onSectionSelect: (section: Section) => void;
}

const FileTreeNode: React.FC<{
  section: Section;
  level: number;
  activeSection: Section | null;
  onSectionSelect: (section: Section) => void;
}> = ({ section, level, activeSection, onSectionSelect }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasSubsections = section.subsections && section.subsections.length > 0;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded',
          activeSection?.id === section.id && 'bg-blue-100 hover:bg-blue-100'
        )}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={() => onSectionSelect(section)}
      >
        {hasSubsections ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mr-1 hover:bg-gray-200 rounded p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <File className="h-4 w-4 mr-1" />
        )}
        <span className="truncate text-sm">{section.title}</span>
      </div>
      {hasSubsections && isExpanded && (
        <div>
          {section.subsections!.map((subsection) => (
            <FileTreeNode
              key={subsection.id}
              section={subsection}
              level={level + 1}
              activeSection={activeSection}
              onSectionSelect={onSectionSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({
  sections,
  activeSection,
  onSectionSelect,
}) => {
  // Organize sections into a tree structure
  const buildTree = (sections: Section[]): Section[] => {
    const sectionMap = new Map<number, Section>();
    const rootSections: Section[] = [];

    // First pass: create map of all sections
    sections.forEach((section) => {
      sectionMap.set(section.id, { ...section, subsections: [] });
    });

    // Second pass: build tree structure
    sections.forEach((section) => {
      const processedSection = sectionMap.get(section.id)!;
      if (section.parent_section_id === null) {
        rootSections.push(processedSection);
      } else {
        const parent = sectionMap.get(section.parent_section_id);
        if (parent) {
          if (!parent.subsections) {
            parent.subsections = [];
          }
          parent.subsections.push(processedSection);
        }
      }
    });

    // Sort sections by order
    const sortSections = (sections: Section[]) => {
      sections.sort((a, b) => a.order - b.order);
      sections.forEach((section) => {
        if (section.subsections) {
          sortSections(section.subsections);
        }
      });
    };

    sortSections(rootSections);
    return rootSections;
  };

  const treeData = buildTree(sections);

  return (
    <div className="w-64 bg-white border-r overflow-y-auto h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-2">Document Sections</h3>
        {treeData.map((section) => (
          <FileTreeNode
            key={section.id}
            section={section}
            level={0}
            activeSection={activeSection}
            onSectionSelect={onSectionSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default FileTree; 