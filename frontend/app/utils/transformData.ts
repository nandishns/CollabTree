interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
  metadata: Record<string, any>;
  timestamp: string;
  error: Record<string, any>;
}

interface Section {
  title: string;
  level: number;
  content: string;
  subsections: Section[];
}

export const transformApiResponse = (response: ApiResponse): Section[] => {
  if (!response.data || typeof response.data !== 'object') {
    return [];
  }

  const transformContent = (content: any, level: number = 1): Section[] => {
    if (!content) return [];

    if (Array.isArray(content)) {
      return content.map(item => ({
        title: item.title || 'Untitled',
        level,
        content: item.content || '',
        subsections: item.content?.sections 
          ? transformContent(item.content.sections, level + 1)
          : []
      }));
    }

    if (content.sections) {
      return content.sections.map((section: any) => ({
        title: section.title || 'Untitled',
        level,
        content: section.content || '',
        subsections: section.subsections 
          ? transformContent(section.subsections, level + 1)
          : []
      }));
    }

    return [];
  };

  return transformContent(response.data);
};

export const flattenSections = (sections: Section[]): Section[] => {
  const flattened: Section[] = [];
  
  const flatten = (items: Section[]) => {
    items.forEach(item => {
      flattened.push(item);
      if (item.subsections && item.subsections.length > 0) {
        flatten(item.subsections);
      }
    });
  };

  flatten(sections);
  return flattened;
}; 