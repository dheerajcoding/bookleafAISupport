# Author Support & Communication Portal (BookLeaf)

Production-ready full-stack application for BookLeaf publishing to support authors and admins through ticket workflows with AI assistance.

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, ShadCN UI
- Backend: Node.js, Express, MongoDB, Mongoose
- Realtime: Socket.io
- AI: OpenAI `gpt-4o-mini`

## Project Structure

```text
bookleaf/
  backend/
    config/
    controllers/
    data/
    middleware/
    models/
    routes/
    scripts/
    services/
    utils/
    app.js
    server.js
  frontend/
    app/
    components/
    hooks/
    lib/
  README.md
```

## Key Features

### Author

- JWT authentication (register/login)
- Dashboard with author books
- Book edge handling:
  - `In Production` shows badge and hides royalty data
  - null values displayed as `N/A`
- Create tickets (book-specific or general)
- Ticket list and ticket chat view
- Realtime updates when admin responds

### Admin

- Ticket dashboard for all tickets
- Filters for status/category/priority
- Ticket details with full conversation
- Edit category and priority
- Assign ticket to admin
- Change status
- Send replies in chat
- View AI draft response generated at ticket creation

### AI Workflow

When ticket is created:

1. AI classifies category and priority using OpenAI (`gpt-4o-mini`)
2. AI drafts an empathetic response for admin assistance

Fallback behavior:

- If OpenAI call fails or key is missing, ticket creation still succeeds
- Category defaults to `General Inquiry`
- Priority defaults to `Medium`
- Admin can fully manage and reply manually

## Database Models

### User

- `_id`
- `author_id`
- `name`
- `email`
- `password` (hashed)
- `role` (`AUTHOR` or `ADMIN`)
- `city`
- `joined_date`

### Book

- `_id`
- `book_id`
- `title`
- `isbn`
- `genre`
- `publication_date`
- `status`
- `mrp`
- `author_royalty_per_copy`
- `total_copies_sold`
- `total_royalty_earned`
- `royalty_paid`
- `royalty_pending`
- `last_royalty_payout_date`
- `print_partner`
- `available_on` (array)
- `authorId` (ref User)

### Ticket

- `_id`
- `authorId`
- `bookId` (nullable)
- `subject`
- `description`
- `category` (AI generated, editable by admin)
- `priority` (AI generated, editable by admin)
- `status` (`Open`, `In Progress`, `Resolved`, `Closed`)
- `assignedTo` (adminId)
- `messages[]`
- `aiDraftResponse`
- `createdAt`

### Message

- `sender` (`AUTHOR` or `ADMIN`)
- `content`
- `createdAt`

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Books

- `GET /api/books` (author only)

### Tickets

- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/:id`
- `POST /api/tickets/:id/message`
- `PATCH /api/tickets/:id/status` (admin)
- `PATCH /api/tickets/:id/assign` (admin)
- `PATCH /api/tickets/:id/meta` (admin)

### Admin

- `GET /api/admin/users` (admin list for assignment)

## Setup Instructions

## 1. Clone and install

```bash
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

## 2. Configure environment variables

Create files:

- `backend/.env` from `backend/.env.example`
- `frontend/.env.local` from `frontend/.env.example`

Required backend vars:

- `MONGODB_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY` (optional but recommended for AI)

## 3. Seed data

Place the provided dataset JSON at:

- `backend/data/authors-books.json`

If your file is elsewhere, set:

- `SEED_DATA_FILE` in `backend/.env`

Run seeding:

```bash
cd backend
npm run seed
```

Seed behavior:

- Normalizes nested authors -> books into separate collections
- Creates author users with default password `password123`
- Links books using `authorId`
- Creates admin user:
  - email: `admin@bookleaf.com`
  - password: `admin123`

## 4. Run application

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/api/health`

## Deploy to Render

The repo includes a `render.yaml` [Blueprint](https://render.com/docs/blueprint-spec) that provisions both services automatically.

### Steps

**1. Prerequisites**

- MongoDB Atlas cluster ready (free tier is fine). Whitelist all IPs (`0.0.0.0/0`) in Atlas Network Access.
- OpenAI API key (optional — AI features fall back gracefully without it).

**2. Push repo to GitHub / GitLab**

**3. Create Blueprint on Render**

Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint** → connect your repo. Render detects `render.yaml` automatically.

**4. Set secrets before deploying**

In the Render dashboard, open **bookleaf-backend** and set:

| Key | Value |
|---|---|
| `MONGODB_URI` | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/bookleaf?retryWrites=true&w=majority` |
| `OPENAI_API_KEY` | your OpenAI key (leave blank to skip AI features) |

Then open **bookleaf-frontend** and set:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://bookleaf-backend.onrender.com/api` |

> Replace `bookleaf-backend` with the actual service name if you changed it in `render.yaml`.

**5. Deploy**

Click **Apply**. Render builds backend first, then frontend. `JWT_SECRET` is auto-generated; `NEXT_PUBLIC_SOCKET_URL` is wired automatically from the backend URL.

**6. Seed the database (one-time)**

After both services are live, run the seed script locally pointed at your Atlas cluster:

```bash
cd backend
MONGODB_URI=<your_atlas_uri> npm run seed
```

### Service URLs

| Service | URL pattern |
|---|---|
| Frontend | `https://bookleaf-frontend.onrender.com` |
| Backend API | `https://bookleaf-backend.onrender.com/api` |
| Health check | `https://bookleaf-backend.onrender.com/api/health` |

### Notes

- **Free tier spin-down**: On Render's free plan, services spin down after 15 min of inactivity. The first request after a cold start takes ~30 s. Upgrade to a paid plan to keep services always on.
- **WebSockets**: Render supports WebSockets on all plans. The Socket.io connection uses the WebSocket transport directly.
- **Environment variables baked in at build time**: `NEXT_PUBLIC_*` vars are embedded during `next build`. If you change `NEXT_PUBLIC_API_URL` later, trigger a manual redeploy of the frontend.

---

## Architecture Notes

- Controllers contain business logic and role-aware data access.
- Middleware handles authentication, authorization, validation, and errors.
- AI service is isolated (`backend/services/aiService.js`) for maintainability.
- Socket events:
  - `ticket:new` for admins when a new ticket is created
  - `ticket:updated` and `ticket:message` for author/admin conversation updates
- Frontend uses shared typed API and auth context with JWT persistence.

## Production Readiness Notes

- Input validation with Joi
- RBAC enforced on routes
- Password hashing with bcrypt
- Meaningful HTTP errors
- Modular service/controller architecture
- Loading and empty states across dashboards

