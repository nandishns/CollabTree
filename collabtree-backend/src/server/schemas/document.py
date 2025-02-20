from pydantic import BaseModel, HttpUrl, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any

class DocumentScrapeRequest(BaseModel):
    url: str
    team_id: int
    user_id: int
    document_name: str
    max_pages: int = 50

class DocumentSectionBase(BaseModel):
    title: str
    content: str
    order: int
    parent_section_id: Optional[int] = None

class DocumentSectionCreate(DocumentSectionBase):
    document_id: int

class DocumentSectionResponse(DocumentSectionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentBase(BaseModel):
    title: str
    url: str
    content: Dict[str, Any]

class DocumentCreate(DocumentBase):
    team_id: int
    raw_html: str

class DocumentResponse(DocumentBase):
    id: int
    team_id: int
    created_at: datetime
    updated_at: datetime
    sections: List[DocumentSectionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class DocumentUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None

class DocumentScrapeResponse(BaseModel):
    message: str
    document: DocumentResponse

class Section(BaseModel):
    title: str
    level: int
    content: str
    subsections: List['Section'] = []

# Forward reference for recursive model
Section.update_forward_refs()

class Content(BaseModel):
    sections: List[Section]
    metadata: Dict[str, Any]

class ScrapedPage(BaseModel):
    title: str
    url: str
    content: Content

class StoreScrapedDataRequest(BaseModel):
    team_id: int
    user_id: int
    document_name: str
    scraped_data: Dict[str, Any]