CollabTree: Real-time Document Collaboration

CollabTree is a full-stack application that allows teams to create, edit, and manage documents in real time. Users can invite teammates, scrape website content, and collaboratively edit documents using a rich text editor powered by Tiptap.

Table of Contents
	1.	Features
	2.	Tech Stack
	3.	Folder Structure
	4.	Getting Started
	•	Prerequisites
	•	Installation & Setup
	•	Running the Application
	5.	Usage
	•	Authentication & Teams
	•	Workspaces & Documents
	•	Real-Time Collaboration
	6.	API Endpoints
	7.	Contributing
	8.	License

Features
	•	User Registration & Authentication (JWT)
Secure sign-up and login using JSON Web Tokens.
	•	Team Management
	•	Create teams, invite members via email, and manage multiple teams.
	•	View and manage your teammates.
	•	Website Scraping
	•	Enter any link to scrape its content (e.g., HTML docs) on the backend using BeautifulSoup.
	•	Automatically parse and store data for further editing.
	•	Document Editor (Tiptap)
	•	Rich text editor powered by Tiptap Starter Kit.
	•	Supports formatting, embedding, and structured editing.
	•	Real-Time Collaboration
	•	Automatic syncing of document content across all team members’ browsers via a WebSocket service.
	•	Changes are reflected instantly in every connected session.
	•	Auto-Save
	•	Edits are saved automatically to the backend, preventing data loss and ensuring content is always up-to-date.

Tech Stack
	•	Frontend: Next.js with Tiptap
	•	Backend: FastAPI
	•	WebSocket Service: HocusPocus WebSocket server for real-time collaboration
	•	Scraping Library: BeautifulSoup and requests
	•	Database & Caching: PostgreSQL, sqlite
	•	Deployment & Containerization: Docker

Folder Structure

.
├── HocusPocusWebSocket-Service/   # Service handling real-time collaboration via WebSockets
├── collabtree-backend/           # FastAPI backend for authentication, scraping, and document APIs
├── frontend/                     # Next.js (React) application with Tiptap editor
└── .gitignore

	1.	HocusPocusWebSocket-Service
	•	Contains WebSocket server code (using HocusPocus or a custom Socket.IO-like approach).
	•	Handles real-time content updates and broadcasts to connected clients.
	2.	collabtree-backend
	•	FastAPI application.
	•	Manages user authentication (JWT), team invites, scraping endpoints, data persistence, etc.
	3.	frontend
	•	Next.js pages for signup, login, workspace listing, and Tiptap editor views.
	•	Manages user interactions, file tree rendering, invites, and real-time updates via WebSockets.

Getting Started

Prerequisites
	•	Node.js v16+
	•	Python 3.9+
	•	Poetry or pip (for installing Python dependencies)
	•	Docker

Installation & Setup
	1.	Clone the Repository

git clone https://github.com/nandishns/CollabTree
cd collabtree


	2.	Install Backend Dependencies

cd collabtree-backend
pip install -r requirements.txt
# or if you use Poetry
poetry install


	3.	Install Frontend Dependencies

cd ../frontend
npm install
# or
yarn


	4.	Install WebSocket Service Dependencies

cd ../HocusPocusWebSocket-Service
npm install
# or yarn



	Make sure to configure your environment variables (for JWT secrets, DB connections, etc.) as needed in each service folder.

Running the Application

Option A: Manual (Local) Run
	1.	Run the Backend (FastAPI)

cd collabtree-backend
uvicorn main:app --host 0.0.0.0 --port 8000

	•	Your backend API will be available at http://localhost:8000.

	2.	Run the WebSocket Service

cd HocusPocusWebSocket-Service
npm run start

	•	Typically runs on ws://0.0.0.0:80 or whichever port you configured.

	3.	Run the Frontend (Next.js)

cd frontend
npm run dev

	•	Visit http://localhost:3000 to access the web interface.

Option B: Docker / Docker-Compose
	•	If you have a docker-compose.yml file set up, simply run:

docker-compose up --build


	•	Confirm all containers (backend, frontend, websocket, DB, etc.) are running properly.

Usage

Authentication & Teams
	1.	Sign Up
	•	Visit the signup page to create a new account.
	2.	Create or Join Teams
	•	After logging in, you can create a new team or accept invites to existing teams.
	3.	Invite Members
	•	Invite teammates by entering their email addresses. They’ll receive an invite link that allows them to join your team.

Workspaces & Documents
	•	Each team has a Workspace. You can create new documents by providing a URL to scrape:
	1.	Go to Workspace page.
	2.	Enter a link to scrape in the input field.
	3.	The backend uses BeautifulSoup to parse the site and store its content.
	4.	A new document is created and is now editable via Tiptap.
	•	View all documents in a File Tree structure on the left panel. Click on a document to load its content on the right, where you can edit.

Real-Time Collaboration
	•	Multiple team members can open the same document simultaneously.
	•	Edits appear in near real time thanks to the WebSocket connection.
	•	The content auto-saves periodically, ensuring no changes are lost.

API Endpoints
- https://collabtree-production.up.railway.app/docs

---

Thank you.