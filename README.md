# EventLog

EventLog is a mobile-based event attendance monitoring system built for the College of Information Technology at the University of Cagayan Valley. It replaces the pen-and-paper attendance sheets used during Contingent Day, Foundation Week, Technolympics, IT Day, and department seminars with QR code scanning, so attendance no longer takes days to consolidate.

This started as our IT capstone project (2024-2025) and went on to win Researcher of the Year at UCV. This repository is the mobile frontend, built with React Native and Expo Router.

## Why this exists

Attendance at UCV events used to run entirely on paper: officers passed around sheets, instructors manually counted attendees per block, and reconciling who showed up for which time slot (morning in/out, afternoon in/out) could take several days after the event ended. That process was slow, easy to manipulate, and wasted paper every semester.

EventLog digitizes the whole flow. Each student gets a personal QR code, officers or instructors scan it at the event, and attendance is logged instantly with timestamps for AM/PM in and out. Reports that used to take days to compile are generated on the spot.

## Who uses it

The app supports four roles, each with a different level of access:

- **User (Student):** views event announcements, generates their personal QR code, and checks their own attendance record.
- **Officer Admin (Student Officers: Governor, Vice Governor, Secretary, Year Level Representatives):** everything a student can do, plus scanning QR codes at events.
- **Instructor Admin:** scans attendance, creates and edits events, and pulls attendance reports by student, block, or department.
- **Super Admin (Dean):** full access, everything instructors can do, plus user management, academic structure management (departments, courses, blocks), and event approval.

Super Admins and Instructor Admins also get a web-based view for browsing and generating attendance reports outside the mobile app.

## Core features

- QR code generation per student, scannable even without an internet connection
- QR code scanning for fast attendance logging (AM in/out, PM in/out)
- Event creation, editing, and approval workflow
- Attendance reports by student, block, and department
- User management (students and admins) and academic structure management (departments, courses, blocks, school years)
- Offline-first attendance storage via local SQLite, synced when connectivity returns
- Real-time updates over WebSockets (for things like account status changes)
- PDF export/printing of attendance records

## Tech stack

- **React Native** (0.83) with **Expo** (SDK 55) and **Expo Router** for file-based navigation
- **expo-sqlite** for local, offline-capable storage
- **expo-camera** for QR scanning
- **socket.io-client** for real-time events
- **Tailwind CSS** conventions on the styling side, React Native primitives for layout
- Backend is a separate service, not part of this repo. This app talks to it over a REST API configured via `EXPO_PUBLIC_API_URL`

## Project structure

```
app/                    Expo Router screens
  (auth)/                Login, signup, password recovery
  (drawer)/(tabs)/       Main app: home, QR, records, account tabs
  (drawer)/eventManagement/     Event CRUD and approval (admin roles)
  (drawer)/userManagement/      Student and admin account management
  (drawer)/academicManagement/  Departments, courses, blocks, school years
  web/                    Web-based attendance record views

components/              Reusable UI (buttons, dropdowns, modals, pickers)
context/                 Auth, Events, and Records React contexts
database/                Local SQLite schema and queries (offline storage)
services/api/            REST API clients, one file per resource
services/                Socket.io handlers for real-time events
constants/               Theme, global styles, static assets
config/                  Runtime config (API URL, QR secret key)
```

## Getting started

You'll need Node.js, npm, and either the Expo Go app or a dev client build on a physical device/simulator.

```bash
npm install
```

Set up your environment variables (used in `config/config.js`):

```
EXPO_PUBLIC_API_URL=<your backend API URL>
EXPO_PUBLIC_QR_SECRET_KEY=<QR signing key, shared with backend>
```

Then run the app:

```bash
npm run start     # Expo dev server (scan with Expo Go or a dev client)
npm run android   # Run on Android
npm run ios       # Run on iOS
npm run web       # Run in browser
```

This app expects a matching backend to be running and reachable at `EXPO_PUBLIC_API_URL`. It is not a standalone service.

## Background

This started as our IT capstone paper, "EVENTLOG: A Mobile-Based Event Attendance Monitoring System Using QR Code for the University of Cagayan Valley," defended May 24, 2025 at UCV's College of Information Technology. It automated a genuinely tedious manual process for our own department, and it's still what earned it Researcher of the Year.

## Authors

Built by Dhanrev S. Mina, Jovilyn M. Areglado, and Jay El P. Lasam, IT students at the University of Cagayan Valley, College of Information Technology. Advised by B-Jay N. Dayaca.
