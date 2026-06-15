# Prept: AI-Powered Interview Marketplace

Prept is a modern platform designed to connect interviewers and candidates for mock interviews. It combines real-time video conferencing with AI-driven insights to help job seekers prepare for technical and behavioral interviews.

## Overview

This application acts as a marketplace where experienced professionals can offer interview sessions and candidates can book them. During the interview, an integrated AI helps generate relevant questions in real-time based on the candidate's target role, making the session more structured and effective.

## Key Features

- **Interviewer Marketplace**: Browse through professional interviewers, view their profiles, and check their expertise.
- **Seamless Booking**: A built-in scheduling system to pick slots that work for both parties.
- **AI-Assisted Interviews**: Using Google Gemini, the platform generates dynamic questions during the call to keep the interview challenging and relevant.
- **Real-time Communication**: High-quality video and chat powered by Stream.io.
- **Secure Payments & Payouts**: Integrated tracking for interviewer earnings and payout management.
- **User Dashboard**: Centralized hub to manage upcoming appointments, availability, and profile settings.

## Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **AI**: Google Generative AI (Gemini)
- **Security**: Arcjet (Rate limiting and bot protection)
- **Real-time**: Stream SDK (Video & Chat)
- **Styling**: Tailwind CSS & Shadcn UI

## Getting Started

First, install the project dependencies:

```bash
npm install
```

Next, set up your database and sync the schema:

```bash
npx prisma generate
npx prisma db push
```

Then, start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Configuration

You will need to set up several environment variables in a `.env` file to get the features working:

- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: From your Clerk dashboard.
- `STREAM_API_KEY` & `STREAM_SECRET_KEY`: From Stream.io.
- `GOOGLE_GENERATIVE_AI_API_KEY`: From Google AI Studio.
- `ARCJET_KEY`: For security and rate limiting.

## License

This project is licensed under the MIT License. Feel free to use it for learning or as a foundation for your own applications.

