# SplitSahiSe API

Express + TypeScript + Prisma backend for SplitSahiSe.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. `npm install`
3. `npx prisma generate && npx prisma db push`
4. `npm run dev`

## Scripts

- `npm run dev` – Start with tsx watch
- `npm run build` / `npm start` – Production
- `npx prisma studio` – DB GUI
