
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
import logging

logger = logging.getLogger(__name__)

class ScrapingService:
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text content."""
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    @staticmethod
    def extract_title(soup: BeautifulSoup, url: str) -> str:
        """Extract the title of the page."""
        title = soup.find('h1')
        if title:
            return ScrapingService.clean_text(title.get_text())
        
        title = soup.find('title')
        if title:
            return ScrapingService.clean_text(title.get_text())
        
        # Fallback to URL-based title
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.split('/')
        return path_parts[-1].replace('-', ' ').replace('_', ' ').title() or parsed_url.netloc

    @staticmethod
    def extract_content(soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract content in a hierarchical structure."""
        content = {
            "sections": [],
            "metadata": {}
        }
        
        main_content = (soup.find(['main', 'article']) or
                        soup.find('div', {'class': re.compile(r'content|main|article', re.I)}))
        if not main_content:
            main_content = soup
        
        headings = main_content.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        current_section = None
        
        for heading in headings:
            level = int(heading.name[1])  # Get heading level (1-6)
            title = ScrapingService.clean_text(heading.get_text())
            
            content_elements = []
            current = heading.next_sibling
            while current and not (isinstance(current, type(heading)) and current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                if hasattr(current, 'get_text'):
                    text = ScrapingService.clean_text(current.get_text())
                    if text:
                        content_elements.append(text)
                current = current.next_sibling
            
            section = {
                "title": title,
                "level": level,
                "content": " ".join(content_elements),
                "subsections": []
            }
            
            if not current_section or level <= current_section["level"]:
                content["sections"].append(section)
                current_section = section
            else:
                current_section["subsections"].append(section)
        
        return content

    @staticmethod
    def scrape_url(url: str) -> Dict[str, Any]:
        """
        Scrape content from the given URL.
        Returns a dict with keys: title, url, and content.
        """
        logger.info(f"Starting to scrape URL: {url}")
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                              '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            raw_html = response.text
            soup = BeautifulSoup(raw_html, 'html.parser')
            
            title = ScrapingService.extract_title(soup, url)
            content = ScrapingService.extract_content(soup)
            
            return {
                "title": title,
                "url": url,
                "content": content
            }
        except requests.RequestException as e:
            logger.error(f"Error scraping URL {url}: {str(e)}")
            raise ValueError(f"Failed to scrape URL: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error while scraping {url}: {str(e)}")
            raise ValueError(f"Failed to process content: {str(e)}")

    @staticmethod
    def scrape_site(start_url: str, max_pages: int = 50) -> List[Dict[str, Any]]:
        """
        Crawl from the start_url, scraping each page and following internal links.
        Returns a list of all scraped pages (dicts) up to max_pages.
        """
        visited = set()
        to_visit = [start_url]
        all_scraped = []

        def is_same_domain(base: str, target: str) -> bool:
            return urlparse(base).netloc == urlparse(target).netloc

        while to_visit and len(visited) < max_pages:
            current_url = to_visit.pop(0)
            if current_url in visited:
                continue

            visited.add(current_url)
            logger.info(f"Crawling: {current_url}")
            
            try:
                page_data = ScrapingService.scrape_url(current_url)
                all_scraped.append(page_data)
                
                # Parse the HTML again to find new links
                soup = BeautifulSoup(requests.get(current_url).text, 'html.parser')
                for link_tag in soup.find_all('a', href=True):
                    absolute_link = urljoin(current_url, link_tag['href'])
                    
                    # Normalize link (remove fragment, query, etc.)
                    parsed = urlparse(absolute_link)
                    normalized_link = parsed._replace(fragment="", query="").geturl()
                    
                    if is_same_domain(start_url, normalized_link):
                        if normalized_link not in visited:
                            to_visit.append(normalized_link)
            
            except ValueError as e:
                logger.error(f"Skipping {current_url}: {e}")
                continue

        return all_scraped
