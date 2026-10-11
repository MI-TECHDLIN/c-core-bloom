# Google Play Data Safety & App Store Privacy Declarations

This document provides exact responses required when submitting C-Core-Bloom to the Google Play Console (Data Safety Section) and Apple App Store Connect (App Privacy Nutrition Labels).

---

## 1. Google Play Console: Data Safety Questionnaire

### Overview
- **Does your app collect or share any user data?**: Yes
- **Is all user data collected by your app encrypted in transit?**: Yes (Enforced via HTTPS and `android:usesCleartextTraffic="false"`)
- **Do you provide a way for users to request that their data be deleted?**: Yes

### Data Types Collected

| Category | Data Field | Collected / Shared | Purpose | Ephemeral / Stored |
|---|---|---|---|---|
| **Personal Info** | Name | Collected | App functionality, Account management | Stored |
| **Personal Info** | Email address | Collected | App functionality, Account management, Password recovery | Stored |
| **Personal Info** | User IDs | Collected | App functionality, Analytics, Score history | Stored |
| **App Activity** | Exam Responses & Scores | Collected | CBT exam evaluation, Performance tracking | Stored |
| **App Info & Performance** | Diagnostics / Device Tier | Collected (On-Device Only) | Performance optimization (low-end device adaptation) | Ephemeral (Not transferred off-device) |

---

## 2. Apple App Store: Privacy Nutrition Labels

- **Data Used to Track You**: None
- **Data Linked to You**:
  - Contact Info (Email Address, Name)
  - User Content (Exam Answers, Practice Scores)
  - Identifiers (User ID)
- **Data Not Linked to You**:
  - Diagnostics (Frame performance / device tier estimates)
