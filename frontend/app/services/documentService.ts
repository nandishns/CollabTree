import axios from 'axios';

interface Section {
  title: string;
  content: string;
  order: number;
  parent_section_id: number | null;
  id: number;
  created_at: string;
  updated_at: string;
}

interface DocumentResponse {
  success: boolean;
  message: string;
  data: {
    title: string;
    url: string;
    content: any;
    id: number;
    team_id: number;
    created_at: string;
    updated_at: string;
    sections: Section[];
  };
  metadata: {
    document_id: number;
    team_id: number;
    sections_count: number;
  };
  timestamp: string;
  error: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const documentService = {
  async getDocument(documentId: string): Promise<DocumentResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch document');
    }
  },

  async updateDocument(documentId: string, data: { title: string; content: any }) {
    try {
      const response = await axios.put(`${API_BASE_URL}/documents/${documentId}`, data);
      console.log(response.data);
      return response.data;
   
    } catch (error) {
      throw new Error('Failed to update document');
    }
  }
}; 