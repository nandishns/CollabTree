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
from fastapi.encoders import jsonable_encoder

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/scrape_site", response_model=APIResponse[DocumentResponse])
async def scrape_site_endpoint(
    request: DocumentScrapeRequest,
    db: Session = Depends(get_db)
):
    """
    Scrapes the site starting from `start_url` and returns up to `max_pages` pages of content.
    """
    logger.debug(f"Received scrape request: {request.dict()}")
    try:
        max_pages = 50
        results = ScrapingService.scrape_site(request.url,max_pages)
        
        # Format the first page result for storage
        if not results or len(results) == 0:
            return APIResponse(
                success=False,
                message="No content was scraped from the URL",
                error={
                    "type": "scraping_error",
                    "detail": "No content could be extracted from the provided URL"
                }
            )

        first_page = results[0]  # Take the first page
        formatted_data = {
            "url": str(request.url),
            "title": first_page.get("title", "Untitled Document"),
            "content": first_page.get("content", {}),
            "raw_html": ""  # Optional, can be empty
        }
        
        # save results to db
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
            message="Site scraped and document stored successfully",
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