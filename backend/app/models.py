from typing import List, Optional

from pydantic import BaseModel, Field


class DiagramRequest(BaseModel):
    requirements: str = Field(..., min_length=1)
    context: Optional[str] = None
    constraints: List[str] = Field(default_factory=list)


class DiagramResponse(BaseModel):
    mermaid: str
    summary: str
