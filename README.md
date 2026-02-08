# SplitSahiSe

A modern expense splitting app – split group expenses, simplify debts with a min-cash-flow algorithm, and settle via UPI. Dark mode first, offline-ready, with smart categorization.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT auth
- **Mobile:** React Native (Expo Router), TypeScript, NativeWind (Tailwind), Zustand, React Query

## Project structure

```
├── backend/          # API server
│   ├── prisma/       # Schema and migrations
│   └── src/          # Routes, services, middleware
├── app/              # Expo (React Native) app
│   ├── app/          # Expo Router screens
│   ├── lib/          # API client, storage
│   └── store/        # Zustand auth store
└── README.md
```

## Quick start

### 1. Database and backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT_SECRET

npm install
npx prisma generate
npx prisma db push   # or: npx prisma migrate dev

npm run dev
```

API runs at `http://localhost:4000`. Health: `GET /health`.

### 2. Mobile app

```bash
cd app
npm install

# Set API URL (for device/emulator use your machine IP)
# Create app/.env with: EXPO_PUBLIC_API_URL=http://YOUR_IP:4000/api

npx expo start
```

Use Expo Go on your phone or run Android/iOS simulator.

## Core features

- **Auth:** Register / login (JWT), profile, UPI ID
- **Groups & friends:** Create groups, add members, friend-to-friend expenses
- **Expenses:** Title, category, image; split by Equal / Exact / Percentage / Shares; multiple payers
- **Debt simplification:** Min-cash-flow algorithm for minimal settle-up transactions
- **Dashboard:** “You owe” / “You are owed” and simplified settle-up list
- **Activity feed:** Who added what expense and settlements
- **Settle up:** UPI deep link (GPay/PhonePe) or record cash

## API overview

| Path | Description |
|------|-------------|
| `POST /api/auth/register` | Register (email, password, name, phone?) |
| `POST /api/auth/login` | Login (email, password) |
| `GET /api/users/me` | Current user (auth) |
| `PATCH /api/users/me` | Update profile, UPI ID (auth) |
| `GET /api/groups` | List user’s groups (auth) |
| `POST /api/groups` | Create group (auth) |
| `GET /api/expenses` | List expenses (auth, optional ?groupId=) |
| `POST /api/expenses` | Create expense (auth) |
| `GET /api/dashboard` | You owe, you are owed, simplified transactions (auth, optional ?groupId=) |
| `GET /api/activity` | Activity feed (auth) |
| `POST /api/settlements` | Record settlement (auth) |
| `GET /api/upi/pay-link?toUserId=&amount=` | UPI pay link (auth) |

## Environment

**Backend (`backend/.env`):**

- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – Secret for JWT signing
- `PORT` – Server port (default 4000)

**App (`app/.env`):**

- `EXPO_PUBLIC_API_URL` – Base API URL (e.g. `http://192.168.1.x:4000/api` for device)

## License

MIT
