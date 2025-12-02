# ABK HomeDesign - E-Commerce Platform

## Overview
ABK HomeDesign is a Turkish e-commerce platform for home textile products. Built with React frontend and Express backend, using Firebase Firestore as the database.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, Radix UI
- **Backend**: Express.js with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Image Storage**: ImgBB API
- **Payment**: iyzico (optional)

## Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── contexts/     # React contexts (Auth, Cart, Favorites)
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Firebase, utilities
│   │   └── pages/        # Page components
│   └── index.html
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── static.ts         # Static file serving
│   └── vite.ts           # Vite dev server setup
├── shared/               # Shared TypeScript schemas
│   └── schema.ts
└── attached_assets/      # Uploaded assets
```

## Running the Application
- Development: `npm run dev` (runs on port 5000)
- Production build: `npm run build`
- Production start: `npm run start`

## Environment Variables
The following environment variables are required:
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `FIREBASE_ADMIN_PRIVATE_KEY` - Firebase Admin SDK private key
- `IMGBB_API_KEY` - ImgBB API key for image uploads (optional)
- `IYZICO_API_KEY` - iyzico payment API key (optional)
- `IYZICO_SECRET_KEY` - iyzico payment secret key (optional)

## Features
- Product catalog with categories
- Shopping cart
- User authentication (Email/Password and Google)
- Order management
- Admin dashboard
- Customer support tickets
- Invoice generation
- Hero banner management

## Recent Changes
- November 30, 2025: Initial setup for Replit environment
  - Configured Vite with allowedHosts for Replit proxy
  - Set up environment variables for Firebase
  - Configured workflow for development server
