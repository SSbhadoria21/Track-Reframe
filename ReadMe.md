# Track Reframe 🎬

**Where Stories Come to Life.**

Track Reframe is a premium, cinematic web platform designed to empower indie filmmakers, writers, and producers. It streamlines the creative process from the blank page to the final cut. Built with cutting-edge web technologies, real-time collaboration, and AI, it provides a unified toolkit for writing, planning, networking, and competing in the film industry.

![Track Reframe Logo](./src/app/icon.png)

---

## ✨ Project Vision & Architecture

Track Reframe solves the fragmentation in the indie film industry. Instead of using separate apps for screenwriting, budgeting, networking, and festival tracking, Track Reframe consolidates the entire pre-production and networking pipeline into a single, cohesive, premium browser experience. 

The architecture relies heavily on modern web paradigms:
- **Serverless Edge Functions:** Leveraging Next.js App Router for high-performance SSR and API routes.
- **Real-Time Data Sync:** Utilizing Supabase Realtime and Yjs for live multiplayer experiences (chat, document editing).
- **Generative AI Integration:** Powered by Google Gemini Pro, turning the platform into an active creative partner rather than just a passive tool.
- **Theme-Aware UI:** A meticulously crafted design system utilizing Tailwind CSS v4 semantic tokens to provide a flawless experience across both cinematic Dark Mode and accessible Light Mode.

---

## 🛠️ Comprehensive Features

### 1. The Main Feed & Dashboard (`/feed` & `/profile`)
- **Activity Feed:** A social feed tailored for filmmakers to post BTS (behind-the-scenes) photos, seek feedback on scripts, and announce casting calls.
- **Dynamic Profile:** Every creator gets a personalized dashboard showcasing their roles (e.g., Writer-Director, DP), bio, followers, uploaded films, and accumulated "Coins" (platform currency).
- **Real-Time Notifications:** Live alerts for likes, comments, and new followers using Supabase channels.

### 2. The Studio (Pre-Production Hub) (`/studio`)
The core creative engine of the platform, checking for authentication before granting access to premium tools:
- **Script Continuity AI:** Stuck on a scene? Our AI analyzes your script's tone and assists you in continuing your screenplay, mimicking the stylistic voice of renowned directors (or a custom style you define).
- **Script Formatter (OCR & Formatting):** Drop a handwritten page, a photo of notes, or raw unformatted text. The AI leverages vision models to extract the text and instantly converts it into a production-ready screenplay PDF with standard margins, scene headings, and character formatting.
- **Real-Time Collaborative Editor:** A WYSIWYG editor built on Tiptap and Yjs. Format standard screenplay elements effortlessly, and collaborate with writing partners in real-time (Google Docs style) via WebRTC.
- **Shot Planner Assistant:** Generate comprehensive cinematography breakdowns—including lens selection, lighting setups, and mood concepts—based directly on scene descriptions.
- **Call Sheets & Budgeting:** Tools for generating daily call sheets and tracking above-the-line/below-the-line expenses with visual analytics.

### 3. Community & Networking (`/community`)
- **Live Chat & Rooms:** Connect with writers, directors, and cinematographers in real-time. Features include dedicated rooms (e.g., "NEO_NOIR_DPS"), presence indicators, and live messaging.
- **Watch Together:** Synchronized video playback within chat rooms to review references and dailies with your team.

### 4. Discover & Festivals (`/discover` & `/discover/festivals`)
- **Festival Intelligence:** Keep an eye on global film festival deadlines (e.g., Cannes, Sundance, TIFF) with advanced filtering, status tracking, and submission pipeline management.
- **Talent Discovery:** Browse through creator profiles to find your next DP, Editor, or Lead Actor.

### 5. Competitions (`/competitions`)
- **Monthly Challenges:** Submit your scripts and films to official Track Reframe community competitions (e.g., "Neon Noir Short Film").
- **Jury Suite & Leaderboards:** A secure interface for judges to review submissions, coupled with live public leaderboards showcasing the top-rated entries.

---

## 🚀 Tech Stack

Track Reframe is engineered for performance, scalability, and real-time interactions.

### Frontend
- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router) & React 19
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) using a semantic token system for robust Light/Dark mode support.
- **Animations:** [Framer Motion](https://www.framer.com/motion/) for premium, cinematic micro-interactions and page transitions.
- **Icons & UI:** Custom SVG icons and a highly bespoke component library.

### Backend & Data
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Storage, Realtime)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Google OAuth integration & custom credential flows).
- **Real-Time Sync:** [Yjs](https://yjs.dev/), `y-webrtc`, and [Tiptap](https://tiptap.dev/) for the screenplay editor.
- **AI Engine:** [Google Gemini Pro API](https://ai.google.dev/) for script generation, OCR formatting, and shot planning.

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- A Supabase Project (Database & Auth)
- Google Cloud Console Project (for Google OAuth and Gemini API)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/track-reframe.git
   cd track-reframe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Authentication
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000

   # Database (Supabase)
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...

   # APIs
   GEMINI_API_KEY=...
   ```

4. **Database Setup:**
   Run the necessary SQL migration scripts in your Supabase SQL Editor to instantiate tables for `users`, `follows`, `notifications`, `competitions`, and setup Row Level Security (RLS).

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to see the application in action.

---

## 🎨 Design Philosophy
Track Reframe rejects generic corporate UI in favor of a "filmmaker-first" aesthetic. 
- **Typography:** Utilizing `Inter` for UI, `Playfair Display` for cinematic headers, and `JetBrains Mono` for screenplay and technical data.
- **Colors:** A sleek dark mode (`#0A0A0F`) with vibrant Amber (`#FFB800`) accents, balanced with a meticulously mapped Light Mode using semantic variables (`bg-surface`, `bg-background`, `border-border-default`) to ensure high contrast and readability.
- **Micro-interactions:** Subtle hover effects, pulsing recording lights, and spinning film reels make the platform feel alive and responsive.

---
*Made with ❤️ for Filmmakers.*
