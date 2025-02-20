from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.server.database.config import get_db
from src.server.schemas.document import (
    DocumentScrapeRequest,
    DocumentResponse,
    DocumentUpdateRequest,
    DocumentScrapeResponse
)
from src.server.services.document_service import DocumentService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/team/{team_id}", response_model=List[DocumentResponse])
async def get_team_documents(team_id: int, db: Session = Depends(get_db)):
    """
    Get all documents for a team.
    """
    try:
        return DocumentService.get_team_documents(db, team_id)
    except Exception as e:
        logger.error(f"Error in get_team_documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching team documents"
        )

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """
    Get a specific document by ID.
    """
    return DocumentService.get_document(db, document_id)

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(document_id: int, updates: DocumentUpdateRequest, db: Session = Depends(get_db)):
    """
    Update a document's content.
    """
    try:
        return DocumentService.update_document(db, document_id, updates.dict(exclude_unset=True))
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in update_document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating the document"
        )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """
    Delete a document.
    """
    try:
        DocumentService.delete_document(db, document_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in delete_document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting the document"
        ) 