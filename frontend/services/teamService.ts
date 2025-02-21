import { 
  Team, 
  CreateTeamRequest, 
  CreateTeamResponse, 
  GetTeamsResponse, 
  APIError 
} from '@/types/team';
import axios, { AxiosError } from 'axios';

interface TeamExistsResponse {
  exists: boolean;
  team_id?: number;
  name?: string;
  created_at?: string;
  message?: string;
}

interface JoinTeamRequest {
  team_id: number;
  user_id: number;
}

class TeamService {
  private static instance: TeamService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/teams`;
  }

  public static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService();
    }
    return TeamService.instance;
  }

  /**
   * Fetches all teams for a given user
   * @param userId - The ID of the user
   * @returns Promise containing the teams data
   */
  public async getTeams(userId: string): Promise<Team[]> {
    try {
      const { data } = await axios.post<GetTeamsResponse>(
        `${this.baseUrl}/my-teams`,
        { user_id: userId }
      );
      // Handle case where data or teams is undefined/null
      if (!data || !data.teams) {
        return [];
      }
      return data.teams;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        // Return empty array for 422 errors as it likely means no teams found
        return [];
      }
      throw this.normalizeError(error);
    }
  }

  /**
   * Creates a new team
   * @param teamData - The team creation data
   * @returns Promise containing the creation response
   */
  public async createTeam(teamData: CreateTeamRequest): Promise<CreateTeamResponse> {
    try {
      const { data } = await axios.post<CreateTeamResponse>(
        `${this.baseUrl}/create`,
        teamData
      );
      return data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Generates an invite link for a team member
   * @param teamId - The ID of the team
   * @param email - The email of the invitee
   * @returns The generated invite link
   */
  public generateInviteLink(teamId: string, email: string): string {
    // Use URL-safe base64 encoding by replacing potentially problematic characters
    const hash = btoa(`${email}:${teamId}`)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `${window.location.origin}/invite/${hash}`;
  }

  /**
   * Validates an invite link and checks if the team exists
   * @param hashedId - The hashed invite ID
   * @param userEmail - The email of the current user
   * @returns Promise containing the validation result and team details
   */
  public async validateInvite(hashedId: string, userEmail: string): Promise<{ 
    isValid: boolean;
    teamName?: string;
    teamId?: number;
    error?: string;
  }> {
    try {
      console.log("Attempting to validate invite with hashedId:", hashedId);
      let decoded;
      try {
        // Add padding to make the length a multiple of 4
        let base64 = hashedId.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        
        decoded = atob(base64);
        console.log("Successfully decoded:", decoded);
      } catch (decodeError) {
        console.error("Failed to decode hashedId:", decodeError);
        return {
          isValid: false,
          error: "Invalid invite link format"
        };
      }
      const [email, teamId] = decoded.split(":");
      console.log("email", email)
      console.log("teamId", teamId)
      console.log("userEmail", userEmail)
      // Validate if the invite is for the logged-in user
      if (email !== userEmail) {
        return {
          isValid: false,
          error: "This invite link is not valid for your account"
        };
      }

      // Check if team exists
      const { data } = await axios.get<TeamExistsResponse>(
        `${this.baseUrl}/exists/${teamId}`
      );

      if (!data.exists) {
        return {
          isValid: false,
          error: "Team not found"
        };
      }

      return {
        isValid: true,
        teamName: data.name,
        teamId: data.team_id
      };

    } catch (error) {
      console.log("error", error)
      return {
        isValid: false,
        error: "Invalid or expired invite link"
      };
    }
  }

  /**
   * Joins a user to a team
   * @param joinData - The data required to join a team
   */
  public async joinTeam(joinData: JoinTeamRequest): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/join`, joinData);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  public async checkTeamExists(teamId: string | number): Promise<TeamExistsResponse> {
    try {
      const { data } = await axios.get<TeamExistsResponse>(
        `${this.baseUrl}/exists/${teamId}`
      );
      if (!data.exists) {
        throw new Error('Team not found');
      }
      return data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private normalizeError(error: unknown): APIError {
    if (error instanceof AxiosError) {
      return {
        message: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
      };
    }

    return {
      message: 'An unexpected error occurred',
    };
  }
}

export const teamService = TeamService.getInstance(); 