import logging


logger = logging.getLogger(__name__)


def read_markdown_file(file_path: str):
    """
  Reads the content of a Markdown file and returns it.

  :param file_path: Path to the Markdown file.
  :return: String content of the file.
  """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        logger.error(f"The file {file_path} was not found.")
        return None