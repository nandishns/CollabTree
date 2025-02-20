from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

class TeamCreate(BaseModel):
    name: str
    created_by: int

class TeamExistsResponse(BaseModel):
    exists: bool
    team_id: Optional[int] = None
    name: Optional[str] = None
    created_at: Optional[datetime] = None
    message: Optional[str] = None

    class Config:
        from_attributes = True

class TeamInvite(BaseModel):
    email: EmailStr
    team_id: int

class JoinTeamRequest(BaseModel):
    team_id: int
    user_id: int

class TeamMemberResponse(BaseModel):
    email: str
    joined_at: datetime

    class Config:
        from_attributes = True

class TeamResponse(BaseModel):
    id: int
    name: str
    created_by: int
    created_at: datetime
    members: List[TeamMemberResponse] = []

    class Config:
        from_attributes = True

class TeamMemberList(BaseModel):
    members: List[TeamMemberResponse]

    class Config:
        from_attributes = True

class UserTeamResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    member_count: int
    members: List[TeamMemberResponse]

    class Config:
        from_attributes = True

class UserTeamsListResponse(BaseModel):
    teams: List[UserTeamResponse]

    class Config:
        from_attributes = True

class MyTeamRequest(BaseModel):
    user_id: int

    class Config:
        from_attributes = True