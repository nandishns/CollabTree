from sqlalchemy.orm import Session
import logging
from typing import Dict, Any, List
from src.server.models.document import Document, DocumentSection
from src.server.models.team import Team
from src.server.services.scraping_service import ScrapingService
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    def create_document_from_url(db: Session, team_id: int, url: str) -> Document:
        """Create a new document by scraping the given URL."""
        # Verify team exists
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Team with id {team_id} not found"
            )
        
        # Check if document with this URL already exists for the team
        existing_doc = db.query(Document).filter(
            Document.team_id == team_id,
            Document.url == url
        ).first()
        
        if existing_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document with URL {url} already exists for this team"
            )
        
        try:
            # Scrape the URL
            structured_content, raw_html = ScrapingService.scrape_url(url)
            
            # Create document
            document = Document(
                team_id=team_id,
                title=structured_content["title"],
                url=url,
                content=structured_content["content"],
                raw_html=raw_html
            )
            
            db.add(document)
            db.commit()
            db.refresh(document)
            
            # Create sections
            DocumentService._create_sections(db, document, structured_content["content"]["sections"])
            
            logger.info(f"Successfully created document from URL: {url}")
            return document
            
        except ValueError as e:
            logger.error(f"Error creating document: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Unexpected error creating document: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while creating the document"
            )
    
    @staticmethod
    def _create_sections(db: Session, document: Document, sections: List[Dict[str, Any]], parent_id: int = None, order: int = 0) -> None:
        """Recursively create document sections."""
        for section in sections:
            # Create section
            doc_section = DocumentSection(
                document_id=document.id,
                parent_section_id=parent_id,
                title=section["title"],
                content=section["content"],
                order=order
            )
            db.add(doc_section)
            db.commit()
            db.refresh(doc_section)
            
            # Create subsections recursively
            if section.get("subsections"):
                DocumentService._create_sections(
                    db,
                    document,
                    section["subsections"],
                    doc_section.id,
                    0
                )
            order += 1
    
    @staticmethod
    def get_team_documents(db: Session, team_id: int) -> List[Document]:
        """Get all documents for a team."""
        return db.query(Document).filter(Document.team_id == team_id).all()
    
    @staticmethod
    def get_document(db: Session, document_id: int) -> Document:
        """Get a specific document by ID."""
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with id {document_id} not found"
            )
        return document
    
    @staticmethod
    def update_document(db: Session, document_id: int, updates: Dict[str, Any]) -> Document:
        """Update a document's content."""
        document = DocumentService.get_document(db, document_id)
        
        for key, value in updates.items():
            if hasattr(document, key):
                setattr(document, key, value)
        
        db.commit()
        db.refresh(document)
        return document
    
    @staticmethod
    def delete_document(db: Session, document_id: int) -> None:
        """Delete a document."""
        document = DocumentService.get_document(db, document_id)
        db.delete(document)
        db.commit() 