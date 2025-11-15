# The Agent's Agent - Real Estate AI Chat Widget SaaS

A multi-tenant SaaS application that provides embeddable AI chat widgets for real estate agents to capture and qualify leads on their websites.

## Features

### ✅ Core MVP Features Implemented

- **Multi-tenant authentication** - Email/password signup with secure session management
- **Public marketing site** - Landing pages for features, pricing, and demo
- **Widget management** - Create, customize, and manage AI chat widgets
- **Embeddable widget system** - JavaScript snippet that works on any website
- **Lead capture & qualification** - Automatic lead scoring based on conversation content
- **Dashboard analytics** - View leads, conversations, and widget performance
- **Real-time chat** - Instant messaging between visitors and AI agent

### 🏗️ Architecture

**Frontend:** Next.js 15 with TypeScript, Tailwind CSS
**Backend:** Next.js API Routes with TypeScript
**Database:** SQLite (via Prisma ORM) - easily switchable to PostgreSQL
**Authentication:** JWT-based sessions with secure HTTP-only cookies

### 🗄️ Database Schema

- **Users** - Agent accounts with tenant association
- **Tenants** - Company/agency accounts (multi-tenant isolation)
- **Widgets** - Embeddable chat widget configurations
- **Conversations** - Chat sessions between visitors and AI
- **Leads** - Qualified prospects with contact info and scoring
- **Messages** - Individual chat messages with sender type

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
cd "the agent's agent"
npm install
```

2. **Set up environment variables:**
```bash
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

3. **Initialize database:**
```bash
npm run db:generate
npm run db:push
```

4. **Start development server:**
```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

### Testing the Complete Flow

1. **Sign up for an account** at `/signup`
2. **Create a widget** in the dashboard at `/app/widgets`
3. **Copy the embed code** and test on the `/demo` page
4. **Chat with the widget** to generate leads
5. **View captured leads** in the dashboard at `/app/leads`

## API Endpoints

### Public APIs (for embedded widgets)

- `GET /widget.js` - Widget JavaScript code
- `GET /api/widget-config/[widgetId]` - Widget configuration
- `POST /api/conversations` - Start new conversation
- `POST /api/messages` - Send message and get AI response

### Protected APIs (authenticated users)

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User authentication  
- `POST /api/auth/logout` - End user session
- `GET /api/auth/me` - Get current user
- `GET /api/widgets` - List user's widgets
- `POST /api/widgets` - Create new widget

## Embedding the Widget

Add this code to any website:

```html
<script src="https://your-domain.com/widget.js" data-widget-id="YOUR_WIDGET_ID"></script>
<div id="realestate-ai-widget"></div>
```

The widget will:
- Display as a floating chat bubble
- Open a full chat interface when clicked
- Automatically qualify leads based on conversation
- Store all interactions in your dashboard

## AI Lead Qualification

The AI uses rule-based logic to:
- Identify buyer/seller/rental intent
- Collect contact information (name, email, phone)
- Assess lead quality with scoring (25-100%)
- Categorize leads by intent and timeline

**Qualification Factors:**
- Intent clarity (buy/sell/rent): +25 points
- Engagement level (message count): +20 points
- Budget/price discussion: +15 points
- Timeline mentioned: +15 points
- Location specified: +10 points

## Production Deployment

### Database Migration

For production, switch to PostgreSQL:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Security Checklist

- [ ] Generate strong JWT secrets
- [ ] Set secure session cookies in production
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Monitor for SQL injection attempts

### Scaling Considerations

- **Database:** Move to PostgreSQL with connection pooling
- **Real-time:** Add WebSocket support for instant messaging
- **AI:** Integrate with OpenAI, Claude, or custom LLM
- **Analytics:** Add comprehensive tracking and reporting
- **Billing:** Integrate with Stripe for subscription management

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Protected dashboard routes
│   │   └── app/          # Dashboard pages
│   ├── api/              # API route handlers
│   ├── (marketing)/      # Public marketing pages
│   └── globals.css       # Global styles
├── components/           # Reusable React components
├── lib/                 # Utility functions
│   ├── auth.ts          # Authentication logic
│   ├── prisma.ts        # Database client
│   └── session.ts       # Session management
└── types/               # TypeScript type definitions

prisma/
└── schema.prisma        # Database schema

public/                  # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with detailed description

## License

MIT License - see LICENSE file for details

---

**Next Steps for Production:**

- [ ] Add real-time WebSocket support
- [ ] Integrate with actual AI/LLM service
- [ ] Implement comprehensive analytics
- [ ] Add Stripe billing integration
- [ ] Set up monitoring and logging
- [ ] Add automated testing suite
- [ ] Create mobile-responsive improvements