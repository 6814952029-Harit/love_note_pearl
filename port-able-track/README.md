# Letterly

Full-stack web application for creating and sharing password-protected letters.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose

## Prerequisites

- Node.js 20 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

## Configure environment

1. Copy `server/.env.example` to `server/.env` and set `MONGO_URI` and a secure `JWT_SECRET`.
2. Optionally copy `client/.env.example` to `client/.env`. The default API address is already `http://localhost:5000/api`.

## Run locally

Open two terminals from this project directory.

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

Open the Vite address shown in the second terminal (normally `http://localhost:5173`). Check the API at `http://localhost:5000/api/health`.

## Production build

```powershell
cd client
npm run build
```

Set `VITE_API_URL` to the deployed backend API address before making the production build.

## Letter API

All owner endpoints require `Authorization: Bearer <token>`.

- `POST /api/letters` creates and publishes a letter, returning its share slug.
- `GET /api/letters` lists the signed-in user's letters.
- `GET /api/letters/:id` gets one of the signed-in user's letters.
- `PUT /api/letters/:id` saves changes to content, appearance, protection, sharing, or QR settings.
- `GET /api/letters/public/:slug` reads a public letter; password-protected letters return only safe metadata until unlocked.
- `POST /api/letters/public/:slug/unlock` unlocks a protected letter.

Run schema tests with `cd server; npm test`.

## Authentication and admin roles

- `POST /api/auth/register` creates a standard `user` account.
- Set both `ADMIN_EMAIL` and `ADMIN_BOOTSTRAP_CODE` before registering that email with the matching activation code to create the first `admin` account. Do not expose these settings in the frontend.
- `POST /api/auth/login` returns the user and JWT, including the user's role.
- Only admins may use `GET /api/admin/users` and `PUT /api/admin/users/:id` to edit a user's display name, email, or role.
- An admin cannot remove their own admin role through the API.
