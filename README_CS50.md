# NextChat

#### Video Demo:

#### Description: NextChat is a full-stack **Discord-inspired chat app** that lets users create or join servers, send messages in real time, upload images, and react to messages. It also includes profile customization and shows who’s online. The app is built with [Next.js](https://nextjs.org/) and [React](https://react.dev/) on the frontend, [Tailwind CSS](https://tailwindcss.com/) for styling, and [Supabase](https://supabase.com/) with [postgres.js](https://github.com/porsager/postgres) for the backend and [# NextAuth.js](https://next-auth.js.org/) authentication.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure and File Descriptions](#structure)
- [Screenshots](#screenshots)
- [Flaws / Design Decisions](#decisions)

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

## Flaws / Design Decisions

NextChat grew into a bigger project than I originally anticipated—it ended up taking over four months, which was way longer than I expected. Along the way, I made a lot of decisions that were either for convenience, due to time constraints, or just because I didn’t know a better way at the time. As a result, there are a bunch of flaws and design trade-offs worth noting.

### Technical Decisions

* **Supabase + postgres.js**: I picked Supabase mainly because it’s easy to set up. But instead of using Supabase’s own query functions, I ended up using `postgres.js` for database queries. The reason? I didn’t want to constantly be looking up Supabase documentation just to do basic stuff like `SELECT` or `INSERT`. This makes writing queries faster and more straightforward for me, even if it’s not “idiomatic” Supabase.
* **withCurrentUser utility**: This function started as a safety measure—it made sure the authenticated user ID came from the server so that fraud or spoofing would be hard. Over time, it became more of a convenience helper; some functions still depend on it simply because refactoring would take extra work. It’s kind of a “removable crutch” at this point.
* **DM Rooms**: One-to-one chat rooms are generated deterministically using both users’ IDs, sorted alphabetically with `localeCompare`, plus a prefix (`/chat/[room_id]/`). It’s simple and works, but it also means user IDs are exposed in URLs. Originally, this was to make linking chats easier, but now I realize there might be some edge-case exploits if someone is clever. I didn’t have time to rethink it.
* **News feed**: Locally, the app uses a live API, but in production it just serves static data. I couldn’t find a free API that worked reliably, so the feed ends up being old news. Not ideal, but it was better than nothing.
* **Media storage**: Profile pictures, chat images, and server images all go directly into the Supabase storage bucket without much organization. There’s no folder hierarchy or deletion system. I did this mostly because I had no experience with proper media handling, and the project had already taken way too long.

### Known Flaws

* There’s no way to verify that a user’s email is legitimate, which is obviously a problem if this were a real app.
* Login rate limiting isn’t implemented, so technically someone could brute-force credentials.
* The site always defaults to light mode. I originally wanted it to default to dark, but I couldn’t figure out why the bug happens—and to be honest, I don’t even know if it still happens.
* Database and UI inconsistencies can appear in edge cases. For example, if User A accepts a friend request at the same time User B rejects it, the results can be weird.
* Rapid message spam can cause mismatched messages, duplicates, or strange display issues. This comes from a combination of WebSocket handling and how messages are inserted locally for instant feedback.
* Multi-line messages collapse into a single line when edited. I know a textarea would fix this, but I didn’t implement it.
* As mentioned, the news feed doesn’t show actual news in production because of API limitations.
* The Discover Servers page isn’t polished—UI-wise it’s still rough around the edges.
* Media management is messy: if you upload a new profile pic, the old one doesn’t get deleted or moved, so the app main storage bucket just accumulates random files.

### Security Considerations

* Exposing user IDs in chat room URLs was a design choice to make linking and room creation simpler. The downside is that some actions—like editing messages or verifying DM access rely on these IDs. I think it’s probably safe, but I can’t guarantee there’s no way to exploit it. A more secure approach would use randomized room IDs or a mapping table.
* Overall, many of the design decisions were made for **speed and simplicity** rather than security or scalability. If I were doing this in production for actual product, a lot of things would need to change.

---
