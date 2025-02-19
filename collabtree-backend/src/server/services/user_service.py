from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.server.models.user import User
from src.server.schemas.user import UserCreate
from src.server.services.auth_service import AuthService
import logging

logger = logging.getLogger(__name__)

class UserService:
    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        try:
            # Check if user already exists
            if db.query(User).filter(User.email == user.email).first():
                logger.warning(f"Attempted to create user with existing email: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )

            # Create new user
            hashed_password = AuthService.get_password_hash(user.password)
            db_user = User(
                email=user.email,
                hashed_password=hashed_password
            )
            
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
            logger.info(f"Successfully created new user with email: {user.email}")
            return db_user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error while creating user"
            )

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                logger.warning(f"Login attempt with non-existent email: {email}")
                return False
                
            if not AuthService.verify_password(password, user.hashed_password):
                logger.warning(f"Failed login attempt for user: {email}")
                return False
                
            logger.info(f"Successful login for user: {email}")
            return user
            
        except Exception as e:
            logger.error(f"Error during authentication: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error during authentication"
            ) 