import logging
from fastapi import APIRouter, HTTPException
from typing import List
from src.server.schemas.document import ScrapedPage
from src.server.services.scraping_service import ScrapingService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/scrape_site", response_model=List[ScrapedPage])
def scrape_site_endpoint(start_url: str, max_pages: int = 50):
    """
    Scrapes the site starting from `start_url` and returns up to `max_pages` pages of content.
    """
    try:
        results = ScrapingService.scrape_site(start_url, max_pages)
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))