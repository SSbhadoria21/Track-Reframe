# Track Reframe - Detailed Project Overview

## 🎬 Introduction

**Track Reframe** is a premium, web-based, cinematic ecosystem designed explicitly for indie filmmakers, writers, and producers. It bridges the gap between creative storytelling and the logistical demands of film production by providing a comprehensive, unified platform. From drafting your first scene in a real-time collaborative screenplay editor to organizing your crew, managing budgets, and entering film competitions, Track Reframe acts as your digital film studio.

Built with cutting-edge web technologies, real-time synchronization, and AI, it seeks to democratize premium production tools.

---

## 🏗️ Architecture & Tech Stack

Track Reframe is built upon a modern, highly scalable JavaScript/TypeScript stack:

### Core Framework
- **Next.js 16 (App Router):** Utilized for server-side rendering, API routes, optimized routing, and robust React server components.
- **React 19:** Leveraging the latest React features for highly interactive client components.
- **TypeScript:** Ensuring type safety and predictable code across the entire codebase.

### Styling & UI
- **Tailwind CSS v4:** For rapid, utility-first styling with custom themes and cinematic design tokens.
- **Framer Motion:** Powering micro-interactions, smooth page transitions, and complex interactive animations.
- **Lucide React:** A clean, customizable iconography system.
- **clsx & tailwind-merge:** For conditional, conflict-free class name merging.

### Real-Time Collaboration & Editor
- **Tiptap / ProseMirror:** A headless editor framework used to build the core Screenplay editor. A custom `ScreenplayExtension` parses and formats text into industry-standard screenplay elements (Scene Heading, Action, Character, Dialogue, Parenthetical, Transition).
- **Yjs:** A CRDT (Conflict-free Replicated Data Type) framework powering the real-time collaborative editing features.
- **y-webrtc / y-websocket:** Signaling and network layers enabling multiple users to co-write scripts seamlessly, seeing each other's cursors and changes in real-time.

### Database, Backend, & Authentication
- **Supabase:** Used as the primary database (PostgreSQL), storage (for images/videos), and real-time subscription engine.
- **NextAuth.js (Auth.js) & @auth/supabase-adapter:** Handling secure user authentication (OAuth, magic links, credentials) and syncing sessions directly with Supabase.

### Artificial Intelligence
- **Google Gemini Pro (@google/genai, @google/generative-ai):** Deeply integrated to serve as a creative partner. Features include "Script Continuity" (AI writing assistance that adapts to the writer's style), Shot Planning generation, and dynamic chat assistance for film production queries.

### State Management & Utilities
- **Zustand:** A small, fast, and scalable bearbones state-management solution used for managing global UI state, user sessions, and editor states.
- **React Hook Form & Zod:** For complex form handling, validation, and type-safe schema definitions.
- **date-fns:** For robust date formatting and time zone management.
- **Resend:** Managing transactional emails (invites, notifications, password resets).

### Exporting & Rendering
- **jspdf, html2canvas, html-to-image:** Used for converting rendered web elements (like the formatted screenplay or shot lists) directly into downloadable, production-ready PDF files.

---

## 🧩 Core Modules & Features

### 1. The Studio (Pre-Production Hub)
The Studio is the heart of the creative process in Track Reframe.
- **Collaborative Screenplay Editor:** A WYSIWYG editor strictly formatted for standard screenplay rules. Multiple writers can join a session and write simultaneously.
- **Call Sheets:** Automated generation of daily call sheets. Add locations, schedules, and crew details, and distribute them digitally.
- **Budgeting:** Granular tracking of production expenses, above-the-line and below-the-line costs, utilizing Recharts for visual expense breakdowns.

### 2. Community & Networking (The Crew)
A built-in social ecosystem tailored for film professionals.
- **Real-Time Rooms:** Users can create or join chat rooms using unique access codes.
- **Live Chat & Watch Together:** Integrated WebRTC and real-time chat (via Supabase/Yjs) allow crew members to watch reference material together and discuss plans synchronously.
- **Member Directories:** Discover cinematographers, sound mixers, actors, and directors based on their profiles and portfolios.

### 3. Competitions & Festivals
Track Reframe actively fosters talent through its competition ecosystem.
- **Submission Portal:** A complex pipeline for users to submit scripts or short films to monthly Track Reframe competitions.
- **Jury Suite (Round 2):** A dedicated interface for judges to review, rate, and critique submissions securely.
- **Dynamic Leaderboards:** Real-time ranking of top submissions based on community votes or jury scores.
- **Festival Tracker:** Keep track of external film festival deadlines, submission statuses, and premier dates.

### 4. AI Copilot (Gemini Integration)
The AI is not just a chatbot; it is contextually aware of the user's project.
- **Script Continuity:** When a writer hits a block, the AI analyzes the previous scenes and suggests the next action or dialogue line in the same tone.
- **Shot Planner Assistant:** Automatically generates suggested shot lists, camera angles, and lighting setups based on the textual description of a scene.

### 5. Social Feed
A localized social network for users to share updates, behind-the-scenes photos, trailers, and seek feedback from the community.

---

## 📂 Project Structure Overview

```text
Track_Reframe/
├── public/                 # Static assets (images, icons, fonts)
├── supabase/               # Supabase configuration, edge functions, migrations
├── src/
│   ├── app/                # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── (auth)/         # Authentication routes (Login, Register)
│   │   ├── (main)/         # Main application shell (Feed, Profile, Community)
│   │   ├── dashboard/      # Admin and user specific dashboard
│   │   ├── api/            # Serverless API routes (AI endpoints, email, Supabase webhooks)
│   ├── components/         # Reusable React components
│   │   ├── studio/         # Editor, Budgets, Call Sheets components
│   │   ├── community/      # Chat rooms, Watch Together, Member lists
│   │   ├── competitions/   # Jury suite, Leaderboards, Submission forms
│   │   ├── feed/           # Social feed posts and comments
│   │   ├── layout/         # Navigation, sidebars, headers
│   │   └── ...
│   ├── lib/                # Core library functions (Supabase client, Gemini initialization)
│   ├── store/              # Zustand global state stores
│   └── utils/              # Helper functions, formatters, constants
├── package.json            # Project dependencies and scripts
└── ...
```

---

## 🔒 Security & Data Integrity

- **Row Level Security (RLS):** Implemented at the Supabase Postgres level to ensure users can only access and modify their own projects, scripts, and crew data.
- **Session Management:** Handled securely via NextAuth and JWTs, with middleware protecting private routes in Next.js.
- **WebRTC Security:** Peer-to-peer connections for the collaborative editor are negotiated securely through a centralized signaling server, but data is transmitted directly between peers.

---

## 🚀 Future Roadmap (Conceptual)

- **Mobile App Integration:** Wrapping the web application in React Native or similar technologies for on-set offline use.
- **Video Rendering Pipelines:** Direct integration with video review tools for post-production feedback.
- **Advanced Asset Management:** 3D model viewing and location scouting integrations using WebGL.

---

