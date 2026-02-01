# Trea's Learning Hub

A personal learning website for high school students, built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication**: Secure login with email/password using Supabase Auth
- **Subjects Management**: Add, edit, and organize school subjects
- **Notes**: Create and manage study notes per subject
- **Voice Recordings**: Record and save audio notes directly in the browser
- **File Uploads**: Upload study materials (PDFs, images, documents)
- **Profile**: Manage student information and track learning progress

## Tech Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Routing**: React Router DOM

## Getting Started

### 1. Prerequisites

- Node.js 18+ 
- A Supabase account (free tier works fine)

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the SQL to create tables and policies

### 3. Create Storage Buckets

In your Supabase Dashboard:
1. Go to Storage
2. Create two buckets:
   - `recordings` (for audio files)
   - `materials` (for uploaded files)
3. Set both buckets to private

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   - `VITE_SUPABASE_URL`: Found in Project Settings > API
   - `VITE_SUPABASE_ANON_KEY`: Found in Project Settings > API

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

### 7. Build for Production

```bash
npm run build
```

## Default Subjects

The app automatically creates these subjects for new users:
- Mathematics
- Indonesian Language
- English
- Physics
- Chemistry
- Biology
- History
- Geography

## Mobile-First Design

This app is designed primarily for smartphone use with:
- Touch-friendly interface (44px minimum touch targets)
- Bottom navigation for easy thumb access
- Optimized forms (prevents zoom on iOS)
- Safe area support for notched devices

## Security

- All pages require authentication
- Row Level Security (RLS) policies ensure users only access their own data
- Files are stored in private Supabase Storage buckets

## Customization

### Changing the Theme Color

Edit `src/index.css` and modify the CSS variables:

```css
--primary: 340 75% 55%; /* Pink - change hue (340) for different colors */
```

### Adding New Default Subjects

Edit `src/pages/SubjectsPage.tsx` and modify the `defaultSubjects` array.

## License

Private - For Trea's personal use only.
