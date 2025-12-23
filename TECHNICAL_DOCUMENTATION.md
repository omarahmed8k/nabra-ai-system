# NABRA AI SYSTEM - Technical Documentation

## 📋 Table of Contents

1. System Overview
2. Business Model
3. Database Structure
4. User Roles & Permissions
5. Business Logic & Algorithms
6. Key User Workflows
7. Features by Role
8. Technology Stack
9. Notification System
10. Data Management

---

## 1. SYSTEM OVERVIEW

### What is Nabra AI System?

Nabra AI System is a **credit-based digital services marketplace** that connects clients with professional service providers (designers, developers, content creators, etc.) through a simple subscription model.

### Core Problem It Solves

Instead of clients negotiating price per project, they subscribe to packages and purchase credits upfront. Service providers claim jobs and deliver work. This eliminates endless negotiations and creates a transparent, fixed-price marketplace.

### Key Innovation: Smart Revision Counter

After a client gets their free revisions, if they pay for one more revision, the free counter resets! This gives clients more free revisions after they invest in paid ones.

---

## 2. BUSINESS MODEL

### 2.1 How It Works (Simple View)

```
CLIENT FLOW:
1. Register as client
2. Browse subscription packages (Starter $49, Pro $149, Enterprise $299)
3. Choose package → Submit payment proof
4. Admin approves payment → Credits added
5. Browse available services included in package
6. Create service requests by paying with credits
7. Work with assigned provider
8. Request revisions if needed (free or paid)
9. Rate and complete

PROVIDER FLOW:
1. Admin creates provider account
2. Admin assigns allowed services to provider
3. Provider views available requests matching their services
4. Provider claims request (takes ownership)
5. Works on the service
6. Delivers work
7. If client wants revision → redo work
8. Client completes and rates
```

### 2.2 Subscription Model

**Packages Available:**

- **Starter Package**: $49 USD → 5 credits (for beginners)
- **Professional Package**: $149 USD → 20 credits (most popular)
- **Enterprise Package**: $299 USD → 50 credits (high volume)
- **Free Package**: For testing (limited services)

**How Subscriptions Work:**

- User chooses package and submits payment
- Payment pending until admin verifies bank transfer
- Once approved: subscription becomes active, credits added
- Subscription valid for 30 days from activation
- After expiry: must resubscribe to continue
- Only ONE active subscription per user

### 2.3 Credit System

**What Are Credits?**

- Virtual currency for buying services
- Each service type costs different amount of credits
- Priority levels add extra credits
- Free revisions don't cost credits, paid revisions do

**Example:**

- Logo Design service base cost: 2 credits
- Set priority to High: +2 credits = 4 total
- Client has 20 credits → can afford it → deducted immediately
- If client requests revision and already used free ones: -1 credit for revision

### 2.4 Revenue Model

**For Business:**

- Customer pays money for subscription packages
- Platform keeps percentage (revenue)
- Providers eventually paid from revenue pool (future feature)

---

## 3. DATABASE STRUCTURE

### 3.1 Core Entities & Their Purposes

#### **USER** Entity

Who: Every person in the system (client, provider, admin)

Fields:

- ID, Name, Email, Password, Phone number
- Role: CLIENT | PROVIDER | SUPER_ADMIN
- Profile image, Email verified status
- Registration IP (for security)
- Created/Updated/Deleted timestamps

Purpose: Authentication, identity, role-based access

---

#### **PROVIDER_PROFILE** Entity

Who: Extra information for providers only

Fields:

- Provider's bio/about
- Portfolio links
- Skills tags (e.g., "logo design", "web development")
- Is active status
- Services they can handle

Purpose: Let clients see provider qualifications, let providers showcase skills

---

#### **SERVICE_TYPE** Entity

What: Types of services offered (Logo Design, Web Development, Content Writing, etc.)

Fields:

- Service name
- Description
- Icon for UI
- Base credit cost (e.g., 2 credits)
- Max free revisions allowed (e.g., 3)
- Paid revision cost (e.g., 1 credit)
- Reset counter after paid revision? (YES/NO)
- Priority costs (Low: +0, Medium: +1, High: +2 credits)
- Custom attributes/questions for clients filling request

Purpose: Define what services are available, pricing, revision rules

Example Service:

```
Name: "Logo Design"
Base Cost: 2 credits
Max Free Revisions: 3
Paid Revision Cost: 1 credit
Reset Counter: YES (after paying, get 3 free again)
Priority costs: Low +0, Medium +1, High +2
Questions: "What's your budget color?", "Do you want modern or classic?"
```

---

#### **PACKAGE** Entity

What: Subscription packages clients buy

Fields:

- Package name (Starter, Pro, Enterprise)
- Description
- Price in USD
- Credits included
- Duration in days (usually 30)
- Features list
- Is active/disabled?
- Is free package?
- Display order

Purpose: Define subscription tiers, what credits they include, pricing

---

#### **PACKAGE_SERVICE** Entity

What: Links packages to allowed services

Purpose: If client buys "Starter Package", they can ONLY create requests for services linked to Starter

- Starter might include: Logo Design, Social Posts, Basic Copy
- Pro might include: Above + Web Pages, Videos, Illustrations
- Enterprise: Everything

---

#### **CLIENT_SUBSCRIPTION** Entity

Who: Active or past subscriptions for clients

Fields:

- Client ID
- Package ID
- Remaining credits (updated as client uses them)
- Start date, End date
- Is active? (YES/NO)
- Free trial used? (can only use once)
- Cancelled date (if cancelled)

Purpose: Track what package each client has, how many credits left, expiry date

Example:

- User @Ali subscribes to Pro Package ($149)
- Gets 20 credits
- Uses 5 credits on first request
- Remaining: 15 credits
- After 30 days: subscription expires, can't create new requests

---

#### **PAYMENT_PROOF** Entity

What: Manual payment verification for subscriptions

Fields:

- Subscription ID (which subscription this payment is for)
- Transfer image/screenshot (uploaded by client)
- Sender name, bank, country
- Amount, currency
- Transfer date, reference number
- Status: PENDING | APPROVED | REJECTED
- Reviewed by (admin), review date
- Rejection reason (if rejected)

Purpose: Bank transfer proof system for verification

Workflow:

1. Client creates subscription (status = inactive)
2. Client uploads: screenshot of transfer, bank name, amount, etc.
3. Admin sees pending payment
4. Admin verifies: "Yes, this transfer matches what they said"
5. Admin approves → Subscription activated, credits added
6. Or Admin rejects → Client needs to resubmit

---

#### **REQUEST** Entity

What: Service request created by client

Fields:

- Title, Description
- Client ID (who created)
- Provider ID (if assigned)
- Service Type ID (which service)
- Status: PENDING | IN_PROGRESS | DELIVERED | REVISION_REQUESTED | COMPLETED | CANCELLED
- Priority: 1 (low) | 2 (medium) | 3 (high)
- Base credit cost, Priority credit cost, Total credit cost
- Client's answers to service questions (stored as JSON)
- Attachments (files client uploads)
- Estimated delivery date
- Current revision count, Max revisions
- Created, Updated, Completed timestamps
- Soft delete support (if cancelled)

Purpose: Core job/request in system - tracks everything about a service request

Example:

```
Title: "Design company logo"
Client: @Ali
Service: Logo Design (2 base credits)
Priority: High (+2 credits)
Total Cost: 4 credits
Status: PENDING (waiting for provider)
Questions answered:
  - "Color preference?": "Blue and gold"
  - "Style?": "Modern minimalist"
Attachments: brand-guidelines.pdf, reference-image.jpg
```

---

#### **REQUEST_COMMENT** Entity

What: Messages and communications on a request

Fields:

- Request ID
- User ID (who sent)
- Message content
- Type: MESSAGE | SYSTEM | DELIVERABLE
- Files attached
- Is read? (YES/NO)
- Timestamp

Purpose: Communication between client and provider, deliverables, system notifications

Types:

- MESSAGE: Chat between client/provider
- SYSTEM: Automatic status change notifications
- DELIVERABLE: Provider uploads final files here

---

#### **RATING** Entity

What: Client reviews provider after completion

Fields:

- Request ID
- Client ID, Provider ID
- Rating: 1-5 stars
- Review text
- Timestamp

Purpose: Quality assurance, reputation system for providers

---

#### **NOTIFICATION** Entity

What: In-app notifications for users

Fields:

- User ID (who receives)
- Title, Message
- Type: message | status_change | assignment | general | payment | subscription | request
- Link to related resource
- Is read?
- Timestamp

Purpose: Alert users to important events (new message, status change, payment approved, etc.)

Delivery Methods:

- In-app (database stored, SSE real-time)
- Email (for critical events)

---

#### **SYSTEM_SETTINGS** Entity

What: Admin configuration storage

Purpose: Store system-wide settings as key-value pairs (not heavily used currently)

---

### 3.2 Entity Relationships (Visual)

```
USER (1) ──→ (many) PROVIDER_PROFILE (if role = PROVIDER)
USER (1) ──→ (many) CLIENT_SUBSCRIPTION
USER (1) ──→ (many) REQUEST (as client)
USER (1) ──→ (many) REQUEST (as provider)
USER (1) ──→ (many) RATING
USER (1) ──→ (many) NOTIFICATION
USER (1) ──→ (many) REQUEST_COMMENT

PACKAGE (1) ──→ (many) CLIENT_SUBSCRIPTION
PACKAGE (1) ──→ (many) PACKAGE_SERVICE
PACKAGE (1) ──→ (many) RATING

SERVICE_TYPE (1) ──→ (many) REQUEST
SERVICE_TYPE (1) ──→ (many) PACKAGE_SERVICE

CLIENT_SUBSCRIPTION (1) ──→ (1) PAYMENT_PROOF

REQUEST (1) ──→ (many) REQUEST_COMMENT
REQUEST (1) ──→ (1) RATING
```

---

## 4. USER ROLES & PERMISSIONS

### 4.1 CLIENT Role

**Who:** End customers who buy services

**Permissions:**

- ✅ Register account
- ✅ Browse and buy subscription packages
- ✅ Upload payment proof
- ✅ Create service requests (using credits)
- ✅ View own requests
- ✅ Send messages to provider
- ✅ Request revisions (free or paid)
- ✅ Rate provider after completion
- ✅ View subscription status and credit balance
- ✅ Update profile (name, email, phone, image)
- ❌ Cannot see other clients' requests
- ❌ Cannot assign providers
- ❌ Cannot approve payments

**Dashboard:** Personal dashboard showing:

- Active subscription and expiry
- Credit balance
- My requests with status
- Earnings from ratings (future)
- Payment history

---

### 4.2 PROVIDER Role

**Who:** Professional service providers

**Permissions:**

- ✅ View available requests (only matching their services)
- ✅ Claim/accept a request
- ✅ Update request status to IN_PROGRESS or DELIVERED
- ✅ Send messages with deliverables
- ✅ Update own profile (bio, portfolio, skills)
- ✅ View earnings summary
- ✅ See own ratings and reviews
- ❌ Cannot create requests
- ❌ Cannot approve payments
- ❌ Cannot manage other providers

**Dashboard:** Shows:

- Available requests (filtered by their skills)
- My claimed requests with status
- Average rating
- Total completed requests
- Earnings (placeholder)
- Recent reviews from clients

---

### 4.3 SUPER_ADMIN Role

**Who:** System administrators with full control

**Permissions:**

- ✅ All operations (everything clients and providers can do)
- ✅ Manage users (create, edit, delete, change roles)
- ✅ Manually assign providers to requests
- ✅ Review and approve/reject payment proofs
- ✅ Create, edit, disable service types
- ✅ Create, edit, disable packages
- ✅ View all requests across system
- ✅ Soft delete users, requests, services, packages
- ✅ Restore deleted items
- ✅ View analytics and revenue reports
- ✅ Manage system settings

**Dashboard:** Comprehensive admin panel showing:

- Revenue statistics
- User growth charts
- Request distribution
- Top providers by rating
- Pending payment approvals
- System health metrics

---

## 5. BUSINESS LOGIC & ALGORITHMS

### 5.1 Credit System (How Money Works)

**Overview:**
Credits are the internal currency. Clients buy packages which include credits, then spend credits on requests.

**Algorithm: Deducting Credits**

```
STEP 1: Client clicks "Create Request"
STEP 2: System calculates total credit cost:
        - Get service base cost (from SERVICE_TYPE)
        - Get priority cost (from SERVICE_TYPE based on selected priority)
        - Total = base + priority

STEP 3: Check if client has active subscription
        - If NO → Show error "No active subscription"
        - If YES → Continue

STEP 4: Check if client has enough credits
        - If remainingCredits >= totalCost → Continue
        - If remainingCredits < totalCost → Show error "Not enough credits"

STEP 5: Deduct credits from subscription
        - remainingCredits = remainingCredits - totalCost
        - Save to database

STEP 6: Create request with status = PENDING
        - Request stored with totalCost recorded
        - Providers notified
```

**Example:**

- Ali has Pro Package: 20 credits
- Creates Logo Design request (2 base + 2 high priority = 4 total)
- Check: 20 >= 4? YES
- Deduct: 20 - 4 = 16 remaining
- Request created, providers notified

**Algorithm: Refunding Credits**

When admin cancels a request (before provider completes):

- Add credits back: remainingCredits += totalCost
- Request marked as CANCELLED
- Client notified

---

### 5.2 Smart Revision Algorithm (The Innovation)

**Purpose:** Allow free revisions, but after paid revisions, reset counter to give more free ones

**Key Fields:**

- `maxFreeRevisions`: How many free revisions (e.g., 3)
- `paidRevisionCost`: Credit cost for paid revision (e.g., 1)
- `resetFreeRevisionsOnPaid`: Should counter reset after paying? (YES/NO)
- `currentRevisionCount`: Tracks current revisions

**Algorithm:**

```
CLIENT CLICKS "REQUEST REVISION" on DELIVERED request:

STEP 1: Verify request status = DELIVERED
        If not → Show error

STEP 2: Get service revision settings
        - maxFreeRevisions = 3
        - paidRevisionCost = 1
        - resetFreeRevisionsOnPaid = YES

STEP 3: Compare current count vs max free

        IF currentRevisionCount < maxFreeRevisions:
            → FREE REVISION
            - Increment currentRevisionCount (count++)
            - Deduct NO credits
            - Change status to REVISION_REQUESTED
            - Tell provider: "Free revision requested"

        ELSE (count >= max):
            → PAID REVISION
            - Check if client has credits >= paidRevisionCost

            IF yes:
                - Deduct credits (remainingCredits -= paidRevisionCost)
                - IF resetFreeRevisionsOnPaid = YES:
                    - Set currentRevisionCount = 0 (RESET!)
                    - Client gets 3 more free revisions now
                  ELSE:
                    - Keep currentRevisionCount as is
                - Change status to REVISION_REQUESTED
                - Tell provider: "Paid revision requested"

            ELSE (no credits):
                - Show error: "Not enough credits for revision"
```

**Real-World Example:**

Service: Logo Design

- Max free revisions: 3
- Paid revision cost: 1 credit
- Reset enabled: YES

Timeline:

```
Revision 1: FREE (count=1, client has 16 credits)
Revision 2: FREE (count=2, client has 16 credits)
Revision 3: FREE (count=3, client has 16 credits)
Revision 4: PAID -1 credit (count RESETS to 0, client has 15 credits)
            ← CLIENT NOW HAS 3 MORE FREE REVISIONS!
Revision 5: FREE (count=1, client has 15 credits)
Revision 6: FREE (count=2, client has 15 credits)
Revision 7: FREE (count=3, client has 15 credits)
Revision 8: PAID -1 credit (count resets to 0, client has 14 credits)
            ← ANOTHER 3 FREE REVISIONS!
```

---

### 5.3 Priority System

**Purpose:** Allow clients to pay extra for urgent delivery

**How It Works:**

Each SERVICE_TYPE has 3 priority multipliers:

```
Priority 1 (Low):     +0 credits (default, normal speed)
Priority 2 (Medium):  +1 credit extra (faster)
Priority 3 (High):    +2 credits extra (fastest, urgent)
```

**Calculation:**

```
Total Cost = Service Base Cost + Priority Cost

Example:
Service: Logo Design (2 base credits)
Selected Priority: High
Priority Cost: +2
Total: 2 + 2 = 4 credits charged
```

**Admin Can Override:**

Each service type's priority costs can be customized:

- Logo Design: Low=0, Medium=1, High=2
- Web Development: Low=0, Medium=3, High=5 (more expensive)

---

### 5.4 Service Attributes (Custom Questions)

**Purpose:** Ask service-specific questions when creating requests

**How It Works:**

Each SERVICE_TYPE has custom attributes/questions stored as JSON:

```json
{
  "attributes": [
    {
      "question": "What's your preferred color?",
      "required": true,
      "type": "text",
      "placeholder": "e.g., Blue, Red, Multi-color"
    },
    {
      "question": "Is this an offer or regular post?",
      "required": true,
      "type": "select",
      "options": ["Offer", "Regular"]
    },
    {
      "question": "How many revisions do you expect?",
      "required": false,
      "type": "text"
    }
  ]
}
```

**Validation:**

- Required fields must have answers
- Select fields must match available options
- Multiselect answers must be arrays

**Stored In Request:**
Client's answers stored in REQUEST.attributeResponses:

```json
{
  "What's your preferred color?": "Blue",
  "Is this an offer or regular post?": "Offer"
}
```

---

### 5.5 Payment Verification Workflow

**Current System:** Manual bank transfer verification (no Stripe/PayPal)

**Workflow:**

```
STEP 1: CLIENT INITIATES
        - Client selects package
        - System creates INACTIVE subscription
        - Shows bank details (IBAN, account name)

STEP 2: CLIENT MAKES TRANSFER
        - Client makes actual bank transfer
        - Client has screenshot/proof

STEP 3: CLIENT SUBMITS PROOF
        - Uploads transfer screenshot
        - Enters: sender name, sender bank, country
        - Enters: amount, currency, date, reference number
        - Optionally: additional notes

STEP 4: PAYMENT_PROOF CREATED
        - status = PENDING
        - Admin notified via notification

STEP 5: ADMIN REVIEWS
        - Admin opens pending payments
        - Views transfer image/screenshot
        - Verifies amount matches subscription price
        - Verifies date/reference look legitimate

STEP 6: ADMIN APPROVES or REJECTS

        IF APPROVE:
            - Update payment_proof: status = APPROVED
            - Update subscription: isActive = true
            - Calculate end date: today + 30 days
            - Add credits to subscription
            - Client receives email: "Payment approved!"
            - Client can now create requests

        IF REJECT:
            - Update payment_proof: status = REJECTED
            - Add rejection reason
            - Client receives email with reason
            - Subscription stays INACTIVE
            - Client can resubmit payment proof

STEP 7: CLIENT CAN RETRY
        - If rejected, client can submit another proof
        - Or choose different package
```

---

### 5.6 Soft Delete System

**Purpose:** Delete data without permanently removing it (for privacy, data retention, analytics)

**Models Supporting Soft Delete:**

- USER (field: deletedAt)
- SERVICE_TYPE (fields: deletedAt + isActive flag)
- PACKAGE (fields: deletedAt + isActive flag)
- REQUEST (field: deletedAt, status=CANCELLED)

**How It Works:**

Normal Delete ❌

```
DELETE FROM users WHERE id = 5
→ Row completely removed
→ Cannot recover
```

Soft Delete ✅

```
UPDATE users SET deletedAt = NOW() WHERE id = 5
→ Row still exists but marked as deleted
→ Can be restored: UPDATE users SET deletedAt = null WHERE id = 5
```

**Database Queries Automatically Filter:**

```
SELECT * FROM users WHERE deletedAt IS NULL
→ Only returns non-deleted users
```

**Benefits:**

- User privacy: data "deleted" from their view
- Admin recovery: can restore if mistake
- Analytics: keep historical data for reports
- Audit trail: see who deleted what and when

---

## 6. KEY USER WORKFLOWS

### 6.1 New Client Journey: From Registration to First Request

```
DAY 1: REGISTRATION
┌─ Client visits website
├─ Clicks "Sign Up"
├─ Fills: name, email, password, phone
├─ System creates USER (role=CLIENT)
├─ Sends verification email (optional)
└─ Redirect to dashboard

DAY 1: CHOOSE PACKAGE
┌─ Client on dashboard sees: "No active subscription"
├─ Client clicks "Browse Packages"
├─ Sees 3 options:
│  - Starter: $49 (5 credits)
│  - Pro: $149 (20 credits)
│  - Enterprise: $299 (50 credits)
├─ Client chooses "Pro Package"
└─ System creates: CLIENT_SUBSCRIPTION (status=inactive)

DAY 1: PAYMENT
┌─ Client sees: "Complete your payment"
├─ System shows: Bank account details (IBAN, account name)
├─ Client makes bank transfer: $149
├─ Client uploads screenshot proof
├─ Enters: sender name, bank name, country
├─ Enters: amount=$149, date, reference number
├─ PAYMENT_PROOF created (status=PENDING)
└─ System notification: "Waiting for admin review"

DAY 2: ADMIN APPROVES (usually within 24h)
┌─ Admin logs in
├─ Sees pending payment
├─ Reviews screenshot: amount matches, looks legit
├─ Clicks "Approve"
├─ System:
│  ├─ Updates payment_proof: status=APPROVED
│  ├─ Updates subscription: isActive=true
│  ├─ Sets end date: 30 days from now
│  ├─ Adds 20 credits to remainingCredits
│  ├─ Sends client email: "Payment confirmed! You have 20 credits"
│  └─ Creates NOTIFICATION: "Subscription activated"
└─ Client receives notification

DAY 2: BROWSE SERVICES
┌─ Client on dashboard sees: "Active subscription, expires in 30 days, 20 credits"
├─ Client clicks "Create Request"
├─ System shows only services included in Pro Package:
│  - Logo Design (2 credits)
│  - Social Media Post (1 credit)
│  - Copy Writing (2 credits)
│  - etc. (not: Web Development, Video)
└─ Client selects "Logo Design"

DAY 2: CREATE REQUEST
┌─ Client fills request form:
├─ Title: "Design our company logo"
├─ Description: "Modern, professional, tech company"
├─ Priority: High (adds +2 credits)
├─ Answers attributes:
│  ├─ "Color preference?": "Blue and gold"
│  └─ "Style?": "Minimalist"
├─ Uploads reference images
├─ System calculates:
│  ├─ Base cost: 2 credits
│  ├─ Priority cost: +2 credits
│  ├─ Total: 4 credits
├─ Check: 20 >= 4? YES
├─ Deduct: 20 - 4 = 16 credits remaining
├─ REQUEST created (status=PENDING)
└─ NOTIFICATION sent to all providers with "Logo Design" skill

DAY 2: PROVIDER CLAIMS
┌─ Provider @Sarah sees notification: "New logo design request!"
├─ Provider views request details
├─ Clicks "Accept This Request"
├─ System:
│  ├─ Assigns: providerId = @Sarah
│  ├─ Updates status: IN_PROGRESS
│  └─ Notifies client: "Provider @Sarah accepted your request"
└─ Client receives notification

DAY 3-5: WORK PHASE
┌─ Provider @Sarah designs logo
├─ Client can message provider: "Can you try more minimalist?"
├─ Provider can send drafts via messages
└─ Communication back-and-forth

DAY 5: DELIVERY
┌─ Provider @Sarah feels design is ready
├─ Clicks "Deliver"
├─ Uploads final logo files
├─ Adds message: "Here's your logo in 3 formats"
├─ System updates status: DELIVERED
├─ Client receives notification: "Your logo design is ready!"
└─ Client sees ready files

DAY 5-6: REVISION OR COMPLETE
Client option 1: REVISION
├─ Client clicks "Request Revision"
├─ System checks: currentRevisionCount=0 < maxFreeRevisions=3
├─ Allowed: FREE revision
├─ Status: REVISION_REQUESTED
├─ Provider notified: "Revision requested"
├─ Provider redoes work (loop back to delivery)

Client option 2: COMPLETE
├─ Client clicks "Complete Request"
├─ System requires rating first
├─ Client rates: 5 stars, "Perfect! Exceeded expectations"
├─ RATING created
├─ System updates REQUEST: status=COMPLETED
├─ Provider notified: "Request completed with 5-star review!"
└─ Dashboard updated

DAY 6: FINAL STATE
┌─ Client dashboard shows:
│  ├─ Subscription: 16/20 credits remaining (4 used)
│  ├─ Active for: 24 more days
│  ├─ Request: Logo Design - COMPLETED
│  └─ Can create more requests!
├─ Provider dashboard shows:
│  ├─ New completed request
│  ├─ New 5-star rating
│  └─ Ready to accept more requests
└─ Both happy!
```

---

### 6.2 Provider Registration & Request Claim Flow

```
ADMIN SETUP:
┌─ Admin creates provider account
├─ Fills: name, email, password
├─ Sets role: PROVIDER
├─ Selects services provider can handle:
│  ├─ Logo Design
│  ├─ Social Media Graphics
│  └─ Branding
├─ Creates PROVIDER_PROFILE
└─ Sends login credentials to provider

PROVIDER FIRST LOGIN:
┌─ Provider logs in
├─ Sees welcome message
├─ Can update profile:
│  ├─ Bio: "10 years design experience"
│  ├─ Portfolio link
│  └─ Skills: [Logo Design, Branding, etc.]
└─ Ready to work

PROVIDER CLAIMS REQUESTS:
┌─ Provider visits dashboard
├─ Sees "Available Requests": 5 matching requests
├─ Each shows:
│  ├─ Client's title
│  ├─ Description preview
│  ├─ Priority (High/Medium/Low)
│  ├─ Credits offered
│  └─ "Claim Request" button
├─ Provider reads details
├─ Clicks "Claim Request"
├─ System:
│  ├─ Assigns provider to request
│  ├─ Updates status: IN_PROGRESS
│  ├─ Creates NOTIFICATION: request claimed
│  └─ Client receives email: "Your request accepted!"
└─ Request now shows in "My Claimed Requests"

PROVIDER WORKS:
┌─ Provider on request details:
├─ Can see client's requirements
├─ Can view attribute answers
├─ Can see any attachments
├─ Can send messages to client
├─ Delivery status options:
│  ├─ UPDATE STATUS → "IN_PROGRESS" (already is)
│  └─ UPDATE STATUS → "DELIVERED" (ready to show)
├─ When ready, uploads files
├─ Adds note: "Here's the first draft"
├─ Updates status to "DELIVERED"
└─ Client notified

REVISIONS:
┌─ Client requests revision
├─ Status becomes: REVISION_REQUESTED
├─ Provider notified
├─ Provider re-works
├─ Provider re-delivers
├─ Can repeat many times (depending on package)
└─ Client eventually completes

COMPLETION:
┌─ Client rates provider
├─ Request marked COMPLETED
├─ Provider dashboard shows:
│  ├─ Completed job count +1
│  ├─ Rating visible (e.g., 5 stars)
│  └─ Reviews from this client
└─ Provider ready for next request
```

---

### 6.3 Revision Request Flow (With Reset Example)

```
SERVICE SETUP (Admin):
┌─ Service: "Logo Design"
├─ Max free revisions: 3
├─ Paid revision cost: 1 credit
└─ Reset enabled: YES (give 3 more free after paid)

REQUEST TIMELINE:

1. REQUEST CREATED & DELIVERED
   ├─ Client has: 20 credits
   ├─ Status: DELIVERED
   └─ currentRevisionCount: 0

2. REVISION 1 (FREE)
   ├─ Client clicks "Request Revision"
   ├─ Check: 0 < 3? YES → FREE
   ├─ Deduct: 0 credits
   ├─ Credit balance: still 20
   ├─ Update: currentRevisionCount = 1
   └─ Status: REVISION_REQUESTED

3. PROVIDER RE-DELIVERS
   ├─ Provider updates files
   ├─ Status: DELIVERED again
   └─ Client gets notification

4. REVISION 2 (FREE)
   ├─ Client clicks "Request Revision"
   ├─ Check: 1 < 3? YES → FREE
   ├─ Deduct: 0 credits
   ├─ Credit balance: still 20
   ├─ Update: currentRevisionCount = 2
   └─ Status: REVISION_REQUESTED

5. PROVIDER RE-DELIVERS
   ├─ Status: DELIVERED

6. REVISION 3 (FREE)
   ├─ Client clicks "Request Revision"
   ├─ Check: 2 < 3? YES → FREE
   ├─ Deduct: 0 credits
   ├─ Credit balance: still 20
   ├─ Update: currentRevisionCount = 3
   └─ Status: REVISION_REQUESTED

7. PROVIDER RE-DELIVERS
   ├─ Status: DELIVERED

8. REVISION 4 (PAID - COUNTER RESETS!)
   ├─ Client clicks "Request Revision"
   ├─ Check: 3 < 3? NO → PAID
   ├─ Check: Have credits? 20 >= 1? YES
   ├─ Deduct: 1 credit
   ├─ Credit balance: NOW 19
   ├─ RESET: currentRevisionCount = 0 ← KEY INNOVATION!
   ├─ Client now has 3 MORE FREE REVISIONS!
   └─ Status: REVISION_REQUESTED

9. PROVIDER RE-DELIVERS
   ├─ Status: DELIVERED

10. REVISION 5 (FREE AGAIN!)
    ├─ Client clicks "Request Revision"
    ├─ Check: 0 < 3? YES → FREE
    ├─ Deduct: 0 credits
    ├─ Credit balance: still 19
    ├─ Update: currentRevisionCount = 1
    └─ Infinite loop possible if client keeps paying!
```

---

### 6.4 Manual Payment Verification Workflow

```
STEP 1: CLIENT INITIATES SUBSCRIPTION (Pending)
┌─ Client: "I want Pro Package ($149)"
├─ System creates: CLIENT_SUBSCRIPTION (isActive=false)
├─ System shows: Bank details
│  ├─ Bank name: "Global Transfer Bank"
│  ├─ Account name: "NABRA AI SERVICES"
│  ├─ IBAN: "SA1234567890123456789012"
│  └─ "Amount to send: $149 USD"
├─ Client notified: "Please complete bank transfer"
└─ Status: INACTIVE (no credits yet)

STEP 2: CLIENT MAKES BANK TRANSFER
┌─ Client goes to their bank (or uses online banking)
├─ Initiates: Wire transfer / International transfer
├─ Enters:
│  ├─ Recipient: NABRA AI SERVICES
│  ├─ IBAN: SA1234567890123456789012
│  ├─ Amount: $149 USD
│  └─ Reference: subscription ID or email
├─ Completes transfer
├─ Gets confirmation: Transfer ID, Date, Reference
└─ Takes screenshot/saves proof

STEP 3: CLIENT SUBMITS PAYMENT PROOF
┌─ Client on dashboard: "Pending subscription - Complete payment"
├─ Clicks: "Upload Payment Proof"
├─ Form fields:
│  ├─ Upload screenshot image (required)
│  ├─ Sender's name (required)
│  ├─ Sender's bank (required)
│  ├─ Sender's country (required)
│  ├─ Amount sent (required): "$149"
│  ├─ Currency (required): "USD"
│  ├─ Transfer date (required)
│  ├─ Transfer reference (optional)
│  └─ Additional notes (optional)
├─ Client fills all fields
├─ Clicks "Submit"
└─ PAYMENT_PROOF created (status=PENDING)

STEP 4: ADMIN NOTIFIED
┌─ Admin receives notification: "New payment to review"
├─ Email alert (optional)
├─ Dashboard shows count: "3 pending payments"
└─ Admin logs in

STEP 5: ADMIN REVIEWS
┌─ Admin opens: "Pending Payments" section
├─ Sees list:
│  ├─ Client name, email
│  ├─ Amount, date
│  ├─ Bank name, country
│  ├─ Status: PENDING
│  └─ Actions: VIEW, APPROVE, REJECT
├─ Admin clicks: "VIEW"
├─ Admin sees:
│  ├─ Transfer screenshot (can view/zoom)
│  ├─ All details client entered
│  ├─ Reference number
│  └─ Notes
├─ Admin verifies:
│  ├─ ✓ Screenshot shows $149 transfer
│  ├─ ✓ Date looks correct
│  ├─ ✓ Reference number matches system
│  ├─ ✓ Country is acceptable
│  └─ ✓ Bank name is real

STEP 6A: ADMIN APPROVES ✅
┌─ Admin clicks: "APPROVE"
├─ System updates: payment_proof.status = APPROVED
├─ System updates: subscription.isActive = true
├─ System calculates: endDate = today + 30 days
├─ System adds credits: remainingCredits += 20
├─ System sends email to client:
│  ├─ Subject: "Payment Approved! ✅"
│  ├─ Body: "Your Pro Package is now active"
│  ├─ "You have 20 credits until [date]"
│  └─ "Start creating requests now!"
├─ Client receives notification: "Subscription activated!"
├─ Client dashboard updates:
│  ├─ Status: ACTIVE
│  ├─ Credits: 20/20
│  ├─ Expiry: [30 days from now]
│  └─ Can create requests!
└─ Happy client!

STEP 6B: ADMIN REJECTS ❌
┌─ Admin sees: Transfer amount doesn't match
├─ Or screenshot looks suspicious
├─ Or date is too old
├─ Admin clicks: "REJECT"
├─ Fill reason: "Amount shown ($100) doesn't match subscription ($149)"
├─ System sends email to client:
│  ├─ Subject: "Payment Rejected"
│  ├─ Body: "We couldn't verify your transfer"
│  ├─ Reason: "Amount shown ($100) doesn't match subscription ($149)"
│  └─ "Please resubmit with correct screenshot"
├─ Client dashboard shows:
│  ├─ Status: INACTIVE
│  ├─ Reason: "Rejected - [admin reason]"
│  └─ Option: "Resubmit Payment" or "Choose Different Package"
└─ Client can retry

STEP 7: RETRY FLOW (If rejected)
┌─ Client clicks: "Resubmit Payment"
├─ Can upload new screenshot
├─ Or make another transfer with correct amount
├─ Process repeats from STEP 2
└─ Eventually approved

OUTCOME:
- Subscription ACTIVE ✅
- Credits added ✅
- Can create requests ✅
```

---

## 7. FEATURES BY USER ROLE

### 7.1 CLIENT Features

**Account Management:**

- Register with email/password
- Update profile (name, phone, image)
- Change password
- View account status
- Manage subscription preferences

**Subscription Management:**

- Browse available packages
- Subscribe to package (pay via bank transfer)
- Upload payment proof
- View subscription status, expiry, remaining credits
- View subscription history
- Cancel subscription (if needed)

**Request Management:**

- Create requests for services in package
- Add custom details (title, description, images)
- Answer service-specific questions
- Set priority level (Low/Medium/High)
- Attach supporting files
- View all my requests with status
- Track request progress in real-time

**Request Actions:**

- Send messages to provider
- Request revision (free or paid)
- Rate and review provider
- Complete request
- Cancel request (get credits back)

**Communication:**

- Send messages in request
- Receive notifications for updates
- Read message history
- See real-time status changes

**Notifications:**

- In-app notifications dashboard
- Email alerts for important events
- See request status changes
- See payment updates
- See new messages

---

### 7.2 PROVIDER Features

**Profile Management:**

- Create provider profile
- Update bio and about
- Add portfolio links
- Add skills/expertise tags
- Update supported services
- Manage active/inactive status

**Request Management:**

- View available requests (filtered by skills)
- See request details, requirements, priority
- Claim request (take ownership)
- View claimed requests
- Manage request status (IN_PROGRESS, DELIVERED)

**Delivery & Communication:**

- Send messages to client
- Upload deliverable files
- Update request status
- Request confirmation from client
- Attach multiple files in messages
- See client feedback real-time

**Performance:**

- View completed requests count
- See average rating
- View all reviews/ratings from clients
- See earnings summary (placeholder)
- Track completion rate

**Notifications:**

- Get notified of new matching requests
- Status change notifications
- Message notifications
- See revision requests
- Get completion notifications

---

### 7.3 SUPER_ADMIN Features

**User Management:**

- Create user accounts (CLIENT or PROVIDER)
- View all users with filters
- Edit user details
- Change user role
- Soft delete users
- Restore deleted users
- View user statistics

**Request Management:**

- View all system requests
- Filter requests by status, client, provider
- See request details
- Manually assign provider to request
- Override request decisions
- Soft delete requests
- View request history

**Service Management:**

- Create service types
- Edit service pricing (base cost, priority costs)
- Configure free revision limits
- Set paid revision costs
- Create custom questions/attributes
- Disable/enable services
- Soft delete services
- Restore deleted services

**Package Management:**

- Create subscription packages
- Set package pricing and credits
- Link services to packages
- Edit package details
- Disable packages
- Soft delete packages
- Restore deleted packages

**Payment Management:**

- View all payment proofs
- Filter by status (PENDING, APPROVED, REJECTED)
- Review transfer screenshots
- Verify payment details
- Approve payments (activate subscription)
- Reject payments with reason
- See payment history

**Analytics & Reporting:**

- Revenue dashboard (total, by period)
- User growth trends
- Request distribution by service type
- Top providers by rating
- Top services by usage
- Client lifetime value
- Churn rate analysis

**System Settings:**

- Configure system parameters
- Manage app settings
- View activity logs
- Monitor system health

---

## 8. TECHNOLOGY STACK

### 8.1 Frontend Technologies

**Framework & Libraries:**

- **Next.js 16** - React framework for server-side rendering
- **React 18** - UI component library
- **TypeScript** - Type safety across codebase
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Pre-built React components
- **Framer Motion** - Animation library

**State Management & Data Fetching:**

- **TRPC** - Type-safe API client/server
- **TanStack Query (React Query)** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation for forms

**Features:**

- **next-intl** - Multi-language support (EN, AR)
- **next-pwa** - Progressive Web App (offline capability)
- **NextAuth.js** - Authentication

---

### 8.2 Backend Technologies

**Runtime & Framework:**

- **Next.js 16** - Server-side rendering and API routes
- **TypeScript** - Type safety

**API & Database:**

- **TRPC** - Type-safe API layer
- **Prisma** - ORM for database access
- **PostgreSQL** - Relational database
- **Zod** - Input validation

**Authentication:**

- **NextAuth.js v4** - Session management
- **bcryptjs** - Password hashing

**File Storage:**

- **AWS S3** - File storage for images, attachments
- **AWS SDK** - S3 client library

**Email:**

- **Nodemailer** - Email sending

**Real-time:**

- **Server-Sent Events (SSE)** - Real-time notifications

---

### 8.3 Development Tools

**Testing:**

- **Jest** - Unit testing framework
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing

**Code Quality:**

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Compile-time type checking

**Deployment:**

- **Vercel** - Hosting platform
- **Docker** - Containerization (for local development)
- **Docker Compose** - Multi-container orchestration

**Development:**

- **Husky** - Git hooks
- **Lint-staged** - Pre-commit checks

---

### 8.4 Database Schema Generation

**Prisma Migrations:**

- Automatic TypeScript type generation from schema
- Version-controlled schema changes
- Safe database migrations
- Rollback capability

---

## 9. NOTIFICATION SYSTEM

### 9.1 What Are Notifications?

Notifications are alerts that inform users about important events in the system:

- Request status changes
- New messages
- Payment approvals
- Provider assignments
- Subscription expiry warnings

### 9.2 Delivery Channels

**1. In-App Notifications**

- Displayed in dashboard notification panel
- Real-time via SSE (Server-Sent Events)
- Stored in database for history
- Can mark as read/unread

**2. Email Notifications**

- Sent for critical events
- Contains summary and action link
- Optional for some events

**3. Real-time Updates (SSE)**

- Live updates without page refresh
- Instant status changes
- New messages appear immediately

### 9.3 Notification Types & When Sent

**Message Notifications**

- Trigger: Client or provider sends message
- Recipient: The other party
- Email: Yes (with message preview)
- Action: Click to view conversation

**Status Change Notifications**

- Trigger: Request status changes
- Examples:
  - Provider accepts → Client notified
  - Delivery ready → Client notified
  - Revision completed → Client notified
- Email: Yes
- Action: View request

**Assignment Notifications**

- Trigger: Admin assigns provider to request
- Recipient: The assigned provider
- Email: Yes (with request details)
- Action: View request, accept or decline

**Payment Notifications**

- Trigger: Payment approved/rejected
- Recipient: Client who submitted payment
- Email: Yes (with approval/rejection reason)
- Action: View subscription

**Subscription Notifications**

- Trigger: Subscription expiring (7 days before)
- Trigger: Subscription expired
- Recipient: Client
- Email: Yes
- Action: Renew subscription

**General Notifications**

- System messages
- Admin announcements
- Platform updates
- Recipient: All/specific users

### 9.4 Notification Preferences

**Current System:**

- No notification preferences UI yet
- All notifications enabled by default

**Future Enhancement:**

- Allow users to disable certain notification types
- Email frequency preferences
- Quiet hours (no notifications between X-Y time)

---

### 9.5 WhatsApp Cloud API (Optional)

Enable WhatsApp notifications for users who explicitly opt in. This uses Meta’s official Cloud API and requires approved templates for outbound notifications.

- Configuration (env):
  - `WHATSAPP_ENABLED` = `true` to enable sending
  - `WHATSAPP_ACCESS_TOKEN` = permanent token
  - `WHATSAPP_PHONE_NUMBER_ID` = connected number ID
  - `WHATSAPP_LANGUAGE_CODE` = template language (e.g. `en`)
  - `WHATSAPP_TEMPLATE_MESSAGE` = template for type `message`
  - `WHATSAPP_TEMPLATE_STATUS_CHANGE` = template for type `status_change`
  - `WHATSAPP_TEMPLATE_ASSIGNMENT` = template for type `assignment`
  - `WHATSAPP_TEMPLATE_GENERAL` = template for type `general`

- Behavior:
  - When `createNotification()` runs, and WhatsApp is enabled, if the user has `hasWhatsapp=true` and a valid E.164 phone, the system sends a template message using the env-configured template corresponding to the notification `type`. The notification `message` is passed as a body parameter.
  - If the template parameters do not align, Meta will reject the send; adjust templates or parameters accordingly.

- Example cURL:

```
curl -X POST \
   -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
   -H "Content-Type: application/json" \
   "https://graph.facebook.com/v21.0/$WHATSAPP_PHONE_NUMBER_ID/messages" \
   -d '{
      "messaging_product": "whatsapp",
      "to": "+15551234567",
      "type": "template",
      "template": {
         "name": "your_template_name",
         "language": { "code": "en" },
         "components": [
            { "type": "body", "parameters": [ { "type": "text", "text": "Hello" } ] }
         ]
      }
   }'
```

- Notes:
  - Outbound notifications outside a 24h session require approved templates.
  - Meta bills per conversation; consult the latest pricing.
  - There is no free, compliant API to check if a number has WhatsApp—gate by explicit opt-in and handle API errors gracefully.

---

## 10. DATA MANAGEMENT & INTERNATIONALIZATION

### 10.1 Multi-Language Support

**Supported Languages:**

- **English (en)** - Default, LTR (Left-to-Right)
- **Arabic (ar)** - RTL (Right-to-Left) layout

**Implementation:**

- Library: **next-intl**
- Routes: `/en/*` and `/ar/*`
- Language switcher in header
- Auto-detect browser language on first visit

**Localized Data:**

Database supports translations:

- **Package** model:
  - nameI18n (object with en, ar)
  - descriptionI18n (object with en, ar)
  - featuresI18n (array of i18n strings)

- **ServiceType** model:
  - nameI18n, descriptionI18n (both en/ar)
  - Attributes questions also translatable

- **Request** model:
  - titleI18n, descriptionI18n (both en/ar)

Example structure:

```json
{
  "nameI18n": {
    "en": "Logo Design",
    "ar": "تصميم الشعار"
  }
}
```

**UI Elements:**

- Static translations via message files
- Dynamic content: date/time formatting per locale
- Number formatting (decimals, currency symbols)
- RTL layout for Arabic

---

### 10.2 File Upload & Storage

**Where Files Go:**

1. Request attachments → AWS S3
2. Deliverables → AWS S3
3. Payment proofs → AWS S3
4. Profile images → AWS S3

**Flow:**

1. User selects file from computer
2. Client sends to Next.js API route
3. API validates file (size, type)
4. API uploads to AWS S3
5. S3 returns file URL/key
6. URL saved in database

**Accessing Files:**

- Presigned URLs (temporary access, 15 min expiry)
- Only authorized users can download
- URL generated on-demand for security

**Supported File Types:**

- Images: JPG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Compressed: ZIP, RAR
- Video: MP4, WebM (for deliverables)
- Max file size: typically 50MB per file

---

### 10.3 Data Retention Policy

**Soft Delete Principle:**

- Users expect data deletion = privacy
- System keeps data for analytics/compliance
- User sees data as deleted (filtered from queries)
- Admin can restore if mistake

**Specific Policies:**

**Deleted Users:**

- Marked with deletedAt timestamp
- No longer appears in user lists
- Requests still visible with "[Deleted User]" label
- Can be restored by admin

**Deleted Services:**

- Marked with deletedAt timestamp
- Can't create new requests for deleted service
- Existing requests continue
- Can be restored by admin

**Deleted Requests:**

- Marked as CANCELLED or deletedAt
- Shows in request history as cancelled
- Credits can be refunded
- Can be restored by admin

**Deleted Packages:**

- Marked with deletedAt timestamp
- Can't subscribe to deleted package
- Existing subscriptions continue
- Can be restored by admin

---

### 10.4 Data Security Features

**User Data Protection:**

- Passwords hashed with bcryptjs (not stored plain text)
- Email addresses stored securely
- Phone numbers optional
- Registration IP tracked (security monitoring)

**Session Management:**

- JWT tokens with 30-day expiry
- Secure session storage
- Auto-logout after inactivity

**Role-Based Access Control:**

- Each endpoint checks user role
- Can't access other users' data
- Admin-only endpoints protected

**File Security:**

- S3 presigned URLs expire after 15 minutes
- User verification before file access
- Virus scanning optional (not implemented)

**Data Backup:**

- Regular database backups (managed by Vercel/hosting)
- Disaster recovery plan (recommended)

---

## 11. BUSINESS RULES SUMMARY

### Credit & Subscription Rules

1. ✅ **Credit Requirement**: All requests require credits
2. ✅ **One Active Subscription**: User can only have one active subscription
3. ✅ **Credit Calculation**: Base cost + Priority cost
4. ✅ **Immediate Deduction**: Credits deducted when request created
5. ✅ **Refund on Cancel**: Credits returned if request cancelled
6. ✅ **Subscription Expiry**: Must resubscribe after 30 days
7. ✅ **Free Package**: Limited to testing, one-time use

### Request & Service Rules

1. ✅ **Package Restriction**: Can only request services in purchased package
2. ✅ **Status Workflow**: PENDING → IN_PROGRESS → DELIVERED → (REVISION | COMPLETED)
3. ✅ **Provider Availability**: Only providers with skill can claim
4. ✅ **One Provider Per Request**: Cannot have multiple providers
5. ✅ **Completion Requirement**: Must rate before marking complete

### Revision Rules

1. ✅ **Free Revisions Limited**: Configurable per service (default 3)
2. ✅ **Paid Revisions**: Cost credits after free limit
3. ✅ **Counter Reset**: After paid revision, reset to 0 (if enabled)
4. ✅ **Infinite Revisions**: Can keep revising if willing to pay

### Payment Rules

1. ✅ **Manual Verification**: Admin reviews bank transfer proof
2. ✅ **Proof Required**: Screenshot must show transfer details
3. ✅ **Inactive Until Approved**: Subscription inactive until verified
4. ✅ **Resubmission Allowed**: Can resubmit if rejected
5. ✅ **Instant Activation**: Credits added immediately on approval

### Admin Rules

1. ✅ **Full Control**: Can override most operations
2. ✅ **Manual Assignment**: Can assign provider to any request
3. ✅ **Payment Authority**: Only admin approves payments
4. ✅ **Soft Delete**: Can restore deleted items
5. ✅ **Service Configuration**: Can set all pricing and rules

---

## 12. SYSTEM ARCHITECTURE OVERVIEW

### 12.1 Architecture Pattern

**Type:** Monolithic Next.js Application

**Layers:**

1. **Presentation Layer** - React components, UI
2. **API Layer** - TRPC routers, endpoints
3. **Business Logic Layer** - Credit system, algorithms
4. **Data Layer** - Prisma ORM, PostgreSQL
5. **External Services** - AWS S3, Email, SSE

### 12.2 Data Flow Example: Creating a Request

```
1. CLIENT SUBMITS FORM
   └─ React form with validation (Zod)

2. FORM SENDS TO API
   └─ TRPC endpoint: requests.create()

3. SERVER RECEIVES REQUEST
   ├─ Check authentication
   ├─ Check authorization (user is CLIENT)
   └─ Validate input data (Zod)

4. BUSINESS LOGIC EXECUTES
   ├─ Check active subscription
   ├─ Calculate credit cost
   ├─ Check sufficient credits
   ├─ Deduct credits
   ├─ Validate service attributes
   └─ Create request record

5. DATABASE STORES DATA
   ├─ REQUEST record created
   ├─ NOTIFICATION records created
   └─ SUBSCRIPTION credits updated

6. NOTIFICATIONS SENT
   ├─ Matching providers get notifications (via SSE)
   ├─ Email sent to providers (optional)
   └─ Client dashboard updates

7. RESPONSE SENT TO CLIENT
   ├─ Success message
   ├─ New request ID
   ├─ Updated credit balance
   └─ Redirect to request details

8. CLIENT SEES RESULT
   └─ Request created and visible in dashboard
```

### 12.3 Key Design Decisions

**Why TRPC?**

- Type-safe API without manual types
- Automatic validation with Zod
- Better developer experience
- Smaller bundle size

**Why Prisma?**

- Type-safe database queries
- Automatic migrations
- Visual database browser
- Great for rapid development

**Why Soft Delete?**

- Privacy compliance (appears deleted to user)
- Data retention for analytics
- Ability to restore mistakes
- Audit trail preservation

**Why Manual Payments?**

- Works in countries with limited Stripe access
- Lower fees for international transfers
- More flexible for different currencies
- Can verify via local banks

**Why SSE for Notifications?**

- Real-time updates without websockets
- Simple to implement
- Browser native support
- Fallback to polling available

---

## 13. CONCLUSION

The **Nabra AI System** is a sophisticated digital services marketplace with:

✅ **Intelligent Credit Economy** - Automatic deduction, refunds, priority pricing
✅ **Smart Revision System** - Counter resets after paid revisions
✅ **Multi-Role Architecture** - CLIENT, PROVIDER, ADMIN with clear permissions
✅ **Type-Safe Stack** - TypeScript, TRPC, Zod throughout
✅ **Data Privacy** - Soft delete maintains user privacy while keeping data
✅ **International Ready** - Multi-language (EN/AR), multi-currency support
✅ **Real-Time Features** - Live notifications, instant updates
✅ **Scalable Design** - Ready for growth and new features
✅ **Developer Friendly** - Clear separation of concerns, well-organized code
✅ **Production Ready** - Tests, error handling, security measures

The system is designed for growth and can easily accommodate new features like:

- Direct provider payments
- Advanced analytics
- Mobile apps
- API for third-party integrations
- Subscription templates
- Automated notifications

---

**Document Version:** 1.0
**Last Updated:** December 19, 2025
**Author:** Nabra AI System Documentation
