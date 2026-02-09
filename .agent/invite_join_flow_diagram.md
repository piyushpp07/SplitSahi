# Complete Invite & Join Flow

## 📤 Invite Flow

```
User A (Group Member)
    │
    ├─► Opens Group Detail Screen
    │       │
    │       ├─► Taps "Invite" Button (ShareInvite Component)
    │       │
    │       └─► Modal Opens with Options:
    │               │
    │               ├─► 1. Share via Apps (WhatsApp, Messages, etc.)
    │               │      → Opens native share sheet
    │               │      → Shares: "Join 'Weekend Trip' on SplitSahiSe!
    │               │                 Invite Code: CLX123AB
    │               │                 splitsahise://group/join/clx123abc..."
    │               │
    │               ├─► 2. Copy Invite Code
    │               │      → Copies: "CLX123AB"
    │               │      → Shows: "Invite code copied!"
    │               │
    │               ├─► 3. Copy Link
    │               │      → Copies: "splitsahise://group/join/clx123abc..."
    │               │      → Shows: "Invite link copied!"
    │               │
    │               └─► 4. Copy Message
    │                      → Copies full formatted message
    │                      → Shows: "Invite message copied!"
    │
    └─► User A shares code/link with User B
```

---

## 📥 Join Flow

```
User B (New Member)
    │
    ├─► Receives Invite (via WhatsApp, Messages, etc.)
    │       │
    │       └─► Gets: "Join 'Weekend Trip'! Code: CLX123AB"
    │
    ├─► Opens SplitSahiSe App
    │       │
    │       └─► Navigates to Groups Tab
    │
    ├─► Sees Two Options:
    │       │
    │       ├─► Header: "Join" button (always visible)
    │       │
    │       └─► Empty State: "Join Group" button (if no groups)
    │
    ├─► Taps "Join" Button
    │       │
    │       └─► Opens Join Group Screen
    │
    ├─► Join Group Screen:
    │       │
    │       ├─► Shows: Group icon illustration
    │       ├─► Title: "Enter Invite Code"
    │       ├─► Input: Large text field (auto-capitalizes)
    │       └─► Button: "Join Group"
    │
    ├─► User B Enters Code: "CLX123AB"
    │       │
    │       └─► Taps "Join Group"
    │
    ├─► API Call: POST /api/groups/join
    │       │
    │       ├─► Request: { "groupId": "clx123abc..." }
    │       │
    │       └─► Backend Processing:
    │               │
    │               ├─► 1. Validate group exists ✓
    │               ├─► 2. Check if already member
    │               │      ├─► Yes → Return friendly message
    │               │      └─► No → Continue
    │               ├─► 3. Add user as MEMBER
    │               └─► 4. Return updated group data
    │
    ├─► Success Response:
    │       │
    │       └─► Alert: "Success! 🎉
    │                   Successfully joined 'Weekend Trip'!"
    │               │
    │               └─► Options:
    │                       └─► "View Group" → Navigates to group detail
    │
    └─► User B is now a member! ✅
            │
            ├─► Can see group in Groups tab
            ├─► Can view expenses
            ├─► Can add expenses
            └─► Can invite others
```

---

## 🔄 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        INVITE & JOIN SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐                                    ┌──────────────┐
│   User A     │                                    │   User B     │
│ (Inviter)    │                                    │  (Invitee)   │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ 1. Opens Group                                    │
       ├──────────────────────────────────────────────────►│
       │ 2. Taps "Invite"                                  │
       │                                                   │
       │ 3. Shares Code/Link                               │
       │    "CLX123AB"                                     │
       ├──────────────────────────────────────────────────►│
       │                                                   │
       │                                    4. Receives    │
       │                                       Invite      │
       │                                                   │
       │                                    5. Opens App   │
       │                                                   │
       │                                    6. Taps "Join" │
       │                                                   │
       │                                    7. Enters Code │
       │                                       "CLX123AB"  │
       │                                                   │
       │                                    8. Submits     │
       │                                          │        │
       │                                          ▼        │
       │                              ┌─────────────────┐ │
       │                              │  Backend API    │ │
       │                              │  POST /join     │ │
       │                              └────────┬────────┘ │
       │                                       │          │
       │                                       ▼          │
       │                              ┌─────────────────┐ │
       │                              │  Validate &     │ │
       │                              │  Add Member     │ │
       │                              └────────┬────────┘ │
       │                                       │          │
       │                                       ▼          │
       │                              ┌─────────────────┐ │
       │                              │  Success! 🎉    │ │
       │                              │  User B added   │ │
       │                              └────────┬────────┘ │
       │                                       │          │
       │                                       ▼          │
       │                                    9. Joined!    │
       │                                                  │
       │ 10. Sees User B in member list                  │
       │◄─────────────────────────────────────────────────┤
       │                                                  │
       ▼                                                  ▼
   Both users can now collaborate in the group!
```

---

## 🎯 Key Components

### Frontend Components:
1. **ShareInvite** (`app/components/ShareInvite.tsx`)
   - Modal with sharing options
   - Generates invite code (8-char)
   - Creates deep links
   - Formats messages

2. **JoinGroup Screen** (`app/app/join-group.tsx`)
   - Code input interface
   - Validation
   - API integration
   - Success handling

3. **Groups Screen** (`app/app/(tabs)/groups.tsx`)
   - "Join" button in header
   - "Join Group" in empty state
   - Entry points for join flow

### Backend Endpoints:
1. **POST /api/groups/join**
   - Validates group ID
   - Checks membership
   - Adds user as member
   - Returns updated group

---

## 💡 User Journey

### Scenario: Weekend Trip Planning

**Friday:**
- Alice creates "Weekend Trip" group
- Adds initial expenses
- Wants to invite Bob

**Alice's Actions:**
1. Opens "Weekend Trip" group
2. Taps "Invite" button
3. Sees invite code: `CLX123AB`
4. Shares via WhatsApp to Bob

**Bob's Actions:**
1. Receives WhatsApp message with code
2. Opens SplitSahiSe app
3. Taps "Join" in Groups tab
4. Enters code: `CLX123AB`
5. Taps "Join Group"
6. Success! Views "Weekend Trip" group

**Result:**
- Bob is now a member
- Can see all expenses
- Can add new expenses
- Can invite others
- Alice sees Bob in member list

---

## ✨ Features Highlights

### Security:
- ✅ Authentication required
- ✅ Group validation
- ✅ Duplicate prevention
- ✅ Proper error messages

### UX:
- ✅ Multiple sharing methods
- ✅ Easy code entry
- ✅ Clear success feedback
- ✅ Immediate navigation
- ✅ Theme support

### Reliability:
- ✅ Error handling
- ✅ Loading states
- ✅ Cache invalidation
- ✅ Validation checks

---

## 🎨 Visual Design

### ShareInvite Modal:
```
┌─────────────────────────────────────┐
│  👥  Invite to Weekend Trip         │
│      Share this group with friends  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  INVITE CODE                  │ │
│  │  C L X 1 2 3 A B    [Copy]    │ │
│  └───────────────────────────────┘ │
│                                     │
│  📤  Share Invite                   │
│  🔗  Copy Link                      │
│  💬  Copy Message                   │
│                                     │
│  Cancel                             │
└─────────────────────────────────────┘
```

### Join Group Screen:
```
┌─────────────────────────────────────┐
│  ← Join Group                       │
│                                     │
│         ┌─────────┐                 │
│         │   👥    │                 │
│         └─────────┘                 │
│                                     │
│     Enter Invite Code               │
│  Ask your friend for the group      │
│  invite code to join                │
│                                     │
│  INVITE CODE                        │
│  ┌───────────────────────────────┐ │
│  │  Enter code here...           │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ✓  Join Group                │ │
│  └───────────────────────────────┘ │
│                                     │
│  ℹ️  How to get an invite code?    │
│  Ask a group member to share the   │
│  invite code with you...           │
└─────────────────────────────────────┘
```

---

This completes the full invite and join workflow! 🎉
