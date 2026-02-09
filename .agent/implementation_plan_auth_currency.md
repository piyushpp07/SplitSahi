# Implementation Plan: Multi-Currency & Enhanced Authentication

## Phase 1: Multi-Currency Support

### Backend Changes:
1. **Database Schema Updates**:
   - Add `exchangeRates` table to cache conversion rates
   - Update `Expense` model to store original currency
   - Add currency preference to User model (already exists)

2. **Currency Service** (`backend/src/services/currency.ts`):
   - Fetch exchange rates from API (e.g., exchangerate-api.com)
   - Cache rates with TTL
   - Convert amounts between currencies
   - Support major currencies: USD, EUR, GBP, INR, AUD, CAD, etc.

3. **API Updates**:
   - Modify expense endpoints to handle currency
   - Add `/api/currencies` endpoint for supported currencies
   - Add `/api/exchange-rates` endpoint

### Frontend Changes:
1. **Currency Selector Component**
2. **Update Expense Creation** to include currency selection
3. **Display converted amounts** in user's preferred currency
4. **Settings screen** for default currency preference

---

## Phase 2: Enhanced Authentication & User Management

### Backend Changes:

1. **Database Schema Updates**:
   ```prisma
   model User {
     email          String   @unique
     emailVerified  Boolean  @default(false)
     phone          String?  @unique
     phoneVerified  Boolean  @default(false)
     uniqueUserId   String   @unique @default(cuid())
     oauthProvider  String?  // 'google', 'apple', etc.
     oauthId        String?
   }
   
   model OTPVerification {
     id         String   @id @default(cuid())
     identifier String   // email or phone
     code       String
     type       String   // 'email' or 'phone'
     expiresAt  DateTime
     verified   Boolean  @default(false)
   }
   ```

2. **OTP Service** (`backend/src/services/otp.ts`):
   - Generate 6-digit OTP codes
   - Send email OTP (using nodemailer or SendGrid)
   - Send SMS OTP (using Twilio)
   - Verify OTP codes
   - Handle expiration (5-10 minutes)

3. **OAuth Integration**:
   - Google OAuth setup
   - Apple Sign In (for iOS)
   - Passport.js or similar library

4. **New API Endpoints**:
   - `POST /api/auth/send-otp` - Send OTP to email/phone
   - `POST /api/auth/verify-otp` - Verify OTP code
   - `POST /api/auth/oauth/google` - Google OAuth callback
   - `POST /api/auth/oauth/apple` - Apple OAuth callback
   - `GET /api/users/search` - Search users by email/phone

### Frontend Changes:

1. **Redesigned Auth Screens**:
   - Email/Phone input screen
   - OTP verification screen
   - OAuth buttons (Google, Apple)

2. **Contact Sync**:
   - Request contacts permission
   - Upload contacts to backend for matching
   - Display matched users

3. **Enhanced Friend Discovery**:
   - Search bar with email/phone input
   - Contact list integration
   - QR code sharing (optional)

---

## Phase 3: Friend Discovery Enhancement

### Backend:
1. **User Search Service**:
   - Search by email (exact match)
   - Search by phone (exact match)
   - Privacy controls

2. **Contact Matching**:
   - Batch contact upload
   - Hash phone numbers for privacy
   - Return matched users

### Frontend:
1. **Add Friend Screen Improvements**:
   - Search input
   - Contact picker
   - Recent/suggested friends

---

## Implementation Order:
1. ✅ Start with **Multi-Currency** (simpler, independent)
2. ✅ Then **OTP Verification** (core auth improvement)
3. ✅ Then **OAuth Integration** (requires external setup)
4. ✅ Finally **Contact Sync** (requires permissions)

---

## Dependencies to Install:

### Backend:
```bash
npm install nodemailer twilio passport passport-google-oauth20 passport-apple
npm install @types/nodemailer @types/passport @types/passport-google-oauth20
```

### Frontend:
```bash
npx expo install expo-contacts expo-auth-session expo-crypto
```
