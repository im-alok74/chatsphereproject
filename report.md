# ChatSphere — Project Tech Stack Report

**Date:** March 10, 2026

---

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | ^18.3.1 | UI library |
| TypeScript | ^5.8.3 | Type-safe JavaScript |
| Vite | ^5.4.19 | Build tool & dev server |
| Tailwind CSS | ^3.4.17 | Utility-first CSS framework |
| shadcn/ui (Radix UI) | Various | Accessible UI component primitives |
| React Router DOM | ^6.30.1 | Client-side routing |
| TanStack React Query | ^5.83.0 | Server state management & caching |
| Lucide React | ^0.462.0 | Icon library |
| Framer Motion (via Tailwind Animate) | ^1.0.7 | CSS animations |
| React Hook Form | ^7.61.1 | Form state management |
| Zod | ^3.25.76 | Schema validation |
| Recharts | ^2.15.4 | Charting / data visualization |
| date-fns | ^3.6.0 | Date utility library |
| Sonner | ^1.7.4 | Toast notifications |
| cmdk | ^1.1.1 | Command palette |
| Embla Carousel | ^8.6.0 | Carousel component |
| Emoji Mart | ^1.1.1 | Emoji picker |
| Vaul | ^0.9.9 | Drawer component |
| React Resizable Panels | ^2.1.9 | Resizable panel layouts |

## Backend 

| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database |
| Authentication | User signup, login, session management |
| Realtime | WebSocket subscriptions for live updates |
| Edge Functions (Deno) | Serverless backend functions (e.g., smart replies) |
| Row-Level Security (RLS) | Data access control per user |
| Storage | File/image storage |

## Database Tables

| Table | Description |
|---|---|
| `profiles` | User profiles (username, avatar, bio, online status) |
| `chats` | Chat rooms (1-on-1 and group) |
| `chat_members` | Chat membership mapping |
| `messages` | Chat messages with reply support |
| `message_reactions` | Emoji reactions on messages |
| `pinned_messages` | Pinned messages per chat |
| `polls` | In-chat polls |
| `poll_votes` | Poll vote tracking |
| `bill_splits` | Bill splitting feature |
| `bill_split_shares` | Individual shares in a bill split |
| `scheduled_messages` | Messages scheduled for future delivery |

## Dev Tooling

| Tool | Version | Purpose |
|---|---|---|
| ESLint | ^9.32.0 | Code linting |
| Vitest | ^3.2.4 | Unit testing |
| Playwright | ^1.57.0 | E2E testing |
| PostCSS + Autoprefixer | ^8.5.6 / ^10.4.21 | CSS processing |
| @vitejs/plugin-react-swc | ^3.11.0 | Fast React compilation via SWC |

## Key Features

- **Real-time messaging** with typing indicators
- **Group chats** with member management
- **Message reactions** (emoji)
- **Message pinning & search**
- **Polls** (anonymous & timed)
- **Bill splitting**
- **Scheduled messages**
- **Smart replies** (AI-powered via Edge Function)
- **Voice recording**
- **Profile settings** with avatar, bio, status
- **Dark/light theme** support

---

*Generated for ChatSphere project.*
