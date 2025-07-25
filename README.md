# 🗺️ Transformation Map App

A gamified platform for personal transformation and goal achievement.

---

## ✨ About the Project

This project is a web application designed to help users achieve their personal goals (e.g., weight loss, muscle gain) by turning the process into an engaging game. Users can set their goals, get a personalized transformation plan, and track their progress on a visual map.

### 🚀 Core Features (MVP)

*   **Gamified Onboarding:** An interactive questionnaire to gather user goals and parameters.
*   **Visual Transformation Map:** A personalized, game-like map that visualizes the user's journey.
*   **Progress Tracking:** Simple tools to track weight and mark task completion.
*   **Multi-language Support:** Full Russian and English localization with easy language switching.
*   **Modern Tech Stack:** Built with the latest technologies for speed and reliability.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **Animated Background:** [@tsparticles/react](https://particles.js.org/)
*   **Internationalization:** [next-intl](https://next-intl.dev/) (Russian & English)
*   **Database & Auth:** [Supabase](https://supabase.com)
*   **ORM:** [Prisma](https://www.prisma.io/) (to be integrated)

---

## 🎨 Typography

*   **Font:** The project uses the [**Inter**](https://fonts.google.com/specimen/Inter) font, served by `next/font/google` for optimal performance and to avoid layout shifts.

---

## ⚙️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/Bloodixi/transformation-map-app.git
    ```
2.  **Install NPM packages**
    ```sh
    npm install
    ```
3.  **Set up environment variables**
    *   Rename `.env.example` to `.env.local`.
    *   Fill in your Supabase project URL and anon key.
4.  **Run the development server**
    ```sh
    npm run dev
    ```

Now, the application should be running on [http://localhost:3000](http://localhost:3000).

## 🌐 Internationalization

The application supports two languages:
- **Russian (default):** [http://localhost:3000/ru](http://localhost:3000/ru)
- **English:** [http://localhost:3000/en](http://localhost:3000/en)

Language can be switched using the dropdown in the top-right corner. The app automatically redirects `/` to `/ru`.

**For developers:** See [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) for detailed guidelines on adding multilingual content.