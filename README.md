# Company Internal Complaint & Service Request Management Portal

A role-based internal ticket management system for employees, support agents, and administrators. It centralizes company complaints and service requests and tracks each request through a defined workflow.

> **Status:** Local development/build checks are reported as completed. Before calling this production-ready, deploy to a production-like environment and verify environment variables, database access, authentication, authorization, and the complete ticket workflow.

## Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Roles and Permissions](#roles-and-permissions)
- [Ticket Workflow](#ticket-workflow)
- [Features](#features)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [End-to-End Testing](#end-to-end-testing)
- [GitHub Setup](#github-setup)
- [Deployment Checklist](#deployment-checklist)
- [Security Notes](#security-notes)
- [Scope Exclusions](#scope-exclusions)

## Overview

Employees can submit and track internal requests such as laptop/desktop issues, software installation, network problems, HR requests, office infrastructure problems, and access/permission requests.

Admins manage categories and agents, view all tickets, and assign work. Agents process assigned tickets and add resolution notes. Employees view their own tickets and close or reopen eligible resolved requests.

## Technology Stack

**Backend:** NestJS, Node.js, MongoDB, Mongoose, JWT authentication, bcrypt password hashing, DTO validation.

**Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, Lucide React.

## Roles and Permissions

| Capability | Employee | Agent | Admin |
|---|---:|---:|---:|
| Register an employee account | Yes | No | No |
| Common login | Yes | Yes | Yes |
| Create a ticket | Yes | No | No |
| View own tickets | Yes | No | No |
| View assigned tickets | No | Yes | No |
| Start/resolve assigned ticket | No | Yes | No |
| Close/reopen own eligible ticket | Yes | No | No |
| View all tickets | No | No | Yes |
| Assign tickets | No | No | Yes |
| Manage agents | No | No | Yes |
| Manage categories | No | No | Yes |

Permissions must be enforced by the backend, not only by hiding frontend links.

## Ticket Workflow

```text
Employee creates request
        |
        v
       OPEN
        | Admin assigns agent
        v
     ASSIGNED
        | Agent starts work
        v
   IN_PROGRESS
        | Agent resolves with a note
        v
     RESOLVED
       /     \
Employee     Employee says issue
confirms     is not fixed
    |             |
    v             v
  CLOSED      IN_PROGRESS
```

Supported transitions:
- `OPEN -> ASSIGNED`
- `ASSIGNED -> IN_PROGRESS`
- `IN_PROGRESS -> RESOLVED`
- `RESOLVED -> CLOSED` by the ticket's employee
- `RESOLVED -> IN_PROGRESS` by the ticket's employee when reopening, provided an agent is assigned

Request IDs use the format `REQ-YYYY-XXXXXXXX`.

## Features

### Employee
- Employee dashboard and request summary
- Create tickets with title, description, category, and priority
- View personal requests and ticket details
- Close resolved tickets or reopen them when the issue is not fixed

### Agent
- View assigned requests
- Start work on assigned requests
- Resolve requests with a resolution note
- View ticket details within permitted access

### Admin
- Dashboard statistics and recent requests
- View all tickets and assign them to agents
- Create agents and activate/deactivate them
- Create categories and activate/deactivate them

### Shared
- JWT-protected routes and role-based access
- Common login and public employee registration
- Loading, error, empty, and refresh states
- Settings page for account/session information and sign out

## Architecture

```text
Browser
  |
  v
Next.js Frontend (local port 3001)
  | HTTP + JWT Bearer token
  v
NestJS REST API (local port 3000, prefix /api)
  |
  v
Mongoose
  |
  v
MongoDB
```

## Repository Structure

Keep both applications inside one GitHub repository named `ticket-system`.

```text
ticket-system/
├── backend/
│   ├── src/
│   ├── test/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── .gitignore
└── README.md
```

Your project may include additional framework configuration files. Keep the files required by your actual NestJS and Next.js applications.

## Prerequisites

Install Node.js LTS supported by your dependencies, npm, Git, and MongoDB (local or hosted).

Check versions:

```powershell
node -v
npm -v
git --version
```

## Local Setup

Project root:

```powershell
cd C:\Users\DELL\Desktop\ticket-system
```

### Backend

```powershell
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/company-ticket-system
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Make sure MongoDB is running, then start the backend:

```powershell
npm run start:dev
```

Local API base URL: `http://localhost:3000/api`

### Frontend

Open a second terminal:

```powershell
cd C:\Users\DELL\Desktop\ticket-system\frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Start the frontend:

```powershell
npm run dev -- --port 3001
```

Open `http://localhost:3001`.

If your `package.json` scripts differ, use the scripts actually defined in your project.

## Environment Variables

### `backend/.env`

| Variable | Purpose | Local example |
|---|---|---|
| `PORT` | Backend port | `3000` |
| `MONGODB_URI` | MongoDB connection | `mongodb://127.0.0.1:27017/company-ticket-system` |
| `JWT_SECRET` | JWT signing secret | A long, unique secret |
| `JWT_EXPIRES_IN` | Token expiry | `1d` |

### `frontend/.env.local`

| Variable | Purpose | Local example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3000/api` |

Values prefixed with `NEXT_PUBLIC_` are exposed to browser code. Never put private secrets in frontend environment variables.

## Build Verification

Run these commands from the project root:

```powershell
cd backend
npm run build

cd ..\frontend
npm run build
```

A successful local build does not by itself prove a production deployment is ready. Run the smoke tests below after deployment too.

## API Overview

All routes use the `/api` global prefix.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register employee |
| `POST` | `/api/auth/login` | Public | Common login |
| `GET` | `/api/auth/me` | Authenticated | Current user |
| `GET` | `/api/auth/admin-test` | Admin | Verify admin authorization |
| `POST` | `/api/users/agents` | Admin | Create agent |
| `GET` | `/api/users/agents` | Admin | List agents |
| `GET` | `/api/users/agents/:id` | Admin | Agent details |
| `PATCH` | `/api/users/agents/:id/status` | Admin | Change agent status |
| `GET` | `/api/categories` | Authenticated | List categories |
| `POST` | `/api/categories` | Admin | Create category |
| `GET` | `/api/categories/:id` | Authenticated | Category details |
| `PATCH` | `/api/categories/:id/status` | Admin | Change category status |
| `POST` | `/api/requests` | Employee | Create ticket |
| `GET` | `/api/requests/my` | Employee | Own tickets |
| `GET` | `/api/requests/assigned` | Agent | Assigned tickets |
| `GET` | `/api/requests` | Admin | All tickets |
| `GET` | `/api/requests/:id` | Authorized ticket viewer | Ticket details |
| `PATCH` | `/api/requests/:id/assign` | Admin | Assign ticket |
| `PATCH` | `/api/requests/:id/start` | Assigned agent | Start work |
| `PATCH` | `/api/requests/:id/resolve` | Assigned agent | Resolve with note |
| `PATCH` | `/api/requests/:id/close` | Ticket employee | Close resolved ticket |
| `PATCH` | `/api/requests/:id/reopen` | Ticket employee | Reopen resolved ticket |
| `GET` | `/api/dashboard/admin` | Admin | Admin dashboard |
| `GET` | `/api/dashboard/employee` | Employee | Employee dashboard |
| `GET` | `/api/dashboard/agent` | Agent | Agent dashboard |

The DTOs/controllers in `backend/src` are the source of truth for request bodies and response fields.

## End-to-End Testing

### Authentication
- [ ] Employee registration and login work
- [ ] Invalid input returns a useful validation error
- [ ] `/api/auth/me` returns the authenticated user
- [ ] Missing/invalid/expired token is rejected
- [ ] Inactive users cannot use protected endpoints
- [ ] Logout removes the local token and returns to login

### Categories and agents
- [ ] Admin creates and activates/deactivates a category
- [ ] Inactive categories are not offered for new tickets
- [ ] Admin creates and activates/deactivates an agent
- [ ] Employee and Agent cannot access admin-only management APIs

### Ticket lifecycle
- [ ] Employee creates a ticket with an active category
- [ ] Ticket appears in Employee My Requests and Admin All Requests
- [ ] Admin assigns the ticket to an active agent
- [ ] Assigned agent sees the ticket
- [ ] Agent starts work and status becomes `IN_PROGRESS`
- [ ] Agent resolves the ticket with a resolution note
- [ ] Employee closes their own resolved ticket
- [ ] Employee can reopen their own eligible resolved ticket
- [ ] Other employees cannot read or update the ticket
- [ ] An agent cannot process a ticket assigned to another agent
- [ ] Invalid status transitions are rejected

### Final checks
- [ ] Correct dashboard and statistics for all three roles
- [ ] Unauthorized pages and API calls are blocked
- [ ] Loading, error, and empty states behave correctly
- [ ] Backend build succeeds
- [ ] Frontend build succeeds
- [ ] Deployed smoke tests pass

## GitHub Setup

### 1. Create the root `.gitignore`

Create this file at:

`C:\Users\DELL\Desktop\ticket-system\.gitignore`

```gitignore
# Dependencies
node_modules/
**/node_modules/

# Environment variables and secrets
.env
.env.*
!.env.example
!.env.*.example
**/.env
**/.env.*
!**/.env.example
!**/.env.*.example

# Build output
backend/dist/
frontend/.next/
frontend/out/
frontend/build/
frontend/dist/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Coverage
coverage/
.nyc_output/

# Editor and OS files
.vscode/
.idea/
.DS_Store
Thumbs.db
*.swp
*.swo

# Temporary files
tmp/
temp/
```

### 2. Create safe environment templates

`backend/.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/company-ticket-system
JWT_SECRET=replace_me_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

`frontend/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Keep real `backend/.env` and `frontend/.env.local` files out of Git.

### 3. Initialize Git from the project root

Run in PowerShell:

```powershell
cd C:\Users\DELL\Desktop\ticket-system
git status
git init
git add .
git status
git commit -m "Initial release: internal service request portal"
```

If Git requests your identity, set your GitHub name/email:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"
```

Then retry the commit.

Before committing, inspect `git status` and confirm `.env`, `.env.local`, `node_modules`, `dist`, and `.next` are not staged.

### 4. Create the GitHub repository

1. Go to https://github.com/new
2. Repository name: `ticket-system`
3. Choose Public or Private.
4. If local `README.md` and `.gitignore` already exist, create the remote repository without initializing another README or `.gitignore`.
5. Copy the repository URL.

Then from the local project root:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ticket-system.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

If `origin` already exists, inspect it first:

```powershell
git remote -v
```

Do not add a duplicate remote. Correct the existing remote URL only if needed.

For later updates:

```powershell
git status
git add .
git commit -m "Describe the changes"
git push
```

### 5. Verify GitHub

Confirm the repository contains `backend/`, `frontend/`, `README.md`, and `.gitignore`. Confirm it does **not** contain real `.env` files, `node_modules/`, `dist/`, `.next/`, passwords, database credentials, or JWT secrets.

If a secret was ever pushed, rotate it. Removing it in a later commit does not remove it from Git history.

## Deployment Checklist

### Backend
- [ ] Deploy the NestJS backend with a supported Node.js runtime
- [ ] Configure production `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`
- [ ] Restrict CORS to the deployed frontend origin
- [ ] Ensure the host builds and starts the compiled backend application
- [ ] Verify database connectivity and deployment logs

### Frontend
- [ ] Deploy the Next.js app with the root directory set to `frontend/` when required by the hosting provider
- [ ] Set `NEXT_PUBLIC_API_URL` to the deployed backend URL ending in `/api`
- [ ] Rebuild after changing frontend environment variables
- [ ] Verify login and API calls from the deployed site

### Database and operational safety
- [ ] Use a hosted database with access controls and backups
- [ ] Restrict database network access where supported
- [ ] Do not use the local MongoDB URL in production
- [ ] Change or disable development seed credentials before public release
- [ ] Create a unique production admin credential and store it securely
- [ ] Review logging, monitoring, backups, and recovery procedures

### Production smoke test
- [ ] Log in as Admin
- [ ] Verify a category and create/verify an Agent
- [ ] Register/log in as Employee
- [ ] Create a ticket
- [ ] Assign it to an Agent
- [ ] Start work and resolve it as Agent
- [ ] Close or reopen it as Employee
- [ ] Verify dashboard counts and role restrictions
- [ ] Check deployment logs for errors

## Security Notes

- Never commit secrets or credentials.
- Use HTTPS in production.
- Use a unique, long production JWT secret.
- Keep dependencies updated.
- Validate request DTOs and enforce role/ownership checks on the server.
- Configure CORS for the real frontend origin.
- Avoid exposing stack traces or database details to users.
- Use database backups and test recovery.
- Do not use development seed admin credentials in production.
- Verify operational security requirements before exposing the application publicly.

## Scope Exclusions

Intentionally excluded from the current scope:
- Photo/file attachments and Cloudinary
- Comments or real-time chat
- Email notifications
- Redis, Kafka, Socket.IO, or microservices
- Profile/password editing without dedicated backend APIs

The Settings page displays account/session information and supports sign out; it does not claim to edit account details.

## License

Add a license if you intend to distribute the project publicly. Choose one that matches your intended use and any applicable organizational requirements.
