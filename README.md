⚡ Enterprise Cloud-Based Event Planning & RSVP Tracker

![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-Fast-purple?style=for-the-badge&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

A modern, high-performance, real-time event management and RSVP tracking platform built for enterprise environments. It eliminates complex AWS configurations by leveraging a scalable **Supabase + React + Vite** architecture.

---

## 🚀 Key Features

* **🔐 Secure Authentication Portal:** Clean sign-in and registration flow with session persistence.
* **📊 Live Capacity & Waitlist Tracking:** Real-time seat updates with dynamic progress bars and automated waitlist triggers when events reach full capacity.
* **✨ Professional Event Management:** Publish custom events with custom seating capacities instantly.
* **🔍 Instant Search Filters:** Real-time search filtering across active event streams.
* **🗑️ Database Integration & Deletion:** Full CRUD support backed by PostgreSQL with Row Level Security (RLS) policies.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Modern CSS-in-JS, JavaScript (ES6+)
* **Backend & Database:** Supabase (PostgreSQL, Real-time Subscriptions, RLS Policies)
* **Deployment & Tooling:** Vercel, Git & GitHub, PowerShell

---

## ⚙️ Quick Start & Installation

To run this project locally on your machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dalimkumar452-sudo/Enterprise-RSVP-Cloud.git
   cd Enterprise-RSVP-Cloud/frontend-react
Install dependencies:

Bash
npm install
Configure Supabase Client:
Create src/supabaseClient.js and add your credentials:

JavaScript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
Run the development server:

Bash
npm run dev
🗄️ Database Schema (Supabase SQL)
Run the following queries in your Supabase SQL Editor to configure tables and security policies:

SQL
create table events (
  event_id uuid default gen_random_uuid() primary key,
  name text not null,
  capacity int not null,
  going_count int default 0,
  waitlist_count int default 0,
  created_at timestamp default now()
);

create table rsvps (
  rsvp_id uuid default gen_random_uuid() primary key,
  event_id uuid references events(event_id) on delete cascade,
  user_id text not null,
  status text not null,
  unique(event_id, user_id)
);

alter table events enable row level security;
alter table rsvps enable row level security;

create policy "Allow public read events" on events for select using (true);
create policy "Allow public insert events" on events for insert with check (true);
create policy "Allow public update events" on events for update using (true);
create policy "Allow public delete events" on events for delete using (true);


👨‍💻 Author
Built with passion by Dalim Kumar.