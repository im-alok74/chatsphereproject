# ChatSphere — Comprehensive Project Report

**Report Date:** March 10, 2026  
**Project Name:** ChatSphere  
**Project Type:** Real-Time Web-Based Chat Application  
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack Overview](#2-technology-stack-overview)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema & Design](#5-database-schema--design)
6. [Authentication System](#6-authentication-system)
7. [Real-Time Communication](#7-real-time-communication)
8. [Feature Breakdown](#8-feature-breakdown)
9. [UI/UX Design System](#9-uiux-design-system)
10. [Component Architecture](#10-component-architecture)
11. [Custom Hooks](#11-custom-hooks)
12. [Serverless Functions](#12-serverless-functions)
13. [File Storage](#13-file-storage)
14. [Testing Infrastructure](#14-testing-infrastructure)
15. [Build & Development Tooling](#15-build--development-tooling)
16. [Security Considerations](#16-security-considerations)
17. [Performance Optimizations](#17-performance-optimizations)
18. [Project File Structure](#18-project-file-structure)
19. [Dependencies Inventory](#19-dependencies-inventory)
20. [Known Limitations & Planned Features](#20-known-limitations--planned-features)

---

## 1. Executive Summary

ChatSphere is a full-stack, real-time messaging application built as a Single Page Application (SPA). It provides one-on-one and group messaging capabilities with advanced features such as emoji reactions, message pinning, voice recording, in-chat polls, bill splitting, AI-powered smart replies, scheduled messages, and user profile management. The application supports both dark and light themes and is fully responsive across desktop and mobile viewports.

The application is built using modern web technologies with **React 18** on the frontend and **Supabase** (PostgreSQL + Auth + Realtime + Storage + Edge Functions) as the backend-as-a-service platform.

---

## 2. Technology Stack Overview

### Frontend Stack

| Technology | Version | Role |
|---|---|---|
| **React** | ^18.3.1 | Core UI library using functional components and hooks |
| **TypeScript** | ^5.8.3 | Static type checking across the entire codebase |
| **Vite** | ^5.4.19 | Build tool providing fast HMR and optimized production builds |
| **Tailwind CSS** | ^3.4.17 | Utility-first CSS framework for all styling |
| **React Router DOM** | ^6.30.1 | Client-side routing with protected routes |
| **TanStack React Query** | ^5.83.0 | Asynchronous state management and server-state caching |
| **Radix UI (shadcn/ui)** | Various | Accessible, unstyled UI component primitives |
| **Lucide React** | ^0.462.0 | Icon library (SVG-based, tree-shakeable) |

### Backend Stack

| Technology | Role |
|---|---|
| **Supabase (PostgreSQL)** | Relational database with Row-Level Security (RLS) |
| **Supabase Auth** | User authentication (email/password with email verification) |
| **Supabase Realtime** | WebSocket-based live subscriptions for messages, typing indicators, and reactions |
| **Supabase Storage** | File storage for chat images, voice messages, and user avatars |
| **Supabase Edge Functions (Deno)** | Serverless backend functions for AI-powered smart replies |

### Supporting Libraries

| Library | Version | Purpose |
|---|---|---|
| **date-fns** | ^3.6.0 | Lightweight date formatting and manipulation |
| **Zod** | ^3.25.76 | Runtime schema validation for forms |
| **React Hook Form** | ^7.61.1 | Performant form state management |
| **Sonner** | ^1.7.4 | Minimal toast notification system |
| **Emoji Mart** | ^1.1.1 / ^1.2.1 | Full-featured emoji picker component with data |
| **cmdk** | ^1.1.1 | Command palette / command-k interface |
| **Embla Carousel** | ^8.6.0 | Touch-friendly carousel component |
| **Vaul** | ^0.9.9 | Mobile-friendly drawer/bottom-sheet component |
| **React Resizable Panels** | ^2.1.9 | Draggable resizable panel layouts |
| **Recharts** | ^2.15.4 | Data visualization and charting library |
| **class-variance-authority** | ^0.7.1 | Component variant management for design system |
| **clsx** | ^2.1.1 | Conditional CSS class name utility |
| **tailwind-merge** | ^2.6.0 | Intelligent Tailwind class deduplication |
| **tailwindcss-animate** | ^1.0.7 | Animation utilities for Tailwind CSS |
| **input-otp** | ^1.4.2 | OTP (One-Time Password) input component |
| **next-themes** | ^0.3.0 | Theme management (used alongside custom theme hook) |

---

## 3. Frontend Architecture

### Application Entry Point

The application bootstraps through `src/main.tsx` which renders the root `App` component. The `App` component (`src/App.tsx`) establishes the following provider hierarchy:

```
QueryClientProvider (TanStack React Query)
  └── TooltipProvider (Radix UI)
       └── Toaster (toast notifications)
            └── BrowserRouter (React Router)
                 └── AuthProvider (custom authentication context)
                      └── Routes
```

### Routing Configuration

| Route | Component | Access |
|---|---|---|
| `/` | Redirects to `/chat` | Public (redirects) |
| `/login` | `Login` | Public (redirects authenticated users to `/chat`) |
| `/register` | `Register` | Public (redirects authenticated users to `/chat`) |
| `/chat` | `Chat` | Protected (redirects unauthenticated users to `/login`) |
| `*` | `NotFound` | Catch-all 404 page |

### State Management Strategy

The application uses a **hybrid state management** approach:

1. **React Context** (`AuthContext`) — Global authentication state including user session, profile data, and auth methods
2. **TanStack React Query** — Server state caching and synchronization (configured but primarily used via custom hooks)
3. **Local Component State** (`useState`) — UI-specific state (active chat, dialogs, form fields)
4. **Supabase Realtime** — Live data synchronization via WebSocket channels for messages, reactions, and presence

### Responsive Design

The application uses the `useIsMobile` hook (breakpoint at 768px) to render different layouts:

- **Desktop:** Side-by-side layout with a fixed-width sidebar (320px / 384px on large screens) and a flexible chat window
- **Mobile:** Full-screen views with a back navigation button to switch between the chat list and the active conversation

---

## 4. Backend Architecture

### Supabase Services Used

| Service | Usage |
|---|---|
| **PostgreSQL Database** | 11 tables storing all application data |
| **Row-Level Security (RLS)** | Fine-grained access control at the database row level |
| **Authentication** | Email/password signup with email verification, session management via JWT |
| **Realtime** | PostgreSQL change subscriptions (`postgres_changes`) and Presence channels |
| **Storage** | Two buckets: `chat-images` (messages + voice) and `avatars` (profile photos) |
| **Edge Functions** | 1 deployed function (`smart-replies`) for AI-powered reply suggestions |

### Database Function

The database includes a custom function `is_chat_member(_chat_id uuid, _user_id uuid)` that returns a boolean indicating whether a given user is a member of a specific chat. This function is used in RLS policies to enforce data access control.

---

## 5. Database Schema & Design

### Entity-Relationship Overview

The database consists of 11 tables organized around the core chat functionality:

#### Core Tables

##### `profiles`
Stores extended user information linked to `auth.users` via `user_id`.

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | No | Primary key |
| `user_id` | UUID | — | No | Reference to auth user (unique) |
| `username` | TEXT | — | No | Display name |
| `avatar_url` | TEXT | — | Yes | URL to avatar image in storage |
| `bio` | TEXT | `''` | No | User biography (max 160 chars in UI) |
| `status_message` | TEXT | `''` | No | Current status (e.g., "Online", "Busy") |
| `is_online` | BOOLEAN | `false` | No | Online presence indicator |
| `last_seen` | TIMESTAMPTZ | — | Yes | Last activity timestamp |
| `created_at` | TIMESTAMPTZ | `now()` | No | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | No | Last profile update timestamp |

##### `chats`
Represents a conversation — either 1-on-1 or group.

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | No | Primary key |
| `is_group` | BOOLEAN | `false` | No | Whether this is a group chat |
| `name` | TEXT | — | Yes | Group chat name (null for 1-on-1) |
| `avatar_url` | TEXT | — | Yes | Group avatar URL |
| `created_at` | TIMESTAMPTZ | `now()` | No | Chat creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | No | Last update timestamp |

##### `chat_members`
Many-to-many junction table linking users to chats.

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | No | Primary key |
| `chat_id` | UUID | — | No | FK → `chats.id` |
| `user_id` | UUID | — | No | FK → auth user ID |
| `joined_at` | TIMESTAMPTZ | `now()` | No | When the user joined the chat |

##### `messages`
Stores all chat messages including text, images, and voice messages.

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | No | Primary key |
| `chat_id` | UUID | — | No | FK → `chats.id` |
| `sender_id` | UUID | — | No | User ID of the message sender |
| `content` | TEXT | — | Yes | Text content of the message |
| `image_url` | TEXT | — | Yes | URL to attached image or voice recording |
| `reply_to_id` | UUID | — | Yes | FK → `messages.id` (threaded replies) |
| `seen` | BOOLEAN | `false` | No | Read receipt status |
| `created_at` | TIMESTAMPTZ | `now()` | No | Message timestamp |

#### Feature Tables

##### `message_reactions`
Emoji reactions on messages.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `message_id` | UUID | — | FK → `messages.id` |
| `user_id` | UUID | — | Reacting user |
| `emoji` | TEXT | — | Emoji character (e.g., "👍") |
| `created_at` | TIMESTAMPTZ | `now()` | Reaction timestamp |

##### `pinned_messages`
Messages pinned within a chat for quick reference.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `chat_id` | UUID | — | FK → `chats.id` |
| `message_id` | UUID | — | FK → `messages.id` |
| `pinned_by` | UUID | — | User who pinned the message |
| `pinned_at` | TIMESTAMPTZ | `now()` | When it was pinned |

##### `polls`
In-chat poll creation.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `chat_id` | UUID | — | FK → `chats.id` |
| `created_by` | UUID | — | Poll creator |
| `question` | TEXT | — | Poll question (max 200 chars) |
| `options` | JSONB | `[]` | Array of option strings |
| `is_anonymous` | BOOLEAN | `false` | Whether votes are anonymous |
| `closes_at` | TIMESTAMPTZ | — | Optional auto-close timestamp |
| `created_at` | TIMESTAMPTZ | `now()` | Creation timestamp |

##### `poll_votes`
Individual votes on poll options.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `poll_id` | UUID | — | FK → `polls.id` |
| `user_id` | UUID | — | Voting user |
| `option_index` | INTEGER | — | Index of the selected option |
| `created_at` | TIMESTAMPTZ | `now()` | Vote timestamp |

##### `bill_splits`
Group bill splitting feature.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `chat_id` | UUID | — | FK → `chats.id` |
| `created_by` | UUID | — | User who created the bill |
| `title` | TEXT | — | Bill description |
| `total_amount` | NUMERIC | — | Total bill amount |
| `currency` | TEXT | `'USD'` | Currency code |
| `status` | TEXT | `'active'` | Bill status |
| `created_at` | TIMESTAMPTZ | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | Last update timestamp |

##### `bill_split_shares`
Individual shares within a bill split.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `bill_id` | UUID | — | FK → `bill_splits.id` |
| `user_id` | UUID | — | Member responsible for this share |
| `amount` | NUMERIC | — | Amount owed |
| `paid` | BOOLEAN | `false` | Whether this share is paid |
| `paid_at` | TIMESTAMPTZ | — | Payment timestamp |

##### `scheduled_messages`
Messages scheduled for future delivery.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `chat_id` | UUID | — | FK → `chats.id` |
| `sender_id` | UUID | — | Scheduling user |
| `content` | TEXT | — | Message content |
| `scheduled_at` | TIMESTAMPTZ | — | Scheduled delivery time |
| `sent` | BOOLEAN | `false` | Whether the message has been sent |
| `created_at` | TIMESTAMPTZ | `now()` | Creation timestamp |

### Foreign Key Relationships

```
profiles.user_id ←── auth.users.id (logical, no FK constraint)
chat_members.chat_id ──→ chats.id (CASCADE DELETE)
messages.chat_id ──→ chats.id
messages.reply_to_id ──→ messages.id (self-referencing)
message_reactions.message_id ──→ messages.id
pinned_messages.chat_id ──→ chats.id
pinned_messages.message_id ──→ messages.id
polls.chat_id ──→ chats.id
poll_votes.poll_id ──→ polls.id
bill_splits.chat_id ──→ chats.id
bill_split_shares.bill_id ──→ bill_splits.id
scheduled_messages.chat_id ──→ chats.id
```

---

## 6. Authentication System

### Implementation Details

Authentication is managed through a custom `AuthContext` React context (`src/contexts/AuthContext.tsx`) that wraps Supabase Auth.

**Supported Methods:**
- Email + Password signup with email verification
- Email + Password sign-in

**Auth Flow:**

1. **Registration** (`/register`):
   - User provides username (min 3 chars), email, and password (min 6 chars)
   - Password strength indicators check for minimum length and uppercase characters
   - Username is passed as `user_metadata` in the signup call
   - A database trigger automatically creates a `profiles` row upon user creation
   - Email verification is required before the user can sign in

2. **Login** (`/login`):
   - Email + password authentication
   - On success, Supabase Auth sets a JWT session token stored in `localStorage`
   - Session auto-refresh is enabled via Supabase client configuration

3. **Session Management:**
   - `onAuthStateChange` listener detects login/logout events
   - `getSession()` is called on mount to restore existing sessions
   - Profile data is fetched immediately after authentication
   - Sessions persist across page reloads via `localStorage`

4. **Sign Out:**
   - Clears Supabase session
   - Resets user, session, and profile state to null
   - Redirects to `/login`

**Profile Management:**
- Users can update: username, avatar, bio (max 160 chars), status message (max 50 chars)
- Pre-defined status options: Online, Busy, Away, At work, Gaming, Studying
- Custom status messages are also supported
- Avatar upload via Supabase Storage (`avatars` bucket) with upsert support
- Account deletion removes the profile record and signs the user out

---

## 7. Real-Time Communication

### Message Delivery

The application uses **Supabase Realtime PostgreSQL Change Data Capture (CDC)** for live message delivery:

1. **Channel per chat:** Each active chat subscribes to a channel named `messages-{chatId}`
2. **INSERT events:** New messages are appended to the local state with duplicate prevention
3. **UPDATE events:** Message updates (e.g., read receipts) are reflected in real-time
4. **Auto-mark as seen:** Incoming messages from other users are automatically marked as `seen = true`

### Chat List Updates

A separate channel (`chat-list-updates`) listens for any `INSERT` event on the `messages` table, triggering a full chat list refresh to update last messages and unread counts.

### Typing Indicators

Implemented using **Supabase Realtime Presence** (not database CDC):

1. A Presence channel named `typing-{chatId}` is created per chat
2. When a user types, `channel.track({ is_typing: true, username })` is called
3. Typing status automatically resets after 3 seconds of inactivity
4. The `presenceState()` is synced to display "X is typing..." or "Several people typing..."

### Reactions

A channel named `reactions-{chatId}` listens for all events (`*`) on `message_reactions`, refetching all reactions for the current chat on any change.

---

## 8. Feature Breakdown

### 8.1 One-on-One Messaging
- Search users by username (minimum 2 characters)
- Automatically finds existing chats or creates new ones
- Displays online status with a green indicator dot
- Shows "Active now" or "Offline" status in the chat header

### 8.2 Group Chats
- Multi-step creation flow: select members → name the group
- Member count displayed in header with online member count
- Group avatar support
- All group-specific features (bill splitting) are contextually shown

### 8.3 Message Features
- **Text messages** — Rich text with whitespace preservation and word wrapping
- **Image sharing** — File upload via hidden input, stored in `chat-images` bucket, displayed with lazy loading
- **Voice messages** — MediaRecorder API captures audio as WebM, uploads to storage, displays with HTML5 `<audio>` player, shows duration
- **Reply threading** — Reply to specific messages with visual quote preview (sender name + truncated content)
- **Read receipts** — Single check (sent) → double blue check (seen)
- **Message deletion** — Users can delete their own messages
- **Timestamps** — HH:mm format on each message

### 8.4 Emoji Reactions
- Quick reaction picker appears on message hover
- Toggle behavior: clicking an existing reaction removes it, clicking a new one adds it
- Grouped display: reactions are aggregated by emoji with count badges
- Visual distinction for own reactions (highlighted border and background)

### 8.5 Message Pinning
- Pin messages via hover action button
- Pinned messages banner shows count with expandable list
- Click a pinned message to scroll to it in the chat with a temporary highlight ring
- Unpin messages from the pinned messages panel

### 8.6 Message Search
- Search within the current chat
- Click results to scroll to and highlight the matching message

### 8.7 Polls
- Create polls with 2–6 options and a question (max 200 chars)
- Poll creation generates a formatted message in the chat
- Anonymous voting option
- Optional auto-close timestamp

### 8.8 Bill Splitting (Group Chats Only)
- Create bills with a title and total amount
- Automatically calculates equal split per member
- Creator is auto-marked as paid
- Visual progress bar showing paid/total ratio
- Members can mark their share as paid
- Color-coded status: green (paid), orange (pending)
- Bill list view with all active bills

### 8.9 Scheduled Messages
- Compose a message and schedule it for a future date/time
- Validation ensures the selected time is in the future
- Stored in `scheduled_messages` table with `sent` flag

### 8.10 AI-Powered Smart Replies
- Automatically triggered when the last message is from another user
- Sends the last 5–6 messages to a serverless edge function
- The edge function calls an AI model (Google Gemini 2.5 Flash Lite) to generate 3 contextual reply suggestions
- Suggestions appear as clickable pills above the message input
- Each suggestion is under 30 characters
- Handles rate limiting (429) and payment errors (402) gracefully

### 8.11 Profile Management
- Edit username, bio, and status message
- Upload/change avatar photo
- Pre-defined status options with emoji indicators
- Dark/light theme toggle
- Account deletion with confirmation dialog

### 8.12 Theme Support
- Dark mode (default) and light mode
- Theme preference persisted in `localStorage` under key `chatsphere-theme`
- CSS variables switch via `[data-theme="light"]` selector
- Full design token coverage for both themes

---

## 9. UI/UX Design System

### Typography

| Role | Font Family | Weights |
|---|---|---|
| Body text | Inter | 300, 400, 500, 600, 700 |
| Display / Headings | Sora | 400, 500, 600, 700, 800 |

Fonts are loaded from Google Fonts via `@import` in `index.css`.

### Color System

The application uses a comprehensive **HSL-based CSS custom property** design system defined in `:root` and `[data-theme="light"]` selectors. All colors are consumed through Tailwind utility classes mapped in `tailwind.config.ts`.

#### Dark Theme (Default)

| Token | HSL Value | Usage |
|---|---|---|
| `--background` | 220 20% 4% | Page background |
| `--foreground` | 0 0% 93% | Primary text |
| `--primary` | 190 100% 50% | Brand accent (cyan) |
| `--secondary` | 220 15% 12% | Secondary surfaces |
| `--muted` | 220 15% 15% | Muted backgrounds |
| `--accent` | 220 15% 14% | Interactive highlights |
| `--destructive` | 0 84% 60% | Error/danger states |
| `--chat-bubble-sent` | 190 100% 50% | Outgoing message bubble |
| `--chat-bubble-received` | 220 15% 14% | Incoming message bubble |
| `--online-indicator` | 142 71% 45% | Green online status dot |

#### Gradient

The brand gradient is defined as a CSS custom property:
```css
--gradient-brand: linear-gradient(135deg, hsl(190, 100%, 50%), hsl(210, 100%, 55%), hsl(230, 80%, 60%));
```
Used for: primary buttons, send button, brand accents.

### Custom CSS Features

- **Scrollbar styling** — Thin 5px scrollbar with transparent track and semi-transparent thumb
- **Glow effects** — Blurred circular divs on auth pages for depth
- **Glassmorphism** — Auth card uses `backdrop-blur-xl` with semi-transparent background

### Animations

| Animation | Duration | Usage |
|---|---|---|
| `fade-in` | 0.2s | New messages, smart replies, UI elements |
| `typing-bounce` | 1.4s (infinite) | Typing indicator dots |
| `pulse-glow` | 2s (infinite) | Logo pulsing effect |
| `accordion-down/up` | 0.2s | Expandable sections |
| `spin` | — | Loading spinners |
| `scale-in` | — | Message action buttons on hover |

---

## 10. Component Architecture

### Page Components (`src/pages/`)

| Component | Description |
|---|---|
| `Chat.tsx` | Main chat page with sidebar + window layout, handles mobile/desktop switching |
| `Login.tsx` | Login form with branded background, glow effects, show/hide password |
| `Register.tsx` | Registration form with username, email, password, strength indicators, success state |
| `Index.tsx` | Placeholder landing page (redirects to `/chat`) |
| `NotFound.tsx` | 404 error page |

### Chat Components (`src/components/chat/`)

| Component | Lines | Description |
|---|---|---|
| `ChatSidebar.tsx` | 179 | Chat list with search, user/group creation, profile access, sign out |
| `ChatWindow.tsx` | 284 | Active chat view: header, messages, smart replies, input, dialogs |
| `MessageBubble.tsx` | 184 | Individual message rendering with reactions, actions, reply threading |
| `MessageInput.tsx` | 142 | Text input, file upload, emoji picker, poll/schedule buttons, voice recorder |
| `MessageSearch.tsx` | — | Search messages within a chat |
| `SmartReplies.tsx` | 73 | AI-powered quick reply suggestions |
| `TypingIndicator.tsx` | — | Animated typing indicator with bouncing dots |
| `EmojiPicker.tsx` | — | Emoji picker using Emoji Mart library |
| `ReactionPicker.tsx` | — | Quick emoji reaction bar |
| `VoiceRecorder.tsx` | 120 | Audio recording with MediaRecorder API, timer, send/cancel |
| `PinnedMessages.tsx` | 95 | Expandable pinned messages bar |
| `PollDialog.tsx` | 119 | Dialog for creating polls with dynamic options |
| `BillSplitDialog.tsx` | 255 | Tabbed dialog for creating and viewing bill splits |
| `ScheduleMessageDialog.tsx` | 106 | Dialog for scheduling future messages |
| `ProfileSettingsDialog.tsx` | 236 | Full profile editor with avatar upload, theme toggle, account deletion |
| `UserSearchDialog.tsx` | 99 | User search for starting new 1-on-1 chats |
| `CreateGroupDialog.tsx` | 189 | Multi-step group chat creation (select members → name group) |

### UI Components (`src/components/ui/`)

The project includes 45+ shadcn/ui components providing accessible, composable UI primitives including: Dialog, Avatar, Button, Input, Select, Tabs, Toast, Tooltip, ScrollArea, Sheet, Popover, Dropdown Menu, and more.

---

## 11. Custom Hooks

### `useAuth()` (`src/contexts/AuthContext.tsx`)
Returns: `{ user, session, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile }`

### `useChats()` (`src/hooks/useChats.ts`)
- Fetches all chats the current user is a member of
- Enriches each chat with member profiles, other user info, last message, and unread count
- Sorts by most recent message
- Subscribes to real-time `INSERT` events on `messages` table to auto-refresh
- Provides `createOrFindChat(userId)` for 1-on-1 chats (de-duplicates existing conversations)
- Provides `createGroupChat(name, memberIds)` for group creation

### `useMessages(chatId)` (`src/hooks/useMessages.ts`)
- Fetches all messages for a given chat, ordered ascending by timestamp
- Real-time subscription for `INSERT` and `UPDATE` events filtered by `chat_id`
- Duplicate prevention on inserts
- Auto-marks incoming messages as seen
- Provides `sendMessage(content)` and `sendImage(file)` methods

### `useReactions(chatId)` (`src/hooks/useReactions.ts`)
- Fetches all reactions for messages in the current chat
- Real-time subscription for all reaction changes
- Provides `toggleReaction(messageId, emoji)` — adds or removes based on existing state
- Provides `getReactionsForMessage(messageId)` for filtered lookup

### `useTypingIndicator(chatId)` (`src/hooks/useTypingIndicator.ts`)
- Creates a Presence channel per chat
- Tracks typing state with auto-timeout (3 seconds)
- Returns `typingUsers` (array of usernames currently typing)
- Provides `sendTyping(isTyping)` to broadcast typing state

### `useTheme()` (`src/hooks/useTheme.ts`)
- Manages dark/light theme state
- Persists to `localStorage` under `chatsphere-theme`
- Sets `data-theme` attribute on `<html>` element
- Provides `toggleTheme()` function

### `useIsMobile()` (`src/hooks/use-mobile.tsx`)
- Returns boolean based on viewport width (breakpoint: 768px)
- Used to conditionally render mobile vs desktop layouts

---

## 12. Serverless Functions

### `smart-replies` Edge Function

**Path:** `supabase/functions/smart-replies/index.ts`  
**Runtime:** Deno  
**Trigger:** HTTP POST from client via `supabase.functions.invoke()`

**Purpose:** Generates 3 contextual quick-reply suggestions based on recent conversation history using an AI language model.

**Request Body:**
```json
{
  "messages": [
    { "content": "Hey, are you coming tonight?", "isMine": false },
    { "content": "Maybe, what time?", "isMine": true }
  ]
}
```

**AI Model Used:** `google/gemini-2.5-flash-lite` via AI Gateway

**System Prompt:**
> You are a smart reply suggestion engine for a chat app. Given the recent conversation, suggest exactly 3 short, natural reply options the user might want to send. Return ONLY a JSON array of 3 strings, nothing else. Keep each reply under 30 characters. Make them conversational, varied (one positive, one neutral, one question/follow-up).

**Response:**
```json
{
  "suggestions": ["Sounds great! 🎉", "Got it, thanks", "When should we meet?"]
}
```

**Error Handling:**
- Rate limiting (429) returns a structured error
- Payment required (402) returns a structured error
- All other errors return 500 with error message

---

## 13. File Storage

### Storage Buckets

| Bucket Name | Content | Access |
|---|---|---|
| `chat-images` | Chat images, voice recordings (WebM) | Public read (via `getPublicUrl`) |
| `avatars` | User profile photos | Public read (via `getPublicUrl`) |

### Upload Patterns

**Image Upload:**
- File path pattern: `{chatId}/{timestamp}.{extension}`
- Triggered via hidden `<input type="file" accept="image/*" />`
- Public URL stored in `messages.image_url`

**Voice Recording Upload:**
- File path pattern: `{chatId}/{timestamp}.webm`
- Recorded via `MediaRecorder` API with `audio/webm` MIME type
- Stored in `chat-images` bucket (reuses same bucket)
- Message content set to: `🎤 Voice message ({duration})`

**Avatar Upload:**
- File path pattern: `{userId}/avatar.{extension}`
- Uploaded with `upsert: true` to replace existing avatars
- Public URL stored in `profiles.avatar_url`

---

## 14. Testing Infrastructure

### Unit Testing

| Tool | Version | Purpose |
|---|---|---|
| **Vitest** | ^3.2.4 | Test runner (Vite-native) |
| **@testing-library/react** | ^16.0.0 | React component testing utilities |
| **@testing-library/jest-dom** | ^6.6.0 | Custom DOM matchers |
| **jsdom** | ^20.0.3 | Browser environment simulation |

**Config file:** `vitest.config.ts`  
**Test setup:** `src/test/setup.ts`  
**Example test:** `src/test/example.test.ts`

**Commands:**
- `npm run test` — Run tests once
- `npm run test:watch` — Run tests in watch mode

### End-to-End Testing

| Tool | Version | Purpose |
|---|---|---|
| **Playwright** | ^1.57.0 | Browser automation for E2E tests |

**Config file:** `playwright.config.ts`  
**Fixture file:** `playwright-fixture.ts`

---

## 15. Build & Development Tooling

| Tool | Version | Purpose |
|---|---|---|
| **Vite** | ^5.4.19 | Build tool with HMR, code splitting, optimized bundling |
| **@vitejs/plugin-react-swc** | ^3.11.0 | React Fast Refresh via SWC (faster than Babel) |
| **TypeScript** | ^5.8.3 | Static type checking |
| **ESLint** | ^9.32.0 | Code linting with React Hooks and React Refresh plugins |
| **PostCSS** | ^8.5.6 | CSS processing pipeline |
| **Autoprefixer** | ^10.4.21 | Automatic vendor prefixes |
| **@tailwindcss/typography** | ^0.5.16 | Prose styling plugin |

### Build Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build |
| `npm run build:dev` | Development mode build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

### TypeScript Configuration

- `tsconfig.json` — Base configuration
- `tsconfig.app.json` — Application-specific settings
- `tsconfig.node.json` — Node.js environment settings (for Vite config)

### Path Aliases

The `@/` alias maps to `src/`, enabling clean imports:
```typescript
import { supabase } from "@/integrations/supabase/client";
```

---

## 16. Security Considerations

### Row-Level Security (RLS)

All database tables have RLS enabled with policies enforcing:
- Users can only read messages from chats they are members of
- Users can only send messages to chats they are members of
- Profile data is readable by authenticated users
- Users can only modify their own profile
- The `is_chat_member()` database function is used in RLS policies

### Authentication Security

- JWT-based session management with automatic token refresh
- Passwords are handled by Supabase Auth (bcrypt hashing server-side)
- Email verification required before sign-in
- Session stored in `localStorage` with `persistSession: true`

### Input Validation

- Username minimum 3 characters (enforced in UI)
- Password minimum 6 characters (enforced in UI + Supabase Auth)
- Message content is trimmed before insertion
- Poll options limited to 6, characters limited per field
- Scheduled message timestamp validated to be in the future

### Data Access

- Users cannot see chats they are not members of
- Message deletion is restricted to the message sender
- Bill split payment marking is restricted to the share owner

---

## 17. Performance Optimizations

### Frontend

- **Code splitting** — Vite automatically splits vendor code from application code
- **Lazy image loading** — `loading="lazy"` on all shared images in messages
- **useCallback** — Memoized callbacks in hooks to prevent unnecessary re-renders and re-subscriptions
- **Duplicate prevention** — Message deduplication check before appending real-time updates
- **Debounced typing** — Auto-stop typing after 3 seconds to reduce presence broadcast frequency
- **Smart reply throttling** — Only fetches suggestions when the last message is from another user

### Backend

- **Filtered subscriptions** — Real-time channels filter by `chat_id` to reduce payload
- **Indexed queries** — Foreign key columns are automatically indexed by PostgreSQL
- **Minimal data fetching** — Only the last message is fetched for chat list display

### Known Performance Concerns

- **N+1 query pattern in `useChats`** — Each chat requires multiple sequential queries (chat info, members, profiles, last message, unread count). This could be optimized with database views or RPC calls.
- **Full reaction refetch** — Any reaction change triggers a full refetch of all reactions for the chat.

---

## 18. Project File Structure

```
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── chat-sphere-bg.jpg          # Auth page background image
│   │   └── chatsphere-logo.png         # Brand logo
│   ├── components/
│   │   ├── chat/
│   │   │   ├── BillSplitDialog.tsx
│   │   │   ├── ChatSidebar.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── CreateGroupDialog.tsx
│   │   │   ├── EmojiPicker.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageSearch.tsx
│   │   │   ├── PinnedMessages.tsx
│   │   │   ├── PollDialog.tsx
│   │   │   ├── ProfileSettingsDialog.tsx
│   │   │   ├── ReactionPicker.tsx
│   │   │   ├── ScheduleMessageDialog.tsx
│   │   │   ├── SmartReplies.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── UserSearchDialog.tsx
│   │   │   └── VoiceRecorder.tsx
│   │   ├── ui/                         # 45+ shadcn/ui components
│   │   └── NavLink.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useChats.ts
│   │   ├── useMessages.ts
│   │   ├── useReactions.ts
│   │   ├── useTheme.ts
│   │   └── useTypingIndicator.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts               # Auto-generated Supabase client
│   │       └── types.ts                # Auto-generated TypeScript types
│   ├── lib/
│   │   └── utils.ts                    # cn() utility for class merging
│   ├── pages/
│   │   ├── Chat.tsx
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   └── Register.tsx
│   ├── test/
│   │   ├── example.test.ts
│   │   └── setup.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css                       # Design system tokens + global styles
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   ├── config.toml                     # Supabase project configuration
│   ├── functions/
│   │   └── smart-replies/
│   │       └── index.ts                # AI smart reply edge function
│   └── migrations/                     # Database migration files
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── playwright-fixture.ts
├── postcss.config.js
├── eslint.config.js
├── components.json                     # shadcn/ui configuration
└── report.md                           # This file
```

---

## 19. Dependencies Inventory

### Production Dependencies (27 packages)

| Package | Version | Category |
|---|---|---|
| react | ^18.3.1 | Core |
| react-dom | ^18.3.1 | Core |
| react-router-dom | ^6.30.1 | Routing |
| @supabase/supabase-js | ^2.99.0 | Backend SDK |
| @tanstack/react-query | ^5.83.0 | Server State |
| @emoji-mart/data | ^1.2.1 | Emoji Data |
| @emoji-mart/react | ^1.1.1 | Emoji UI |
| @hookform/resolvers | ^3.10.0 | Form Validation |
| @radix-ui/* (16 packages) | Various | UI Primitives |
| class-variance-authority | ^0.7.1 | Component Variants |
| clsx | ^2.1.1 | Class Utilities |
| cmdk | ^1.1.1 | Command Palette |
| date-fns | ^3.6.0 | Date Utils |
| embla-carousel-react | ^8.6.0 | Carousel |
| input-otp | ^1.4.2 | OTP Input |
| lucide-react | ^0.462.0 | Icons |
| next-themes | ^0.3.0 | Theme Management |
| react-day-picker | ^8.10.1 | Date Picker |
| react-hook-form | ^7.61.1 | Forms |
| react-resizable-panels | ^2.1.9 | Resizable Panels |
| recharts | ^2.15.4 | Charts |
| sonner | ^1.7.4 | Toasts |
| tailwind-merge | ^2.6.0 | Tailwind Utils |
| tailwindcss-animate | ^1.0.7 | Animations |
| vaul | ^0.9.9 | Drawer |
| zod | ^3.25.76 | Validation |

### Development Dependencies (14 packages)

| Package | Version | Category |
|---|---|---|
| @eslint/js | ^9.32.0 | Linting |
| @playwright/test | ^1.57.0 | E2E Testing |
| @tailwindcss/typography | ^0.5.16 | CSS Plugin |
| @testing-library/jest-dom | ^6.6.0 | Test Matchers |
| @testing-library/react | ^16.0.0 | React Testing |
| @types/node | ^22.16.5 | Type Definitions |
| @types/react | ^18.3.23 | Type Definitions |
| @types/react-dom | ^18.3.7 | Type Definitions |
| @vitejs/plugin-react-swc | ^3.11.0 | Build Plugin |
| autoprefixer | ^10.4.21 | CSS Processing |
| eslint | ^9.32.0 | Linting |
| eslint-plugin-react-hooks | ^5.2.0 | Linting |
| eslint-plugin-react-refresh | ^0.4.20 | Linting |
| globals | ^15.15.0 | Linting |
| jsdom | ^20.0.3 | Test Environment |
| postcss | ^8.5.6 | CSS Processing |
| tailwindcss | ^3.4.17 | CSS Framework |
| typescript | ^5.8.3 | Type Checking |
| typescript-eslint | ^8.38.0 | Linting |
| vite | ^5.4.19 | Build Tool |
| vitest | ^3.2.4 | Testing |

---

## 20. Known Limitations & Planned Features

### Current Limitations

1. **Voice/Video Calling** — Phone and video call buttons in the chat header are placeholder UI elements without functionality
2. **Scheduled Message Delivery** — Messages are stored but there is no automated delivery mechanism (no cron job or scheduled function to send them)
3. **N+1 Query Pattern** — Chat list fetching performs sequential queries per chat, which may degrade with many conversations
4. **No Message Editing** — Users can delete but cannot edit sent messages
5. **No File Sharing** — Only images are supported; no document/PDF/video file sharing
6. **Poll Voting UI** — Polls are created and posted as formatted text messages but lack an interactive voting interface in the chat
7. **No Push Notifications** — No browser push notifications or service worker for offline support
8. **No End-to-End Encryption** — Messages are stored in plaintext in the database
9. **Single-Device Presence** — Online status is not reliably managed across multiple devices/tabs

### Potential Enhancements

1. WebRTC-based voice and video calling
2. Message editing with edit history
3. File/document sharing beyond images
4. Interactive poll voting UI with live results
5. Push notifications via Service Workers
6. End-to-end encryption for private conversations
7. Message forwarding between chats
8. Chat archive/mute functionality
9. Admin roles for group chats
10. Cron-based scheduled message delivery

---

*Report generated for ChatSphere project — March 10, 2026*
