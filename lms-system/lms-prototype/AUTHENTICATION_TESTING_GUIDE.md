# 🔐 Authentication Testing Guide

## Overview
Simple username/password authentication system for testing course registration and approval workflows.

---

## 🔑 Test Credentials

All test accounts use the password: **`password123`**

### Available Test Accounts

| Username | Password | Role | Channel | Region | Use Case |
|----------|----------|------|---------|--------|----------|
| `TrainerAgencyNorth` | `password123` | TRAINER | Agency | North | Register for courses |
| `LeadAgencyNorth` | `password123` | LEAD_REGION | Agency | North | Approve registrations |
| `Head_agency` | `password123` | HEAD_CHANNEL, LEAD_REGION | Agency | South | Head-level operations |
| `trainer_user` | `password123` | TRAINER | Banca | Middle | Register for courses |
| **`admin_user`** | `password123` | **ADMIN** | **Agency** | **South** | **Module Management, Admin features** |
| **`root_admin`** | `password123` | **ROOT_ADMIN** | **-** | **-** | **Full system access** |
| **`master_user`** | `password123` | **MASTER_ROLE** | **-** | **-** | **Master role features** |

---

## 🧪 Testing Workflow: Course Registration & Approval

### Test Case: Trainer Registration + Lead Approval (Same Channel/Region)

#### **Step 1: Login as Trainer**
```
Username: TrainerAgencyNorth
Password: password123
```
**Expected Result:**
- Login successful
- User info stored in sessionStorage:
  - Role: TRAINER
  - Channel: Agency
  - Region: North

#### **Step 2: Register for a Course**
1. Navigate to **Course List** or **Master Calendar**
2. Find or create a course in **Agency** channel, **North** region
3. Click **Register** button
4. Confirm registration in the modal

**Expected Result:**
- Course status changes: `NEW` → `REGISTERED`
- Primary Trainer set to: TrainerAgencyNorth
- Toast notification: "Registration submitted for approval"

#### **Step 3: Logout**
- Clear browser session or use logout functionality

#### **Step 4: Login as Lead**
```
Username: LeadAgencyNorth
Password: password123
```
**Expected Result:**
- Login successful
- User info stored in sessionStorage:
  - Role: LEAD_REGION
  - Channel: Agency
  - Region: North

#### **Step 5: View Pending Registrations**
1. Navigate to **PIC Calendar**
2. Click **Pending Registrations** tab
3. You should see the course registered by TrainerAgencyNorth

**Expected Result:**
- Course appears in pending list
- Shows trainer name, course details, registration date
- **Approve** and **Reject** buttons visible

#### **Step 6: Approve Registration**
1. Click **Approve** button
2. Confirm approval in modal

**Expected Result:**
- Course status changes: `REGISTERED` → `APPROVED`
- Toast notification: "Registration approved successfully"
- Course removed from pending list

---

## 🔍 Authorization Rules to Verify

### Registration Authorization
- ✅ **Trainer** can register for courses
- ✅ **Lead Region** can register for courses (auto-approved if no higher authority)
- ✅ **Head Channel** can register for courses (auto-approved)
- ❌ **Master Role** cannot register for courses

### Approval Authorization
- ✅ **Lead Region** can approve Trainer registrations (same channel/region)
- ✅ **Head Channel** can approve Lead registrations (same channel)
- ❌ Cannot approve registrations from different channel/region

---

## 🐛 Common Issues & Troubleshooting

### Issue: "Invalid username or password"
**Solution:** 
- Verify username is spelled correctly (case-insensitive)
- Ensure password is exactly: `password123`
- Check `lms-prototype/data/users.json` for user data

### Issue: "Cannot see pending registrations"
**Solution:**
- Verify you're logged in as Lead/Head role
- Check that the course's channel/region matches your user's channel/region
- Ensure course status is `REGISTERED`

### Issue: "Approve button not visible"
**Solution:**
- Verify your role has approval permissions
- Check channel/region match between your user and the course
- Ensure you're not the trainer who registered

---

## 📝 Session Storage Data

After successful login, the following data is stored in `sessionStorage`:

```javascript
sessionStorage.getItem('userId')        // User ID
sessionStorage.getItem('userName')      // Username
sessionStorage.getItem('userEmail')     // Email
sessionStorage.getItem('userRoles')     // JSON array of roles
sessionStorage.getItem('userTeam')      // Team name
sessionStorage.getItem('userChannel')   // Channel (Agency, Banca, etc.)
sessionStorage.getItem('userRegion')    // Region (North, South, etc.)
sessionStorage.getItem('userRole')      // Primary role (lowercase)
```

---

## 🔄 Resetting Test Data

To reset test scenarios:
1. Clear browser `sessionStorage`
2. Reset course statuses in `lms-prototype/data/courses.json`
3. Or restart the development server

---

## 🚀 Quick Start

1. Start the development server:
```bash
npm run dev
```

2. Navigate to: `http://localhost:3000`

3. Login with test credentials

4. Start testing! 🎉

---

## 📌 Notes

- This is a **mock authentication system** for testing purposes only
- Passwords are stored in **plain text** in `users.json` (NOT production-ready)
- No session expiration or token management
- No password reset functionality
- For production, implement proper authentication (JWT, bcrypt, etc.)

