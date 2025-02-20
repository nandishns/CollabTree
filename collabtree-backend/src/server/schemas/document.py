from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import List, Optional, Dict, Any

class DocumentScrapeRequest(BaseModel):
    url: HttpUrl
    team_id: int

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

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True

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