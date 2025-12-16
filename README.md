# Amot Calculator

A full-stack web application for splitting bills and calculating who owes whom. Perfect for group outings, dinners, and shared expenses.

## Features

- **Session Management**: Create and manage multiple bill-splitting sessions
- **Participant Tracking**: Add participants to each session
- **Item-by-Item Tracking**: Record individual items with custom split amounts
- **Flexible Splitting**: Split items equally or specify custom amounts per person
- **Settlement Calculation**: Automatically calculate who owes whom
- **Summary View**: See total paid, total owed, and net balance for each participant

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL database
- Prisma ORM
- CORS enabled

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Start the Database

The project uses Prisma Dev which runs a local PostgreSQL instance:

```bash
cd server
npx prisma dev
```

Keep this terminal window open. The database will run on a dynamically assigned port.

### 3. Set Up the Database Schema

In a new terminal:

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Run migrations (if not already done)
npx prisma migrate dev --name init
```

### 4. Start the Backend Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:5000`

### 5. Start the Frontend

In another terminal:

```bash
cd client
npm run dev
```

The app will be available at `http://localhost:3000`

## How to Use

1. **Create a Session**: On the home page, create a new session (e.g., "Friday Night Out")
2. **Add Participants**: Add all the people who are part of the group
3. **Add Items**: Record each expense
   - Enter description (e.g., "Pizza")
   - Enter total amount
   - Select who paid
   - Choose who to split the cost among
   - Use equal split or custom amounts
4. **View Settlement**: Switch to the "Settlement" tab to see:
   - Who owes whom and how much
   - Summary of each participant's totals

## Migrating to Supabase

Since this project uses PostgreSQL, migrating to Supabase is straightforward:

### Steps:

1. **Create a Supabase Project** at https://supabase.com

2. **Get Your Database URL** from Supabase:
   - Go to Project Settings → Database
   - Copy the connection string (URI format)

3. **Update Environment Variables**:
   ```bash
   # server/.env
   DATABASE_URL="your-supabase-connection-string"
   ```

4. **Run Migrations**:
   ```bash
   cd server
   npx prisma migrate deploy
   ```

5. **Stop Prisma Dev** (no longer needed)

6. **Restart Your Server**:
   ```bash
   npm run dev
   ```

That's it! Your app is now connected to Supabase.

### Benefits of Supabase:
- Hosted PostgreSQL database
- Automatic backups
- Real-time subscriptions (for future features)
- Built-in authentication (for future features)
- Dashboard for database management

## API Endpoints

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get session details
- `DELETE /api/sessions/:id` - Delete session

### Participants
- `POST /api/sessions/:sessionId/participants` - Add participant
- `GET /api/sessions/:sessionId/participants` - List participants
- `DELETE /api/participants/:id` - Remove participant

### Items
- `POST /api/sessions/:sessionId/items` - Add item
- `GET /api/sessions/:sessionId/items` - List items
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Settlements
- `GET /api/sessions/:sessionId/settlements` - Calculate settlements

## Database Schema

- **sessions**: Stores bill-splitting sessions
- **participants**: People in each session
- **items**: Individual expenses
- **item_splits**: How each item is split among participants

## Development Scripts

### Client
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Server
```bash
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript
npm start                # Run compiled JavaScript
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

## Future Enhancements

- User authentication
- Shareable session links
- Export to PDF/CSV
- Currency selection
- Receipt photo upload
- Transaction minimization algorithm
- Mobile-responsive improvements
- Dark mode

## License

MIT
