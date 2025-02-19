from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# this is the Alembic Config object
config = context.config

# Set the database URL in the alembic configuration
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

# add your model's MetaData object here
from src.server.models.user import Base
target_metadata = Base.metadata

# rest of the file remains the same... 