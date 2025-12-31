from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.agents.diagram_agent import build_graph
from app.llm.factory import get_llm_adapter
from app.models import DiagramRequest, DiagramResponse


app = FastAPI(title="NetAI Architect Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/equipment")
def equipment_placeholder():
    return {"message": "Equipment database endpoint - ready for integration"}


@app.post("/api/analyze", response_model=DiagramResponse)
def analyze_architecture(request: DiagramRequest):
    llm = get_llm_adapter()
    graph = build_graph(llm)
    state = {
        "requirements": request.requirements,
        "context": request.context or "",
        "constraints": request.constraints,
        "mermaid": "",
        "summary": "",
    }
    result = graph.invoke(state)
    mermaid = result.get("mermaid", "")
    summary = result.get("summary", "")
    return DiagramResponse(
        mermaid=mermaid,
        summary=summary,
    )


@app.get("/", response_class=HTMLResponse)
def root():
    project_root = Path(__file__).resolve().parents[2]
    frontend_index = project_root / "frontend" / "index.html"
    root_index = project_root / "index.html"
    index_path = frontend_index if frontend_index.exists() else root_index
    if index_path.exists():
        return HTMLResponse(index_path.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>NetAI Architect UI not found.</h1>")
