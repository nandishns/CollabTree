from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.server.database.config import get_db
from src.server.services.team_service import TeamService
from src.server.schemas.team import (
    TeamCreate, TeamInvite, TeamResponse, TeamMemberList, 
    TeamMemberResponse, UserTeamResponse, UserTeamsListResponse,
    MyTeamRequest, JoinTeamRequest, TeamExistsResponse
)
from typing import List
from src.server.services.auth_service import get_current_user
from src.server.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["teams"])

@router.post("/create", response_model=TeamResponse)
async def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    """Create a new team with the current user as the creator and first member"""
    logger.info(f"Attempting to create team '{team_data.name}' for user {team_data.created_by}")
    team_service = TeamService(db)
    try:
        team = team_service.create_team(team_data, team_data.created_by)
        logger.info(f"Team '{team.name}' created successfully with ID {team.id}")
        return TeamResponse(
            id=team.id,
            name=team.name,
            created_by=team.created_by,
            created_at=team.created_at,
            members=[
                TeamMemberResponse(
                    email=member.user.email,
                    joined_at=member.joined_at
                ) for member in team.members
            ]
        )
    except HTTPException as he:
        logger.error(f"HTTP error while creating team: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error while creating team: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/invite", response_model=TeamMemberResponse)
async def invite_team_member(
    invite_data: TeamInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Invite a user to join a team"""
    logger.info(f"Attempting to invite user {invite_data.email} to team {invite_data.team_id}")
    team_service = TeamService(db)
    try:
        team_member = team_service.invite_member(invite_data)
        logger.info(f"Successfully invited user {invite_data.email} to team {invite_data.team_id}")
        return TeamMemberResponse(
            email=team_member.user.email,
            joined_at=team_member.joined_at
        )
    except HTTPException as he:
        logger.error(f"HTTP error while inviting member: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error while inviting member: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/my-teams", response_model=UserTeamsListResponse)
async def get_user_teams(
    form_data: MyTeamRequest,
    db: Session = Depends(get_db)
):
    """Get all teams created by the current user with their members"""
    logger.info(f"Fetching teams for user {form_data.user_id}")
    team_service = TeamService(db)
    try:
        teams = team_service.get_user_teams(form_data.user_id)
        response = UserTeamsListResponse(
            teams=[
                UserTeamResponse(
                    id=team.id,
                    name=team.name,
                    created_at=team.created_at,
                    member_count=len(team.members),
                    members=[
                        TeamMemberResponse(
                            email=member.user.email,
                            joined_at=member.joined_at
                        ) for member in team.members
                    ]
                ) for team in teams
            ]
        )
        logger.info(f"Successfully retrieved {len(teams)} teams for user {form_data.user_id}")
        return response
    except HTTPException as he:
        logger.error(f"HTTP error while fetching user teams: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error while fetching user teams: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{team_id}/members", response_model=TeamMemberList)
async def get_team_members(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all members of a team"""
    logger.info(f"Fetching members for team {team_id}")
    team_service = TeamService(db)
    try:
        members = team_service.get_team_members(team_id)
        response = TeamMemberList(
            members=[
                TeamMemberResponse(
                    email=member.user.email,
                    joined_at=member.joined_at
                ) for member in members
            ]
        )
        logger.info(f"Successfully retrieved {len(members)} members for team {team_id}")
        return response
    except HTTPException as he:
        logger.error(f"HTTP error while fetching team members: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error while fetching team members: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/join", response_model=TeamMemberResponse)
async def join_team(
    join_data: JoinTeamRequest,
    db: Session = Depends(get_db)
):
    """Join a team with the given team_id and user_id"""
    logger.info(f"Attempting to add user {join_data.user_id} to team {join_data.team_id}")
    team_service = TeamService(db)
    try:
        team_member = team_service.join_team(join_data)
        logger.info(f"Successfully added user to team {join_data.team_id}")
        return TeamMemberResponse(
            email=team_member.user.email,
            joined_at=team_member.joined_at
        )
    except HTTPException as he:
        logger.error(f"HTTP error while joining team: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error while joining team: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exists/{team_id}", response_model=TeamExistsResponse)
async def check_team_exists(
    team_id: int,
    db: Session = Depends(get_db)
):
    """Check if a team exists by team_id"""
    logger.info(f"Checking if team {team_id} exists")
    team_service = TeamService(db)
    try:
        result = team_service.check_team_exists(team_id)
        return TeamExistsResponse(**result)
    except HTTPException as he:
        logger.error(f"HTTP error while checking team: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error while checking team: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 