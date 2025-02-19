# Allo Health Clinic Queue Management System

A modern web application for managing patient queues and appointments at Allo Health Clinic. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Queue Management**
  - Add patients to queue with priority levels
  - Update patient status (Waiting, With Doctor, Completed)
  - Set priority levels (Normal, Urgent)
  - Remove patients from queue
  - Real-time queue updates

- **Appointment Management** 
  - Schedule patient appointments
  - View upcoming appointments
  - Manage appointment status

- **Authentication**
  - Secure staff login system
  - Protected routes
  - Role-based access control

- **User Interface**
  - Clean, modern UI with Tailwind CSS
  - Responsive design for all devices
  - Dark/Light theme support
  - Toast notifications
  - Loading states and error handling

## Tech Stack

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI Components
- Shadcn UI
- NextAuth.js
- React Context API

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/nandishns/allo-health-clinic.git
   cd allo-health-clinic
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your configuration

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser




