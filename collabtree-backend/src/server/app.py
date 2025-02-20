from fastapi import FastAPI, logger
from fastapi.middleware.cors import CORSMiddleware
import logging, sys
from src.utils.utils import read_markdown_file
from src.server.routes.home import router as home_router
from src.server.routes.auth import router as auth_router
from src.server.routes.team_routes import router as team_router
from src.server.routes.document_routes import router as document_router
from src.server.database.config import engine
from src.server.models.base import Base
from src.server.models import user, team, document
from src.server.routes.scrape import router as scrape_router
readme_content = read_markdown_file("README.md")

logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CollabTree",
    description=(lambda: readme_content if isinstance(readme_content, str) else "")(),
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(home_router, prefix="", tags=["home"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(team_router, prefix="/teams", tags=["teams"])
app.include_router(scrape_router, prefix="/scrape", tags=["scrape"])
app.include_router(document_router, prefix="/documents", tags=["documents"])

@app.on_event("startup")
async def sync_database():
    logger.debug("starting up...")

