# Dark Mode Not Working - Quick Fix Guide

## Problem
The app is currently hardcoded to dark mode and doesn't respond to system theme changes.

## Root Cause
Most screens use hardcoded Tailwind classes like `bg-[#020617]` instead of theme-aware classes.

## Solutions

### Option 1: Use NativeWind Dark Mode (Recommended)
Update screens to use `dark:` variants:

```tsx
// Instead of:
className="bg-[#020617]"

// Use:
className="bg-white dark:bg-[#020617]"
```

### Option 2: Use ThemeContext (Already Implemented)
The `ThemeContext` is already set up and working. Components just need to use it:

```tsx
import { useTheme } from "@/contexts/ThemeContext";

function MyScreen() {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello!</Text>
    </View>
  );
}
```

## Quick Test
The following components ARE already theme-aware:
- ✅ `CurrencySelector` 
- ✅ `ShareInvite`
- ✅ `JoinGroup` screen

The following screens need updating:
- ❌ Groups tab
- ❌ Expenses tab  
- ❌ Activity tab
- ❌ Most other screens

## Immediate Fix
I've enabled `darkMode: "media"` in `tailwind.config.js`. 

To make existing screens work, they need to be updated to use either:
1. Dark mode variants (`dark:bg-slate-900`)
2. ThemeContext (`colors.background`)

Would you like me to update all the main screens to be theme-aware?
