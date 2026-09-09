# Support Genie

Challenge: Build a focused AI-assisted customer support desk for managing support tickets.

Core idea: Customer submits ticket → AI triages → Agent receives → Agent responds → Resolve

1. Problem Statement

Support teams receive large numbers of customer issues. Agents need to identify the category and urgency quickly, assign tickets correctly, communicate with customers, and resolve issues efficiently. Build an MVP that demonstrates this workflow with meaningful AI integration.

2. Users

Customer: create tickets, view ticket status, and exchange messages with the assigned agent.

Support Agent: view assigned tickets, review AI suggestions, reply, update status, and resolve tickets.

Administrator/Supervisor: optional for the core MVP; may view all tickets and basic statistics.

3. Mandatory Features

Authentication with protected customer/agent areas.

Customer ticket creation form with subject, description, and optional category.

Unique ticket number for every ticket.

Ticket status workflow: New → Assigned → In Progress → Resolved.

AI ticket triage that suggests category, priority, and short summary.

AI result must be displayed for human review before being finalized.

Agent dashboard showing tickets and their status/priority.

Agent can open a ticket, reply to the customer, and change status.

Customer can view the ticket and its latest status.

Ticket conversation/history must persist.

Basic dashboard statistics based on actual ticket data.

Responsive interface with clear loading, success, and error states.

4. Required AI Feature

Example customer complaint:

"I was charged twice for the same order and need one payment refunded."

The AI should produce structured suggestions such as:

Category: Billing

Priority: High

Summary: Possible duplicate payment reported by customer.

The agent must be able to review/edit the AI suggestions before saving them. If the AI service fails or times out, the application must still allow the ticket to be handled manually.

5. Real-Time Requirement

Implement at least one meaningful real-time feature using Socket.IO/Sockets or another course-supported approach. For example, a new agent message or ticket-status change should appear without a manual page refresh.

6. Business Rules

Only authenticated users may access protected ticket areas.

Customers can view only their own tickets.

Agents can update tickets assigned to them.

A resolved ticket cannot be changed through the normal workflow unless reopened.

Priority must be one of the defined levels, such as Low, Medium, or High.

AI output must be validated before being stored.

AI/API keys must never be exposed in frontend code.

A ticket cannot be marked Resolved without a resolution/reply note.

7. Technology

Recommended: React/Next.js + Node.js/Express + MongoDB or PostgreSQL + authentication + AI API + Socket.IO. TypeScript, Redux/Context, REST or GraphQL may be used where appropriate.

Focus on a reliable MVP. Do not add infrastructure that you cannot finish and demonstrate.

8. Optional Advanced Bonus Features

AI-generated resolution summary.

Similar/duplicate ticket detection.

Automatic ticket assignment based on category.

Real-time typing indicator.

Email notification.

Redis caching for a meaningful use case.

Background job/message queue for notifications or AI processing.

Docker containerization.

GitHub Actions CI/CD.

GraphQL endpoint for selected operations.

9. Expected Demonstration

Customer logs in and submits a ticket.

AI analyzes the complaint and suggests category, priority, and summary.

Agent reviews/edits the AI result.

Ticket becomes visible to the agent.

Customer and agent exchange at least one message.

A status change is reflected in real time.

Agent resolves the ticket with a resolution note.

Dashboard statistics reflect the ticket.🌟 The Big IdeaThink of QuickServe like Uber or Airbnb, but for local services (like hiring a plumber, a dog walker, or a math tutor).Right now, people find these helpers through messy WhatsApp messages or random Facebook posts. Your job is to build a clean, simple website where a customer can find a helper, book them, and pay or review them all in one place.👥 The Two Types of UsersYour website needs to work for two different kinds of people when they log in:The Customer (The Buyer):Looks for helpers.Books a service.Tracks the status of their order.Leaves a review when the job is done.The Service Provider (The Worker):Sets up their profile (name, price, what they do).Sees incoming job requests.Chooses to Accept or Reject the job.Clicks buttons to show they are working on it or have finished it.🛠️ The 8 Steps the App Must Do (The Workflow)To get full marks, your app must successfully complete this exact chain of events without crashing:Step 1: The Customer logs in to the website.Step 2: The Customer searches for a service (e.g., "Electrician") and clicks on a provider's profile.Step 3: The Customer fills out a form to book a request (picking a date, time, and writing a description).Step 4: The Provider logs in and sees this new request waiting on their dashboard.Step 5: The Provider clicks Accept.Step 6: When the Provider starts working, they click In Progress.Step 7: When the Provider finishes, they click Completed.Step 8: The Customer logs back in, sees the job is finished, and leaves a 1-to-5 star review.📜 The Strict Rules (Business Rules)Your app needs smart logic so users can't break the system. You must code these rules:No Copycats: Every single booking must get its own unique ID number.No Blank Forms: Users can't submit a booking without filling in the date, time, and location.No Time Travel: A customer cannot review a worker before the worker marks the job as finished.One Review Only: A customer cannot spam reviews. Only one review per finished job.Dead Ends: If a provider clicks Reject on a job, that job is dead. It can never be moved to "In Progress."Frozen History: Once a job is marked Completed, nobody can change the date, time, or description anymore. It is locked.💻 The Tech Stack (What to Build it With)Your teachers want you to use modern web tools you learned in class:The Brains & UI: React (JavaScript or TypeScript) to build the pages and components.The Pages: React Router to let users click between the Home page, Dashboard, and Login page.The Memory: Supabase or Firebase. This is your database. If a user types in a booking and refreshes the page, the data must not disappear.The Outfit: Tailwind CSS, Bootstrap, or Material UI to make the website look pretty and work nicely on both phones and computers.✅ Login/Register

✅ Customer/Provider role

✅ Service search

✅ Provider profile

✅ Booking form

✅ Provider dashboard

✅ Accept/Reject

✅ In Progress

✅ Completed

✅ Customer booking status

✅ 1–5 star review

✅ Supabase database

✅ Business rules

✅ Responsive UI

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7adc1dcf-56b1-44f2-83ce-e61d3f085e6a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
