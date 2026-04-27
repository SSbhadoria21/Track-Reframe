# Track Reframe 🎬

**Where Stories Come to Life.**

Track Reframe is a premium, cinematic platform designed for indie filmmakers to streamline their creative process from script to screen. Built with cutting-edge AI and a focus on visual excellence, it provides a unified toolkit for writing, planning, and collaborating on film projects.

![Track Reframe Banner](https://github.com/user-attachments/assets/your-banner-placeholder.png) <!-- Note: Replace with actual image after push if desired -->

## ✨ Key Features

- **🎥 Script Continuity AI**: Stuck on a scene? Our AI assists you in continuing your screenplay while maintaining the distinct voice and style of your favorite directors.
- **📄 Production-Ready Formatter**: Transform raw text or handwritten notes into industry-standard screenplay PDFs instantly.
- **🎯 Shot Planner**: Generate comprehensive cinematography breakdowns, including lens selection, lighting setups, and mood boards.
- **🤝 The Crew (Live Chat)**: Connect with writers, directors, and cinematographers in real-time rooms. Find your next DP or build your entire crew within the platform.
- **🏆 Monthly Competitions**: Submit your work to community competitions and get your films seen by industry voices.

## 🚀 Tech Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth**: [Supabase](https://supabase.com/) & [NextAuth.js](https://next-auth.js.org/)
- **AI Engine**: [Google Gemini Pro](https://ai.google.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Email**: [Resend](https://resend.com/)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase Project
- Google Cloud Console Project (for OAuth and Gemini API)

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
   Create a `.env.local` file in the root directory and add the following (see `.env.example` for reference):
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   RESEND_API_KEY=...
   ```

4. **Database Setup:**
   Run the SQL scripts provided in the root directory (`setup_dashboard_features.sql`, `supabase-nextauth-schema.sql`) in your Supabase SQL Editor to initialize the required tables and functions.

5. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application in action.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions from the filmmaking and developer community! Please feel free to open issues or submit pull requests.

---
*Made with ❤️ for Filmmakers.*
