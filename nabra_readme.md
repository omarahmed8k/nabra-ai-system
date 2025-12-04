# Nabra AI System - Complete Project Documentation

## 🎯 Project Overview

**Nabra AI System** is a comprehensive SaaS project management platform that connects clients with service providers through a credit-based subscription model. The platform streamlines digital service delivery including web development, design, video production, and more.

### Key Features

- ✅ **Credit-Based Subscription System** - Purchase credits to create service requests
- ✅ **Smart Revision Algorithm** - Free revisions with paid overflow using credits
- ✅ **Role-Based Access Control** - Super Admin, Provider, and Client roles
- ✅ **Real-time Communication** - Internal chat system per request
- ✅ **File Upload & Management** - Secure S3/R2 integration
- ✅ **Rating & Review System** - Client feedback on completed requests
- ✅ **Comprehensive Admin Dashboard** - Full system management

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- tRPC for type-safe APIs
- React Query for data fetching

**Backend:**
- Next.js API Routes
- tRPC server
- PostgreSQL database
- Prisma ORM
- NextAuth.js for authentication

**Infrastructure:**
- AWS S3 / Cloudflare R2 (file storage)
- Vercel (deployment)
- Resend (email service)

---

## 📁 Project Structure

```
nabra-system/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data script
├── src/
│   ├── app/
│   │   ├── (auth)/            # Authentication pages
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       └── register/
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── client/        # Client portal
│   │   │   ├── provider/      # Provider dashboard
│   │   │   └── admin/         # Admin panel
│   │   ├── (public)/          # Public pages
│   │   │   └── page.tsx       # Landing page
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth endpoint
│   │   │   ├── trpc/          # tRPC endpoint
│   │   │   └── upload/        # File upload API
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── providers/         # Context providers
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client
│   │   ├── credit-logic.ts    # Credit management
│   │   ├── revision-logic.ts  # Smart revision algorithm
│   │   ├── trpc/              # tRPC client setup
│   │   └── utils.ts           # Utility functions
│   └── server/
│       ├── trpc.ts            # tRPC server config
│       └── routers/           # API routers
│           ├── _app.ts        # Main router
│           ├── auth.ts
│           ├── request.ts
│           ├── subscription.ts
│           ├── package.ts
│           ├── admin.ts
│           └── provider.ts
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- AWS S3 bucket (or Cloudflare R2)
- Stripe account (for payments)

### Step 1: Clone and Install

```bash
# Clone repository
git clone <your-repo>
cd nabra-system

# Install dependencies
npm install
```

### Step 2: Environment Configuration

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Fill in your environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nabra_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# AWS S3
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="nabra-files"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@nabra.com"
```

### Step 3: Database Setup

```bash
# Push schema to database
npm run db:push

# Seed with initial data
npm run db:seed

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### Step 4: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 👥 User Roles & Access

### Test Accounts (from seed)

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | admin@nabra.com | admin123456 | Full system control |
| Provider (Designer) | designer@nabra.com | provider123 | Accept/manage requests |
| Provider (Developer) | developer@nabra.com | provider123 | Accept/manage requests |
| Client | client@example.com | client123 | Create requests, manage subscription |

### Role Permissions

**Super Admin:**
- Manage packages (pricing, credits, duration)
- Manage service types
- View all users and requests
- Access analytics and reports
- Configure system settings

**Service Provider:**
- View pending requests matching skills
- Accept/reject requests
- Update request status
- Upload deliverables
- Communicate with clients
- View performance stats

**Client:**
- Purchase subscription packages
- Create service requests (consumes credits)
- Review deliverables
- Request revisions (free/paid)
- Approve completion
- Rate services

---

## 💳 Credit & Subscription System

### How It Works

1. **Purchase Package** - Client subscribes to a package (e.g., Professional - 20 credits for $299/month)
2. **Create Request** - Each new request costs **1 credit**
3. **Free Revisions** - Each package includes free revisions (e.g., 3 free revisions)
4. **Paid Revisions** - After free revisions exhausted, costs **1 credit** and resets counter

### Example Flow

```
Client subscribes to Professional Package:
- 20 credits
- 3 free revisions per request
- $299/month

Creates Request #1:
- Balance: 19 credits

Request delivered, client requests revisions:
- Revision 1: FREE (count = 1)
- Revision 2: FREE (count = 2)
- Revision 3: FREE (count = 3)
- Revision 4: COSTS 1 credit (count resets to 0, balance = 18)
- Revision 5: FREE (count = 1)
```

---

## 🔧 Smart Revision Algorithm

Located in `src/lib/revision-logic.ts`

### Logic Flow

```typescript
function handleRevisionRequest(requestId, userId):
  request = getRequest(requestId)
  subscription = getActiveSubscription(userId)
  
  maxFreeRevisions = subscription.package.maxFreeRevisions
  currentCount = request.currentRevisionCount
  
  IF currentCount < maxFreeRevisions:
    // FREE REVISION
    request.currentRevisionCount++
    request.status = 'REVISION_REQUESTED'
    return { allowed: true, cost: 0 }
  
  ELSE:
    // PAID REVISION
    IF subscription.remainingCredits >= 1:
      subscription.remainingCredits--
      request.currentRevisionCount = 0  // RESET COUNTER
      request.status = 'REVISION_REQUESTED'
      return { allowed: true, cost: 1 }
    ELSE:
      return { allowed: false, message: 'Insufficient credits' }
```

---

## 📊 Database Schema

### Core Tables

**Users** - All system users (Admin, Provider, Client)
**Provider_Profiles** - Extended provider info (skills, bio)
**Packages** - Subscription plans
**Client_Subscriptions** - Active subscriptions with credit balance
**Service_Types** - Service categories (Web, Design, Video)
**Requests** - Work orders
**Request_Comments** - Chat and deliverables
**Ratings** - Client feedback
**Notifications** - User notifications

### Key Relationships

```
User (1) -----> (N) Requests (as client)
User (1) -----> (N) Requests (as provider)
User (1) -----> (N) ClientSubscriptions
ClientSubscription (N) -----> (1) Package
Request (N) -----> (1) ServiceType
Request (1) -----> (N) RequestComments
Request (1) -----> (1) Rating
```

---

## 🎨 Features Implementation

### 1. Request Lifecycle

```
PENDING → IN_PROGRESS → DELIVERED → (REVISION_REQUESTED) → COMPLETED
```

**States:**
- `PENDING` - Awaiting provider acceptance
- `IN_PROGRESS` - Provider working on request
- `DELIVERED` - Provider submitted deliverables
- `REVISION_REQUESTED` - Client requested changes
- `COMPLETED` - Client approved and rated

### 2. File Upload System

Files are uploaded to AWS S3 via `/api/upload`:

```typescript
// Upload from client
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const { url } = await response.json();
// url: https://cdn.yoursite.com/uploads/user123/file.jpg
```

### 3. Real-time Chat

Each request has an internal chat:
- Clients and assigned providers can communicate
- System logs important events
- Deliverables attached to special comment type

### 4. Notification System

Stored in database, can be extended with:
- Email notifications (via Resend)
- Push notifications
- Real-time WebSocket updates

---

## 🔐 Security Features

- **JWT-based Authentication** - Secure session management
- **Role-Based Access Control** - Middleware protection on all routes
- **Password Hashing** - bcrypt with 12 rounds
- **SQL Injection Protection** - Prisma ORM parameterized queries
- **File Upload Validation** - Type and size restrictions
- **CORS Configuration** - API endpoint protection

---

## 📈 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables Checklist

- ✅ DATABASE_URL (production PostgreSQL)
- ✅ NEXTAUTH_URL (your domain)
- ✅ NEXTAUTH_SECRET (generate new for production)
- ✅ AWS credentials
- ✅ Stripe keys
- ✅ Email service keys

---

## 🧪 Testing

### Manual Testing Flow

1. **Register as Client** - Create account
2. **Subscribe to Package** - Purchase credits
3. **Create Request** - Submit new project
4. **Login as Provider** - Switch to provider account
5. **Accept Request** - Take ownership
6. **Update Status** - Mark as in progress
7. **Deliver Work** - Upload files
8. **Request Revision** - Test revision logic
9. **Approve & Rate** - Complete workflow

---

## 🛠️ Development Tips

### Running Database Migrations

```bash
# Create migration
npx prisma migrate dev --name add_new_feature

# Apply migrations
npx prisma migrate deploy
```

### Debugging tRPC

```bash
# Enable query logging
# In prisma/schema.prisma set log: ["query"]
```

### Adding New Service Type

1. Go to Admin Dashboard
2. Navigate to "Service Types"
3. Click "Create Service Type"
4. Define required form fields as JSON

Example:
```json
{
  "fields": [
    {
      "name": "budget",
      "type": "number",
      "label": "Budget ($)",
      "required": true
    }
  ]
}
```

---

## 📚 API Documentation

### tRPC Endpoints

**Auth Router** (`/api/trpc/auth`)
- `register` - Create new user
- `getSession` - Get current session
- `updateProfile` - Update user profile

**Request Router** (`/api/trpc/request`)
- `create` - Create new request
- `getAll` - List requests (filtered by role)
- `getById` - Get request details
- `accept` - Provider accepts request
- `updateStatus` - Update request status
- `requestRevision` - Client requests revision
- `approve` - Client approves request
- `addComment` - Add chat message
- `rate` - Submit rating

**Subscription Router** (`/api/trpc/subscription`)
- `getActive` - Get active subscription
- `subscribe` - Purchase package
- `cancel` - Cancel subscription
- `getUsageStats` - Get credit usage

**Package Router** (`/api/trpc/package`)
- `getAll` - List active packages
- `create` - Create package (admin)
- `update` - Update package (admin)

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

### tRPC Type Errors

```bash
# Regenerate Prisma client
npx prisma generate
```

### File Upload Fails

- Check AWS credentials
- Verify S3 bucket permissions
- Check CORS settings on bucket

---

## 🔄 Future Enhancements

- [ ] Real-time WebSocket notifications
- [ ] Stripe payment integration
- [ ] Email notification templates
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered request matching
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Calendar integration
- [ ] Export reports (PDF)

---

## 📄 License

MIT License - feel free to use for commercial projects

---

## 🤝 Support

For issues or questions:
- Create GitHub issue
- Email: support@nabra.com

---

**Built with ❤️ using Next.js, Prisma, and tRPC**
