# C-Core-Bloom Mobile App: Feature & Route Parity Matrix

This document provides a comprehensive verification of feature parity between the web app and the mobile application across all routes and core capabilities.

Parity status legend:
- **Works**: Functions identically to the web app using native WebView capabilities.
- **Works with override**: Preserved with a mobile-optimized override in `mobile/src/overrides/` without modifying web code.
- **Needs web change request**: Logged in `mobile/WEB_CHANGE_REQUESTS.md` for deferred web improvements.
- **Not applicable**: Feature not available to this role by design.

---

## 1. Route Parity Checklist

| Route | Screen / Feature Description | Candidate (User) | Administrator (Admin / SuperAdmin) | Notes / Mobile Adaptation |
|---|---|---|---|---|
| `/` | Landing / Welcome Screen | **Works** | **Works** | Responsive layout, quick action to start CBT practice or sign in. |
| `/auth` | User Sign In & Sign Up | **Works** | **Not applicable** | Form inputs auto-scroll above keyboard; persistent session saved to native storage. |
| `/admin-login` | Admin Sign In Gate | **Not applicable** | **Works** | Gated by `user_roles` query; access denied for non-admin accounts. |
| `/super-admin-login` | Super Admin Credentials Gate | **Not applicable** | **Works** | Validates `super_admin` role; blocks unauthorized accounts. |
| `/forgot-password` | Request Reset OTP via Edge Function | **Works** | **Works** | Invokes backend `reset-password` edge function; handles touch OTP input. |
| `/reset-password` | Validate OTP & Set New Password | **Works** | **Works** | Touch-friendly numeric keypad and deep-link callback support. |
| `/dashboard` | Student CBT Dashboard & Test Selection | **Works** | **Works** | Cards display available subjects, past score summaries, and quick test launch. |
| `/test/:testId` | Active CBT Exam Taking & Live Timer | **Works with override** | **Works with override** | Screen wake lock engaged; wall-clock `TestTimer` override; back button guard; offline answer queue. |
| `/results` | Candidate Exam History & Result List | **Works** | **Works** | Touch-optimized table/cards; quick links to view details or export slips. |
| `/results/:resultId` | Detailed Result Breakdown & Slip | **Works with override** | **Works with override** | `pdfGenerator` override shares result PDF via native share sheet or saves to device. |
| `/jamb` | JAMB CBT Practice Hub | **Works** | **Works** | Subject filtering, year selection, immediate practice modes. |
| `/admin` | Admin Management Dashboard | **Not applicable** | **Works with override** | `AnalyticsDashboard` and `DatabaseDashboard` card overrides; touch-friendly question management. |
| `/super-admin` | Super Admin Command Center | **Not applicable** | **Works with override** | Realtime subscription listener for question sync; bulk export via PDF generator override. |
| `/drive` | Google Drive Integration Screen | **Works** | **Works** | Cloud sync for exported results via web-standard Firebase OAuth popups. |
| `*` | 404 Not Found Fallback | **Works** | **Works** | Safe navigation return to home. |

---

## 2. Core Functional Parity

### User / Candidate Experience
- **Exam Session Continuity**: Active test taking is protected against accidental exits with confirmation popups on hardware back button or swipe-to-back.
- **Interruption Resilience**: If candidate receives a phone call, notification, or minimizes app, the wall-clock timer accurately reflects elapsed time upon return.
- **Offline Reliability**: Answers selected while offline are buffered in `cbt_mobile_offline_answer_queue` and dispatched upon reconnection.
- **Sharing**: Results can be directly shared to WhatsApp, Telegram, Email, or saved to local storage via the native share sheet.

### Administrator Experience
- **Question Management**: CRUD operations for questions, subjects, and answer keys function with touch-safe dialogs.
- **File Imports (CSV, PDF, Images)**: HTML5 file input triggers native Android/iOS file pickers.
- **Bulk PDF Reporting**: Large result exports are processed and shared through native device mechanisms.
- **Security & Authorization**: Gated at the database level by Supabase RLS and server-side Edge Functions. Mobile UI adheres to identical role validation.
