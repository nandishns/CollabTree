export interface TeamMember {
  id: number;
  email: string;
  name?: string;
  joined_at?: string;
}

export interface Team {
  id: number;
  name: string;
  created_at: string;
  member_count: number;
  members: TeamMember[];
}

export interface CreateTeamRequest {
  name: string;
  created_by: string;
}

export interface CreateTeamResponse {
  message: string;
  team?: Team;
}

export interface GetTeamsResponse {
  teams: Team[];
}

export interface APIError {
  message: string;
  status?: number;
} 