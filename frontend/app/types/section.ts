export interface Section {
  id: string;
  title: string;
  level: number;
  content: string;
  subsections: Section[];
} 