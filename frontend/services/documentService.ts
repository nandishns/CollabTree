import axios from 'axios';

interface Document {
  id: number;
  title: string;
  url: string;
  content: any;
  team_id: number;
  created_at: string;
  updated_at: string;
  sections: any[];
}

interface ScrapeResponse {
  id: number;
  // Add other response fields as needed
}

class DocumentService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL;

  async getTeamDocuments(teamId: string | number): Promise<Document[]> {
    try {
      const response = await axios.get<{ data: Document[] }>(`${this.baseUrl}/documents/team/${teamId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching team documents:', error);
      throw error;
    }
  }

  async scrapeDocument(params: {
    url: string;
    team_id: number;
    user_id: number;
    document_name: string;
  }): Promise<ScrapeResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/scrape/scrape_site`, params);
      return response.data;
    } catch (error) {
      console.error('Error scraping document:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const documentService = new DocumentService(); 