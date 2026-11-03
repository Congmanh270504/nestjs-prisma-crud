# 📅 SynchroTask | Real-Time Collaborative Event & Task Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Pusher](https://img.shields.io/badge/Pusher-Realtime_WebSockets-300D4F?logo=pusher&logoColor=white)](https://pusher.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)

A full-stack, enterprise-grade team collaboration and calendar management system built with **NestJS**, **Next.js 14**, **Prisma ORM**, and **Supabase (PostgreSQL 16)**. Featuring real-time bidirectional synchronization powered by **Pusher**, seamless OAuth authentication with **Clerk**, and an interactive drag-and-drop calendar interface with multi-view support.

---

## 📑 Table of Contents

-   [Overview](#-overview)
-   [System Architecture](#-system-architecture)
-   [Key Features](#-key-features)
-   [Tech Stack](#-tech-stack)
-   [Database & Supabase Integration](#-database--supabase-integration)
-   [Project Structure](#-project-structure)
-   [Getting Started](#-getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Environment Variables](#environment-variables)
    -   [Installation & Setup](#installation--setup)
-   [Engineering Highlights (For Recruiters)](#-engineering-highlights-for-recruiters--tech-leads)
-   [License](#-license)

---

## 🌟 Overview

**SynchroTask** was engineered to solve team scheduling and project task coordination bottlenecks in distributed teams. The project combines a reactive frontend interface with a modular, highly scalable backend service:

-   **Collaborative Workspaces**: Organize projects into dedicated groups with invite-code access control.
-   **Dynamic Task Tracking**: Full lifecycle management with `TODO`, `IN_PROGRESS`, `DONE`, and `CANCELLED` statuses along with granular priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
-   **Live Bidirectional Sync**: Multiple users receive instant updates on task creation, edits, status transitions, and schedule adjustments without refreshing.
-   **Drag-and-Drop Scheduling**: Fluid HTML5 drag-and-drop mechanics to reschedule tasks across dates and time slots.
-   **Cloud Database with Connection Pooling**: Powered by Supabase PostgreSQL with dual-connection pooling architecture (PgBouncer transaction mode for query execution and direct connection for migrations).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 14 App Router)"]
        UI["UI / Radix UI / Tailwind CSS"]
        Context["Calendar Context & Custom Hooks"]
        DND["React DnD (Drag & Drop Engine)"]
        ClerkClient["Clerk Auth Provider"]
        PusherClient["Pusher JS WebSocket Client"]
    end

    subgraph Backend ["Backend API (NestJS Modular Monolith)"]
        Gateway["REST Controllers & Validation Pipes"]
        Services["Domain Services (Events, Groups, Users, Invites)"]
        PusherServer["Pusher Server Trigger Service"]
        PrismaService["Prisma ORM Client Layer"]
    end

    subgraph External ["External Cloud Services & Storage"]
        DB[("Supabase Cloud\nPostgreSQL 16 + pgvector")]
        PusherCloud["Pusher Cloud (WebSockets Broker)"]
        ClerkCloud["Clerk Identity Provider"]
    end

    UI --> Context
    Context --> DND
    ClerkClient --> ClerkCloud
    Context -->|HTTP REST API| Gateway
    PusherCloud -->|Real-time Events| PusherClient
    PusherClient --> Context

    Gateway --> Services
    Services --> PrismaService
    Services -->|Broadcast Channel| PusherServer
    PusherServer --> PusherCloud
    PrismaService -->|Pooled Connection :6543 / Direct :5432| DB
```

---

## 🚀 Key Features

### 1. Interactive Multi-View Calendar

-   **5 Viewing Modes**: Month, Week, Day, Agenda, and Year views with smooth navigation.
-   **Drag & Drop Rescheduling**: Re-allocate events between days or adjust duration effortlessly using HTML5 Drag & Drop.
-   **Visual Filters & Customization**: Filter events by responsible member, customize badge styles (dot, colored, mixed), and set custom working hours.

### 2. Task Lifecycle & Role Delegation

-   **Creator vs. Assignee**: Distinct tracking of the creator (authenticated user) and assignee (delegated group member).
-   **Inline Status & Priority Updating**: Change status and priority directly from the event detail dialog with instant backend persistence.
-   **Group Scoped Assignees**: Tasks created within a workspace dynamically restrict assignee selection strictly to verified members of that group.

### 3. Workspaces & Invitation System

-   **Group Isolation**: Multi-tenant workspace partitioning; each group maintains its own task sets and members.
-   **Secure Invitations**: Member onboarding using unique invite codes (`CODE#TAG`) with Accept/Reject workflows.

### 4. Real-time Collaboration (Pusher WebSockets)

-   Subscriptions to dedicated event channels automatically broadcast updates (`event-created`, `event-updated`, `event-deleted`).
-   Optimistic UI updates ensure zero perceived latency for the active user while safely reconciling with server responses.

---

## 🛠️ Tech Stack

### Frontend

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
-   **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type-checking)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
-   **State & Forms**: React Context API, React Hook Form, [Zod](https://zod.dev/) validation
-   **Interactive Drag & Drop**: [React DnD](https://react-dnd.github.io/react-dnd/) (HTML5 Backend)
-   **Date Utilities**: [date-fns](https://date-fns.org/)
-   **Icons**: [Lucide React](https://lucide.dev/)

### Backend

-   **Framework**: [NestJS 10](https://nestjs.com/) (Modular Architecture, Dependency Injection)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **ORM**: [Prisma ORM 5](https://www.prisma.io/) (PostgreSQL client, migrations, relational mapping)
-   **Validation**: `class-validator`, `class-transformer`
-   **Realtime**: [Pusher Channels Node SDK](https://pusher.com/)

### Cloud & Database

-   **Cloud Database**: [Supabase](https://supabase.com/) (Managed PostgreSQL 16 with PgBouncer connection pooling and `pgvector` extension)
-   **Authentication**: [Clerk](https://clerk.com/) (OAuth, user sessions, webhooks/sync)
-   **WebSockets Service**: [Pusher Channels](https://pusher.com/)

---

## 🗄️ Database & Supabase Integration

### 1. Dual-Connection Pooling Strategy

When deploying modern Node.js/NestJS applications with serverless or containerized architectures, managing PostgreSQL connection limits is critical. This project implements Supabase's **recommended dual-URL architecture** configured in `prisma/schema.prisma`:

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [pgvector(map: "vector")]
}
```

| Environment Variable | Connection Mode                  | Port   | Purpose                                                                                                                                                                                                         |
| :------------------- | :------------------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | **Transaction Mode (PgBouncer)** | `6543` | Used for all runtime queries (`prisma.taskEvent.findMany`, etc.). Ensures thousands of concurrent requests can be handled safely without hitting PostgreSQL max connections limit (`?pgbouncer=true`).          |
| `DIRECT_URL`         | **Session Mode (Direct TCP)**    | `5432` | Dedicated to Prisma CLI operations and schema migrations (`prisma migrate dev`, `prisma db push`). Required because database migrations need session-level locking and advisory locks unsupported by PgBouncer. |

### 2. Entity Relational Mapping (ERD)

```
┌──────────────────┐       1:N       ┌──────────────────┐
│      Users       │ ─────────────── │      Groups      │
│  (Clerk synced)  │ ───┐            │  (Workspaces)    │
└──────────────────┘    │            └──────────────────┘
     │        │         │                     │
     │ 1:N    │ 1:N     │ 1:N                 │ 1:N
     │        │         │                     │
     ▼        │         ▼                     ▼
┌───────────┐ │    ┌───────────┐         ┌───────────┐
│ TaskEvent │ │    │Invitations│         │ TaskEvent │
│ (Created) │ │    │(Sent/Recv)│         │(Workspace)│
└───────────┘ │    └───────────┘         └───────────┘
              ▼
       ┌───────────┐
       │ TaskEvent │
       │(Assigned) │
       └───────────┘
```

#### Core Models:

-   **`User`**: Synced with Clerk authentication. Holds identity, email, username, avatars, and roles.
-   **`Groups`**: Workspaces containing tasks and invitations. Owned by a `User`.
-   **`TaskEvent`**: Calendar tasks containing `startDate`, `endDate`, `status` (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `color`, `groupId`, `creatorId`, and optional `assigneeId`.
-   **`Invitations`**: Workspace invitations tracking recipient email, status (`PENDING`, `ACCEPTED`, `REJECTED`), and expiration date.

---

## 📁 Project Structure

```
nestjs-prisma-crud/
├── prisma/
│   ├── schema.prisma          # Prisma schema with Supabase dual-URL & pgvector config
│   └── migrations/            # Historical SQL schema migration files
├── src/                       # NestJS Backend Application
│   ├── events/                # TaskEvents module (Controller, Service, DTOs)
│   ├── groups/                # Workspaces/Groups module
│   ├── invitations/           # Invitation & onboarding logic
│   ├── users/                 # User synchronization & directory
│   ├── pusher/                # Pusher WebSocket broadcasting service
│   ├── prisma.service.ts      # Global Prisma database service
│   ├── app.module.ts          # Root dependency injection module
│   └── main.ts                # Application entrypoint
├── client/                    # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── app/               # Next.js App Router (Layouts & Pages)
│   │   ├── calendar/          # Core Calendar Feature Module
│   │   │   ├── components/    # Calendar views (Month, Week, Day, Agenda)
│   │   │   │   └── dialogs/   # Add, Edit, and Event Details Dialogs
│   │   │   ├── contexts/      # CalendarContext (realtime state store)
│   │   │   ├── hooks/         # Custom hooks (e.g. useUpdateEvent)
│   │   │   ├── requests/      # API consumer layer (fetch wrappers)
│   │   │   ├── interfaces.ts  # Domain TypeScript models
│   │   │   └── schemas.ts     # Zod form validation schemas
│   │   ├── components/        # Reusable UI primitives (Shadcn / Radix)
│   │   └── lib/               # Utility functions (Pusher client, classnames)
│   └── tailwind.config.ts     # Styling design tokens
├── package.json               # Root workspace scripts & backend dependencies
└── README.md                  # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites

-   **Node.js**: `v18.17.0` or higher
-   **Package Manager**: `npm` or `pnpm`
-   **Supabase Account**: A free project created at [supabase.com](https://supabase.com)
-   **Pusher Account**: Channels app credentials at [pusher.com](https://pusher.com)
-   **Clerk Account**: Application API keys at [clerk.com](https://clerk.com)

---

### Environment Variables

#### 1. Backend (`.env` in root directory):

Obtain your connection strings from your **Supabase Dashboard** > **Project Settings** > **Database** > **Connection string**:

```env
# Supabase Transaction Pooler (port 6543 with pgbouncer=true) for runtime queries
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (port 5432) for schema migrations
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

PORT=3002
CORS_ORIGIN="http://localhost:3000"

# Pusher Channels
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
PUSHER_CLUSTER="ap1"
```

#### 2. Frontend (`client/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3002"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Pusher Channels
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

---

### Installation & Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/nestjs-prisma-crud.git
    cd nestjs-prisma-crud
    ```

2. **Install dependencies**:

    ```bash
    # Install backend dependencies
    npm install

    # Install frontend dependencies
    cd client
    npm install
    cd ..
    ```

3. **Initialize Database & Prisma Client**:

    ```bash
    # Generate Prisma client and apply migrations to Supabase
    npx prisma generate
    npx prisma migrate dev
    ```

4. **Run the Development Servers**:
    - **Terminal 1 (Backend - NestJS)**:
        ```bash
        npm run start:dev
        # Server listening on http://localhost:3002
        ```
    - **Terminal 2 (Frontend - Next.js)**:
        ```bash
        cd client
        npm run dev
        # Client application running on http://localhost:3000
        ```

---

## 💼 Engineering Highlights (For Recruiters & Tech Leads)

-   **Production-Grade Database Architecture**: Integrates Supabase managed PostgreSQL using a dual-connection approach (PgBouncer connection pooling on port 6543 for scale, direct connection on port 5432 for migration integrity).
-   **Strict End-to-End Type Safety**: Unbroken TypeScript typing spanning the PostgreSQL schema (via generated Prisma types), NestJS DTO validation pipes, and Next.js frontend interfaces and Zod schemas.
-   **Enterprise Design Patterns**: Controller-Service-Repository architecture in NestJS ensuring high cohesion, loose coupling, testability, and clear separation of concerns.
-   **Optimistic UI with Eventual Consistency**: State updates render immediately for responsive user experience while smoothly reconciling or rolling back upon server feedback or Pusher WebSocket events.
-   **Micro-interactions & Accessible UX**: Built with Radix UI accessible primitives, ergonomic quick-edit select dropdowns for status/priority, responsive modal dialogs, and smooth drag-and-drop mechanics.
-   **Security & Data Isolation**: Multi-tenant workspace segregation, cascading relational constraints, parameterized SQL queries preventing injection, and robust input validation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
