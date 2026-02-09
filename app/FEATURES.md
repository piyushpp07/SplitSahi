# Project Status & Roadmap

## ✅ Completed Features
- **Authentication**: Login, Register, Profile Management, Biometric Stub.
- **Groups**: Create groups, add members, detailed group view with expenses list.
- **Expenses**: Add expenses, support for Equal/Percentage/Exact splits, category selection.
- **Friends**: Manage friend list, view individual friend balances.
- **Settlements**: "Settle Up" flow with UPI integration stub.
- **Dashboard**: Overall "You Owe" / "You are Owed" summary.
- **Android Compatibility**: 
  - Fixed font rendering issues (replaced incompatible weights).
  - Fixed background visibility issues (Safe Area Context).
  - Enabled smooth layout animations.

## 🚀 Potential New Features (Roadmap)

### 1. 🧾 AI Receipt Scanning
- **What**: Upload a receipt image to auto-fill expense details (Total, Date, Items).
- **Why**: Reduces manual data entry significantly.
- **Tech**: Google ML Kit or Cloud Vision API.

### 2. 💬 Expense Comments & Activity Log
- **What**: Allow users to comment on specific expenses to discuss details.
- **Why**: improves communication and resolves disputes.
- **Tech**: New database table for comments, real-time updates.

### 5. 🌍 Multi-Currency Support
- **What**: Support for different currencies in the same group (e.g., USD, EUR, INR).
- **Why**: Perfect for travel groups.
- **Tech**: Currency conversion API integration.
