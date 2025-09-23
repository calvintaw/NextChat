# NextChat

#### Video Demo:

#### Description: NextChat is a full-stack **Discord-inspired chat app** that lets users create or join servers, send messages in real time, upload images, and react to messages. It also includes profile customization and shows who’s online. The app is built with [Next.js](https://nextjs.org/) and [React](https://react.dev/) on the frontend, [Tailwind CSS](https://tailwindcss.com/) for styling, and [Supabase](https://supabase.com/) with [postgres.js](https://github.com/porsager/postgres) for the backend and [# NextAuth.js](https://next-auth.js.org/) authentication.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Folder Structure and File Descriptions](#structure)
- [Contact](#contact)

---

<a id="features"></a>

## Features

- **Instant Messaging** between users and servers (rooms)
- **Authentication** via NextAuth.js
- **Real-time database updates**
- **Responsive UI** built with Tailwind CSS
- **Dark mode** switch
- **CRUD operations** for messages, servers, and users
- **React to messages** from friends & servers
- **Media upload** (images/attachments)
- **User presence indicator:** Online status
- **Custom server creation**
- **User Profile customization**
- **Terms of Service** (just as a prop)
- ...and more

---

<a id="tech-stack"></a>

## Tech Stack

**Frontend:** Next.js (App Router), React, Tailwind CSS  
**Backend:** Next.js API routes, postgres.js  
**Database:** Supabase (PostgreSQL)  
**Auth:** NextAuth.js, Supabase Auth

---

<a id="structure"></a>

## Folder Structure and File Descriptions

<details>
<summary>📂 app</summary>

The main application folder containing all pages and layouts.

- `(auth)` → Handles user authentication workflows.

  - `login/page.tsx` → Login page where users input credentials.
  - `register/page.tsx` → Registration page for new users.
  - `terms_and_services/page.tsx` → Displays terms of service.
  - `layout.tsx` → Auth-specific layout wrapping all auth pages.

- `(root)` → Root-level pages and layouts after login.

  - `chat/[room_id]` → Direct messaging chat pages for a specific room.
    - `loading.tsx` → Shows a loader while chat data is fetched.
    - `page.tsx` → Main chat interface.
  - `chat/server/[room_id]/page.tsx` → Server chat pages for specific rooms.
  - `dashboard/page.tsx` → User dashboard showing the user profile info.
  - `discover/page.tsx` → Discovery page to find servers.
  - `news/page.tsx` → News feed page.
  - `layout.tsx` → Root layout wrapping all main pages.

- `api` → Server-side routes for handling backend logic.

  - `auth/[...nextauth]/route.ts` → NextAuth authentication routes.
  - `seed/route.ts` → Route for seeding test data.
  - `theme/route.ts` → Route for managing theme preference.

- `lib` → Utility functions, hooks, and global contexts.

  - `hooks/` → Custom React hooks for dark mode, debounce, storage, toast notifications, toggling booleans, limiting the amount of msg sent, etc.
  - `actions.ts` → Centralized functions for various app actions.
  - `definitions.ts` → Type definitions and constants.
  - `friendsContext.tsx` → React context managing friend data.
  - `news.ts` → Functions to fetch or manage news items.
  - `passwordRules.js` → Defines rules for password validation.
  - `PathContext.tsx` → Context for current path tracking.
  - `seedUsers.ts` → Script to seed test users.
  - `socket.ts` → Socket.io setup for real-time chat.
  - `supabase.ts` → Supabase client configuration.
  - `utilities.ts` → General utility functions.

- `ui` → Reusable UI components organized by feature.
  - `chat/components` → Components like chat input, messages, attachments, reactions, server edit form.
  - `contact` → Contact cards, panel, and tabs.
  - `form` → Authentication and server creation forms, input fields, pagination.
  - `general` → Avatar, buttons, search, banners, image forms.
  - `news` → News cards and container.
  - `sidebar/components` → Navigation bar, chat preview, user panel.
  - Additional standalone components: `DashboardPage.tsx`, `OnlineIndicator.tsx`, `Toast.tsx`.

</details>

<details>
<summary>📂 public</summary>

### public

Static assets such as fonts (`Roboto`), marketing images, and SVGs.

</details>

<details>
<summary>📂 Root files</summary>

Configuration and environment files:

- `.env.local` → Environment variables.
- `auth.config.ts`, `auth.ts` → Authentication configuration and helper functions.
- `middleware.ts` → Next.js middleware for authentication or routing.
- `next-auth.d.ts` → TypeScript definitions for NextAuth.
- `next.config.ts` → Next.js configuration.
- `package.json`, `pnpm-lock.yaml` → Dependency management.
- `tsconfig.json` → TypeScript configuration.
- `README.md` → Project documentation.

</details>

---

<a id="screenshots"></a>

## Screenshots

### Home Page

<img width="1315" height="653" alt="Home Page Screenshot" src="https://github.com/user-attachments/assets/be179c2d-6d9d-465b-8092-4cf03f29bcb5" />

### Chat Room

<img width="1316" height="648" alt="Chat Room Screenshot" src="https://github.com/user-attachments/assets/a7de3e11-1f8a-4a12-8c79-755e03290b66" />

### Servers

<img width="1314" height="647" alt="Servers Screenshot" src="https://github.com/user-attachments/assets/5acf766f-900c-4943-be37-3777af9a88a1" />

---

<a id="flaws"></a>

## Flaws / Bugs with this project

- There’s no proper way to verify if the provided email address is legitimate.
- No login rate limiting is implemented.
- The website always defaults to the light theme (it’s supposed to be dark by default, but I couldn’t figure out why this bug occurs).
- There may be database update or UI display issues in edge cases, such as when User A accepts a friend request at the same time User B rejects it.
- When a user spams messages quickly, you may see mismatches between what the sender and receiver see, or sometimes the sender may see duplicate messages. This is either due to WebSocket not handling all messages properly, or a bug in how local messages are inserted (which is done to give the user an instant feedback feel).
- When editing a multi-line message, all lines collapse into a single line (this could be fixed by using a textarea, but I haven’t implemented it yet).
- The news feed page does not show actual news; instead, it just displays a list of old news stored on the server because I couldn’t find a suitable free API.
- The Discover Servers page lacks a polished UI.
- Uploaded media files are not properly structured or stored. For example, when a user uploads a profile picture, it is not stored separately, and if they upload another, the old one is not deleted. This results in improper media management.
