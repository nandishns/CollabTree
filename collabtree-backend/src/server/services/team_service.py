from sqlalchemy.orm import Session
from src.server.models.team import Team, TeamMember
from src.server.models.user import User
from src.server.schemas.team import TeamCreate, TeamInvite, JoinTeamRequest
from fastapi import HTTPException
from typing import List, Dict
from sqlalchemy.orm import joinedload
import logging

logger = logging.getLogger(__name__)

class TeamService:
    def __init__(self, db: Session):
        self.db = db

    def check_team_exists(self, team_id: int) -> Dict:
        """Check if a team exists and return basic info"""
        try:
            team = self.db.query(Team).filter(Team.id == team_id).first()
            
            if not team:
                logger.warning(f"Team with ID {team_id} not found")
                return {"exists": False, "message": "Team not found"}
            
            logger.info(f"Team with ID {team_id} exists")
            return {
                "exists": True,
                "team_id": team.id,
                "name": team.name,
                "created_at": team.created_at
            }
        except Exception as e:
            logger.error(f"Error checking team existence: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error checking team: {str(e)}")

    def create_team(self, team_data: TeamCreate, user_id: int) -> Team:
        try:
            team = Team(
                name=team_data.name,
                created_by=user_id
            )
            
            self.db.add(team)
            self.db.flush()  # This will populate team.id
            
            # Add creator as the first team member
            team_member = TeamMember(
                team_id=team.id,
                user_id=user_id
            )
            
            self.db.add(team_member)
            self.db.commit()
            self.db.refresh(team)
            logger.info(f"Successfully created team '{team.name}' with ID {team.id}")
            return team
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create team: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create team: {str(e)}")

    def invite_member(self, invite_data: TeamInvite) -> TeamMember:
        try:
            # Check if team exists
            team = self.db.query(Team).filter(Team.id == invite_data.team_id).first()
            if not team:
                logger.warning(f"Team with ID {invite_data.team_id} not found")
                raise HTTPException(status_code=404, detail="Team not found")

            # Check if user exists
            user = self.db.query(User).filter(User.email == invite_data.email).first()
            if not user:
                logger.warning(f"User with email {invite_data.email} not found")
                raise HTTPException(status_code=404, detail="User not found")

            # Check if user is already a member
            existing_member = self.db.query(TeamMember).filter(
                TeamMember.team_id == invite_data.team_id,
                TeamMember.user_id == user.id
            ).first()
            
            if existing_member:
                logger.warning(f"User {user.email} is already a member of team {team.id}")
                raise HTTPException(status_code=400, detail="User is already a team member")

            team_member = TeamMember(
                team_id=invite_data.team_id,
                user_id=user.id
            )
            
            self.db.add(team_member)
            self.db.commit()
            self.db.refresh(team_member)
            logger.info(f"Successfully added user {user.email} to team {team.id}")
            return team_member
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to invite member: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to invite member: {str(e)}")

    def get_team_members(self, team_id: int) -> List[TeamMember]:
        try:
            team = self.db.query(Team).filter(Team.id == team_id).first()
            if not team:
                logger.warning(f"Team with ID {team_id} not found")
                raise HTTPException(status_code=404, detail="Team not found")

            members = (
                self.db.query(TeamMember)
                .filter(TeamMember.team_id == team_id)
                .join(User)
                .options(joinedload(TeamMember.user))
                .all()
            )
            
            logger.info(f"Successfully retrieved {len(members)} members for team {team_id}")
            return members
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get team members: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get team members: {str(e)}")

    def get_user_teams(self, user_id: int) -> List[Team]:
        """Get all teams that the user is a member of"""
        try:
            teams = (
                self.db.query(Team)
                .join(TeamMember, Team.id == TeamMember.team_id)
                .filter(TeamMember.user_id == user_id)
                .options(
                    joinedload(Team.members).joinedload(TeamMember.user)
                )
                .all()
            )
            
            # Ensure members are loaded
            for team in teams:
                _ = team.members
            
            logger.info(f"Successfully retrieved {len(teams)} teams for user {user_id}")
            return teams
        except Exception as e:
            logger.error(f"Failed to get user teams: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get user teams: {str(e)}")

    def join_team(self, join_data: JoinTeamRequest) -> TeamMember:
        """Join a team with the given team_id and user_id"""
        try:
            # Check if team exists
            team = self.db.query(Team).filter(Team.id == join_data.team_id).first()
            if not team:
                logger.warning(f"Team with ID {join_data.team_id} not found")
                raise HTTPException(status_code=404, detail="Team not found")

            # Check if user exists
            user = self.db.query(User).filter(User.id == join_data.user_id).first()
            if not user:
                logger.warning(f"User with ID {join_data.user_id} not found")
                raise HTTPException(status_code=404, detail="User not found")

            # Check if user is already a member
            existing_member = self.db.query(TeamMember).filter(
                TeamMember.team_id == join_data.team_id,
                TeamMember.user_id == join_data.user_id
            ).first()
            
            if existing_member:
                logger.warning(f"User {user.email} is already a member of team {team.id}")
                raise HTTPException(status_code=400, detail="User is already a team member")

            # Create new team member
            team_member = TeamMember(
                team_id=join_data.team_id,
                user_id=join_data.user_id
            )
            
            self.db.add(team_member)
            self.db.commit()
            self.db.refresh(team_member)
            
            # Load the user relationship for the response
            self.db.refresh(team_member, ['user'])
            
            logger.info(f"Successfully added user {user.email} to team {team.id}")
            return team_member
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to join team: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to join team: {str(e)}") 