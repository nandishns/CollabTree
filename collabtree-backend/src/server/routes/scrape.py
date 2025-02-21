import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from src.server.database.config import get_db
from src.server.services.document_service import DocumentService
from src.server.schemas.document import (
    DocumentScrapeRequest,
    ScrapedPage,
    DocumentResponse,
    DocumentBase
)
from src.server.services.scraping_service import ScrapingService
from src.server.schemas.base import APIResponse
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/scrape_site", response_model=APIResponse[DocumentResponse])
async def scrape_site_endpoint(
    request: DocumentScrapeRequest,
    db: Session = Depends(get_db)
):
    """
    Scrapes the site and stores all content in a single document.
    """
    logger.debug(f"Received scrape request: {request.dict()}")
    try:
        results = ScrapingService.scrape_site(request.url, request.max_pages)
        
        if not results or len(results) == 0:
            return APIResponse(
                success=False,
                message="No content was scraped from the URL",
                error={
                    "type": "scraping_error",
                    "detail": "No content could be extracted from the provided URL"
                }
            )

        # Format all pages into a single document
        formatted_data = {
            "url": str(request.url),
            "title": request.document_name,
            "content": {
                "pages": results,
                "total_pages": len(results),
                "base_url": str(request.url)
            },
            "raw_html": ""  # Optional, can be empty
        }
        
        # Store everything in a single document
        document = DocumentService.store_scraped_data(
            db=db,
            team_id=request.team_id,
            user_id=request.user_id,
            document_name=request.document_name,
            scraped_data=formatted_data
        )

        # Convert SQLAlchemy model to Pydantic model
        document_response = DocumentResponse.model_validate(document)

        return APIResponse(
            success=True,
            message=f"Successfully scraped {len(results)} pages and stored as a single document",
            data=document_response,
            metadata={
                "team_id": request.team_id,
                "user_id": request.user_id,
                "document_name": request.document_name,
                "url": str(request.url),
                "scraped_at": datetime.utcnow(),
                "pages_found": len(results)
            }
        )
            
    except Exception as e:
        logger.error(f"Error in scrape_site_endpoint: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to scrape site",
            error={
                "type": "scraping_error",
                "detail": str(e)
            }
        )