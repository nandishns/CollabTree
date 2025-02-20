from typing import TypeVar, Generic, Dict, Any, Optional, List, Union
from pydantic import BaseModel
from datetime import datetime

DataT = TypeVar('DataT')

class APIResponse(Generic[DataT], BaseModel):
    """Base API response model that can be used across all endpoints"""
    success: bool
    message: str
    data: Optional[DataT] = None
    metadata: Dict[str, Any] = {}
    timestamp: datetime = datetime.utcnow()
    error: Optional[Dict[str, Any]] = None

class PaginatedAPIResponse(APIResponse[List[DataT]], BaseModel):
    """Response model for paginated results"""
    total: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool 