from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from src.server.models.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Team relationships
    created_teams = relationship("Team", back_populates="creator", lazy="dynamic")
    team_memberships = relationship("TeamMember", back_populates="user", lazy="dynamic") 


