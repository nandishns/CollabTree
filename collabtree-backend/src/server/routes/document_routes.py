from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.server.database.config import get_db
from src.server.schemas.document import (
    DocumentScrapeRequest,
    DocumentResponse,
    DocumentUpdateRequest,
    DocumentScrapeResponse,
    StoreScrapedDataRequest
)
from src.server.schemas.base import APIResponse
from src.server.services.document_service import DocumentService
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/team/{team_id}", response_model=APIResponse[List[DocumentResponse]])
async def get_team_documents(team_id: int, db: Session = Depends(get_db)):
    """
    Get all documents for a team.
    """
    try:
        documents = DocumentService.get_team_documents(db, team_id)
        # Convert SQLAlchemy models to Pydantic models
        document_responses = [DocumentResponse.model_validate(doc) for doc in documents]
        return APIResponse(
            success=True,
            message="Team documents retrieved successfully",
            data=document_responses,
            metadata={
                "team_id": team_id,
                "document_count": len(documents),
                "retrieved_at": datetime.utcnow()
            }
        )
    except Exception as e:
        logger.error(f"Error in get_team_documents: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to fetch team documents",
            error={
                "type": "internal_error",
                "detail": str(e)
            }
        )

@router.get("/{document_id}", response_model=APIResponse[DocumentResponse])
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """
    Get a specific document by ID.
    """
    try:
        document = DocumentService.get_document(db, document_id)
        # Convert SQLAlchemy model to Pydantic model
        document_response = DocumentResponse.model_validate(document)
        return APIResponse(
            success=True,
            message="Document retrieved successfully",
            data=document_response,
            metadata={
                "document_id": document_id,
                "team_id": document.team_id,
                "sections_count": len(document.sections)
            }
        )
    except HTTPException as e:
        return APIResponse(
            success=False,
            message=str(e.detail),
            error={
                "type": "not_found" if e.status_code == 404 else "internal_error",
                "detail": str(e.detail)
            }
        )
    except Exception as e:
        logger.error(f"Error in get_document: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to fetch document",
            error={
                "type": "internal_error",
                "detail": str(e)
            }
        )

@router.put("/{document_id}", response_model=APIResponse[DocumentResponse])
async def update_document(document_id: int, updates: DocumentUpdateRequest, db: Session = Depends(get_db)):
    """
    Update a document's content.
    """
    try:
        updated_document = DocumentService.update_document(db, document_id, updates.dict(exclude_unset=True))
        # Convert SQLAlchemy model to Pydantic model
        document_response = DocumentResponse.model_validate(updated_document)
        return APIResponse(
            success=True,
            message="Document updated successfully",
            data=document_response,
            metadata={
                "document_id": document_id,
                "updated_fields": [k for k, v in updates.dict(exclude_unset=True).items()],
                "updated_at": datetime.utcnow()
            }
        )
    except HTTPException as e:
        return APIResponse(
            success=False,
            message=str(e.detail),
            error={
                "type": "not_found" if e.status_code == 404 else "internal_error",
                "detail": str(e.detail)
            }
        )
    except Exception as e:
        logger.error(f"Error in update_document: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to update document",
            error={
                "type": "internal_error",
                "detail": str(e)
            }
        )

@router.delete("/{document_id}", response_model=APIResponse[None])
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """
    Delete a document.
    """
    try:
        DocumentService.delete_document(db, document_id)
        return APIResponse(
            success=True,
            message="Document deleted successfully",
            metadata={
                "deleted_document_id": document_id,
                "deleted_at": datetime.utcnow()
            }
        )
    except HTTPException as e:
        return APIResponse(
            success=False,
            message=str(e.detail),
            error={
                "type": "not_found" if e.status_code == 404 else "internal_error",
                "detail": str(e.detail)
            }
        )
    except Exception as e:
        logger.error(f"Error in delete_document: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to delete document",
            error={
                "type": "internal_error",
                "detail": str(e)
            }
        )

@router.post("/store-scraped", response_model=APIResponse[DocumentResponse])
async def store_scraped_data(request: StoreScrapedDataRequest, db: Session = Depends(get_db)):
    """
    Store already scraped data as a new document.
    """
    try:
        document = DocumentService.store_scraped_data(
            db=db,
            team_id=request.team_id,
            user_id=request.user_id,
            document_name=request.document_name,
            scraped_data=request.scraped_data
        )
        # Convert SQLAlchemy model to Pydantic model
        document_response = DocumentResponse.model_validate(document)
        return APIResponse(
            success=True,
            message="Scraped data stored successfully",
            data=document_response,
            metadata={
                "team_id": request.team_id,
                "user_id": request.user_id,
                "document_name": request.document_name,
                "created_at": datetime.utcnow()
            }
        )
    except HTTPException as e:
        return APIResponse(
            success=False,
            message=str(e.detail),
            error={
                "type": "validation_error" if e.status_code == 400 else "internal_error",
                "detail": str(e.detail)
            }
        )
    except Exception as e:
        logger.error(f"Error in store_scraped_data: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to store scraped data",
            error={
                "type": "internal_error",
                "detail": str(e)
            }
        ) 