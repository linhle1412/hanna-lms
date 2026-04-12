# FWD LMS - Next.js Project

This is the Next.js version of the FWD Learning Management System prototype.

## Project Structure

```
lms-prototype/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Login page (root route)
│   └── dashboard/          # Dashboard page
├── components/             # React components (to be created)
├── lib/                    # Utility functions and state management
│   └── state.ts           # TypeScript state management
├── public/                 # Static assets
│   └── data/              # JSON data files
├── styles/                 # CSS files
│   └── globals.css        # Global styles
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Features Converted

✅ Login page with username/password authentication
✅ Role-based header with dynamic role selector (multi-role support)
✅ Dashboard page with statistics
✅ State management with TypeScript
✅ Global CSS styles
✅ Data files moved to public folder
✅ TypeScript configuration

## Migration Status

### Completed
- Basic Next.js setup
- Login page (app/page.tsx)
- Dashboard page (app/dashboard/page.tsx)
- State management (lib/state.ts)
- Global styles (styles/globals.css)
- Data files (public/data/*.json)

### To Be Migrated
- Course list page
- Course details page
- Participant management pages
- Trainer management pages
- Calendar pages
- User management pages
- Content management pages
- Reports pages
- Modal components
- Navigation components
- Role-based navigation logic

## Next Steps

1. Convert remaining HTML pages to Next.js pages
2. Create reusable React components (Sidebar, Header, Modal, etc.)
3. Implement proper routing with Next.js App Router
4. Add client-side state management hooks
5. Implement API routes if needed (currently using localStorage)
6. Add proper TypeScript types throughout
7. Convert JavaScript utilities to TypeScript

## Notes

- Currently using localStorage for state persistence (client-side only)
- Role-based navigation needs to be implemented in React components
- All original HTML files remain in the project for reference
- Data files are served from `/public/data/` directory

