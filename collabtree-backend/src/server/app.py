from fastapi import FastAPI, logger
from fastapi.middleware.cors import CORSMiddleware
import logging, sys
from src.utils.utils import read_markdown_file
from src.server.routes.home import router as home_router
from src.server.routes.auth import router as auth_router
from src.server.database.config import engine, create_tables
from src.server.models import user

readme_content = read_markdown_file("README.md")

logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create database tables
user.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CollabTree",
    description=(lambda: readme_content if isinstance(readme_content, str) else "")(),
    version="1.0.0",
)

@app.on_event("startup")
async def sync_database():
    logger.debug("starting up...")

# Create database tables on startup
create_tables()

app.include_router(home_router, tags=["Home"])
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

