MangaFlow Complete SPEC v1.0
Table of Contents


1	MangaFlow — Manga Creation Workflow and Publishing Management System
Version: SPEC v1.0
Stack: MERN + ShadCN/ui + Clerk + FastAPI AI Service
Architecture: Modular Monolith + Domain Driven Modules + Feature-Based Frontend
Frontend Deploy: Vercel
Backend Deploy: Railway
AI Service Deploy: Railway riêng
Database: MongoDB Atlas M0
Storage: Cloudflare R2 production + MinIO local dev

2	1. Project Overview
2.1	1.1. Project Name
Manga Creation Workflow and Publishing Management System
Short name: MangaFlow
2.2	1.2. Goal
MangaFlow is a web application that manages the full manga production and publishing workflow, from early manuscript submission to task assignment, assistant work, editor review, board approval, ranking management, and publication decision.
The system is designed to replace fragmented communication across multiple tools and provide a centralized workflow for:
Mangaka series creation.
Manuscript submission.
Editor review and annotation.
Region-based task assignment.
Assistant task submission.
Mangaka review.
Editor final approval.
Editorial board voting.
Publication scheduling.
Ranking and reader score tracking.
Payroll tracking for assistants.
AI-assisted bubble detection and image processing.
2.3	1.3. Current Problems
In the manga production process, Mangaka, Assistants, Editors, and Editorial Board members often use many disconnected tools to communicate and exchange files. This creates several problems:
Hard to track progress by page, region, and task.
Easy to lose context when feedback is spread across chat apps, cloud drives, and spreadsheets.
Editors and board members lack real-time visibility into studio progress.
Deadline risks are hard to detect early.
Assistant payments and approved work are difficult to track.
Ranking and reader feedback are not connected directly to publishing decisions.
2.4	1.4. Main Stakeholders
Admin
Mangaka
Assistant
Tantou Editor
Editorial Board

3	2. Technology Stack
3.1	2.1. Frontend
React
Vite
TypeScript
ShadCN/ui
Tailwind CSS
React Router
TanStack Query
Zustand or Redux Toolkit
Clerk React SDK
Canvas/SVG overlay for page annotation
Deploy on Vercel
3.2	2.2. Backend
Node.js
Express.js
TypeScript
MongoDB
Mongoose
Clerk Express SDK
Modular Monolith architecture
Domain Driven Modules
Deploy on Railway
3.3	2.3. AI Service
Python
FastAPI
YOLO11
OpenCV
Docker
Deploy separately on Railway
3.4	2.4. Storage
Production: Cloudflare R2
Local development: MinIO
S3-compatible integration
Private signed URLs
Original file storage
Preview and thumbnail generation
3.5	2.5. Database
MongoDB Atlas M0

4	3. Architecture
4.1	3.1. Architecture Style
The project uses:
Modular Monolith
+ Domain Driven Modules
+ Feature-Based Frontend
4.2	3.2. System Architecture
Frontend — React + Vite + ShadCN/ui
Deploy: Vercel
        │
        ▼
Backend API — Express + TypeScript
Deploy: Railway
        │
 ┌──────┼──────────┬──────────────┬──────────────┐
 ▼      ▼          ▼              ▼              ▼
Clerk   MongoDB    Cloudflare R2  AI Service     Notification
Auth    Atlas M0   + MinIO Dev    Railway        System
4.3	3.3. Communication Flow
React Client
   │
   │ Clerk Login
   ▼
Clerk Auth
   │
   │ Session Token / JWT
   ▼
Express Backend
   │
   ├── MongoDB Atlas
   ├── Cloudflare R2 / MinIO
   ├── Notification System
   └── FastAPI AI Service
            │
            └── YOLO11 + OpenCV
4.4	3.4. Deployment Decision
Component
Decision
Frontend
Vercel
Backend API
Railway
AI Service
Railway riêng
Storage
Cloudflare R2
Local Storage
MinIO
Database
MongoDB Atlas M0
Staging
Not in MVP
Preview Env
Not in MVP
Custom Domain
Optional


5	4. Monorepo Structure
mangaflow/
│
├── client/
│   └── React + Vite + ShadCN/ui
│
├── server/
│   └── Express + TypeScript + Modular Monolith
│
├── ai-service/
│   └── FastAPI + YOLO11 + OpenCV
│
├── docs/
│   ├── spec.md
│   ├── api.md
│   ├── database.md
│   ├── roles-permissions.md
│   ├── deployment.md
│   └── ai-service.md
│
├── docker-compose.yml
├── README.md
└── .env.example

6	5. Backend Architecture
6.1	5.1. Backend Folder Structure
server/
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── series/
│   │   ├── series-member/
│   │   ├── manuscript/
│   │   ├── chapter/
│   │   ├── page/
│   │   ├── file-asset/
│   │   ├── region/
│   │   ├── annotation/
│   │   ├── task/
│   │   ├── submission/
│   │   ├── comment/
│   │   ├── review/
│   │   ├── publication/
│   │   ├── board/
│   │   ├── ranking/
│   │   ├── payroll/
│   │   ├── notification/
│   │   └── dashboard/
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── validators/
│   │   └── types/
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── socket/
│   │   ├── storage/
│   │   ├── ai/
│   │   └── clerk/
│   │
│   ├── config/
│   └── app.ts
│
├── package.json
├── tsconfig.json
└── .env
6.2	5.2. Module Responsibility
Module
Responsibility
auth
Clerk verification, sync user, auth middleware
user
User profile, role, status
series
Series profile and lifecycle
series-member
Series-level role management
manuscript
Initial manuscript upload and review
chapter
Chapter management
page
Page upload, status, versioning
file-asset
Original, AI copy, preview, thumbnail, file versions
region
Region coordinates and task target areas
annotation
Rectangle annotation on page/submission
task
Task assignment and status flow
submission
Assistant submission and versioning
comment
Comment lifecycle and resolve rules
review
Review records and approvals
publication
Weekly/monthly publishing schedule
board
Board members, chair, votes, decisions
ranking
Vote count, reader score, ranking calculation
payroll
Assistant earning and payment tracking
notification
In-app notifications
dashboard
Aggregated role-based dashboard data


7	6. Frontend Architecture
7.1	6.1. Frontend Folder Structure
client/
│
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── App.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── series/
│   │   ├── manuscript/
│   │   ├── chapter/
│   │   ├── page/
│   │   ├── annotation/
│   │   ├── task/
│   │   ├── submission/
│   │   ├── review/
│   │   ├── publication/
│   │   ├── board/
│   │   ├── ranking/
│   │   ├── payroll/
│   │   └── notification/
│   │
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── api/
│   │   ├── constants/
│   │   └── types/
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── WorkspaceLayout.tsx
│   │
│   └── main.tsx
│
├── components.json
├── tailwind.config.ts
├── vite.config.ts
└── package.json
7.2	6.2. UI Theme
The UI should follow a dark technology manga production dashboard style.
Recommended tone:
Dark navy / near-black background.
Blue, cyan, and indigo primary colors.
Violet or emerald as optional accent.
Slate surfaces.
Subtle blue-gray borders.
Clear status badges.
Dark mode safe colors.
No overly bright white blocks in dark mode.
7.3	6.3. Main Layouts
7.3.1	Auth Layout
Sign in.
Sign up.
Clerk auth callback.
7.3.2	Dashboard Layout
Sidebar by role.
Header.
Notification menu.
User profile menu.
Breadcrumb.
Main content.
7.3.3	Workspace Layout
Used for manga page editing and annotation.
Suggested layout:
Left Panel      Center Canvas       Right Panel
Page List   |   Manga Page      |   Task / Comment / Annotation
Layers      |   Zoom + Pan      |   Review Actions

8	7. Roles and Permissions
8.1	7.1. System Roles
type SystemRole =
  | "ADMIN"
  | "MANGAKA"
  | "ASSISTANT"
  | "EDITOR"
  | "BOARD";
8.2	7.2. Series-Level Roles
type SeriesMemberRole =
  | "OWNER_MANGAKA"
  | "CO_MANGAKA"
  | "EDITOR"
  | "ASSISTANT"
  | "REVIEWER";
8.3	7.3. Role Rules
Rule
Decision
One Mangaka can have many Series
Yes
One Series can have many Mangaka
Yes
One Series has one Owner
Yes
One Series can have many Co-Creators
Yes
Assistant belongs to fixed studio
No
Assistant can receive tasks from many Series
Yes
Editor is assigned by Series
Yes
Board has 3–7 members
Yes
User can have multiple roles
Yes

8.4	7.4. Permission Matrix
Feature
Admin
Mangaka
Assistant
Editor
Board
Manage users
Yes
No
No
No
No
View all files
Yes
No
No
No
No
Create series
Yes
Yes
No
No
No
Invite assistant
Yes
Yes
No
No
No
Create chapter
Yes
Yes
No
Limited
No
Upload page
Yes
Yes
No
Limited
No
View assigned task only
No
No
Yes
No
No
View full chapter
Yes
Yes
No
Yes
No
Create task
Yes
Yes
No
Yes
No
Submit task
No
No
Yes
No
No
Mangaka approve task
Yes
Yes
No
No
No
Editor final approve
Yes
No
No
Yes
No
Board vote
No
No
No
No
Yes
View series summary
Yes
Yes
Limited
Yes
Yes
View detailed pages
Yes
Yes
Assigned only
Yes
No
Input ranking
Yes
No
No
No
Yes
Manage payroll
Yes
Yes
Own only
No
No

8.5	7.5. Permission Decisions
Permission
Decision
Admin can view all files
Yes
Board can view detailed pages
No
Board can view summary
Yes
Assistant can view full chapter
No
Assistant can only view assigned tasks
Yes
Editor can create task
Yes
Mangaka can invite Assistant
Yes
User can have many roles at once
Yes


9	8. Business Workflows
9.1	8.1. Standard Manga Workflow
Manuscript
    ↓
Editor Review
    ↓
Task Assignment
    ↓
Assistant Submission
    ↓
Mangaka Review
    ↓
Editor Approval
    ↓
Publish
9.2	8.2. Series Approval Workflow
Mangaka creates Series
    ↓
Mangaka uploads preliminary Manuscript
    ↓
Submit to Editor
    ↓
Editor Review
    ↓
Forward to Editorial Board
    ↓
Board Vote
    ↓
Majority Decision
    ↓
Approved / Rejected / Needs Revision
9.3	8.3. Page Production Workflow
Mangaka uploads Page
    ↓
Editor reviews before task assignment
    ↓
Mangaka or Editor creates Region
    ↓
Task is created and assigned to Assistant
    ↓
Assistant completes work
    ↓
Assistant submits result
    ↓
Mangaka reviews
    ↓
Editor gives final approval
    ↓
Ready for publish
9.4	8.4. Comment Resolution Workflow
Assistant fixes issue
    ↓
Mangaka marks "fixed"
    ↓
Editor verifies
    ↓
Editor resolves comment
    ↓
Ready for publish
9.5	8.5. AI Bubble Workflow
Upload Page
    ↓
Bubble Detection
    ↓
User Adjust
    ↓
Save Annotation
9.6	8.6. Ranking Workflow
Board inputs vote data after release period
    ↓
System calculates ranking
    ↓
Ranking history is updated
    ↓
Low-performing series is marked WARNING / AT_RISK
    ↓
Board manually decides continue or cancel

10	9. Upload and File Management
10.1	9.1. Upload Constraints
Item
Decision
Reason
Max size per image
50 MB/image
Enough for high-quality exported manga image
Max pages per upload/submission
50 pages
Manga chapter usually has 15–40 pages
Store original file
Yes
Required for review, revision, publishing
Versioning
Major versions
Manga workflow has many revisions
Preview
Yes
Needed for web viewer
Watermark
Not required
Internal workflow only
Private Signed URL
Yes
Protect unpublished manuscript

10.2	9.2. Supported File Types
10.2.1	Image
PNG
JPG
JPEG
WEBP
10.2.2	Document
PDF
10.2.3	Source File
PSD
10.2.4	Not Supported in MVP
.clip
10.3	9.3. File Resize Rule
Original file is always stored without modification.
Type
Rule
Original
No change
AI Processing Copy
Max 2048px width
Preview
Max 1600px width
Thumbnail
300px width

10.4	9.4. File Processing Flow
Upload Original
    ↓
Store original in R2
    ↓
Generate AI copy, max 2048px width
    ↓
Generate preview, max 1600px width
    ↓
Generate thumbnail, 300px width
    ↓
Save metadata to MongoDB
10.5	9.5. Storage Path Convention
/series/{seriesId}/cover
/series/{seriesId}/manuscripts
/chapters/{chapterId}/pages
/pages/{pageId}/versions
/tasks/{taskId}/submissions
/ai-output/{pageId}
/thumbnails/{ownerType}/{ownerId}

11	10. Annotation and Region Rules
11.1	10.1. MVP Annotation Type
MVP supports:
Rectangle Annotation
Not supported in MVP:
Polygon
Free Draw
Layer Management
11.2	10.2. Coordinate System
Annotations use normalized coordinates from 0 to 1.
Example:
{
  "x": 0.15,
  "y": 0.30,
  "width": 0.22,
  "height": 0.08
}
11.3	10.3. Why Normalized Coordinates
Independent from frontend display size.
Works well with zoom and pan.
Easier to scale across different image resolutions.
Compatible with AI bounding box conversion.

12	11. AI Service Integration
12.1	11.1. Existing AI Service
The AI service is already completed.
ai-service/
│
├── app/
│   ├── main.py
│   ├── bubble_service.py
│   └── model_loader.py
│
├── models/
│   └── best.pt
│
├── uploads/
├── outputs/
├── requirements.txt
└── Dockerfile
12.2	11.2. AI Endpoints
GET  /health
POST /bubble/detect
POST /bubble/whiten
POST /bubble/process
12.3	11.3. AI MVP Scope
AI Feature
MVP
Bubble Detection
Yes
Bubble Whitening
Yes
User adjusts Region
Yes
Batch Process
Yes
Save AI Output to Storage
Yes
Save base64 to DB
No
Detect Panel
Future
Detect Character
Future
Detect Background
Future

12.4	11.4. AI Timeout
60 seconds
12.5	11.5. AI Integration Rule
Frontend should not call AI service directly in production. Backend must wrap AI service calls.
Reasons:
Backend checks permission.
Backend manages files.
Backend saves AI metadata.
AI service URL stays private.
Backend handles timeout and retry.
Backend writes audit logs.
12.6	11.6. Backend AI Endpoints
POST /api/pages/:pageId/ai/bubble-detect
POST /api/pages/:pageId/ai/bubble-whiten
POST /api/pages/:pageId/ai/bubble-process
POST /api/pages/:pageId/ai/batch-process
12.7	11.7. AI Result Mapping
AI response:
{
  "bubble_count": 6,
  "bubbles": [
    {
      "id": 1,
      "bbox": {
        "x": 50,
        "y": 30,
        "width": 280,
        "height": 140
      },
      "confidence": 0.9712,
      "has_mask": true
    }
  ]
}
Backend converts pixel bbox into normalized region:
Region {
  pageId: ObjectId
  type: "BUBBLE"
  source: "AI"
  shape: "RECTANGLE"
  x: number
  y: number
  width: number
  height: number
  confidence: number
  createdBy: ObjectId
}

13	12. Ranking Logic
13.1	12.1. Reader Score Scale
Reader Score uses scale:
1–10
Reasons:
1–5 is too coarse.
0–100 is too detailed and harder to explain.
1–10 is standard and easy to understand.
13.2	12.2. Normalize Rule
normalizedReaderScore = readerScore * 10
13.3	12.3. Final Ranking Formula
finalScore = (voteCount * 0.7) + (normalizedReaderScore * 0.3)
Where:
normalizedReaderScore = readerScore * 10
13.4	12.4. Why This Formula Is Correct
Factor
Role
voteCount
Reflects real popularity
readerScore
Reflects perceived quality
70/30 weight
Prevents bias from small-group ratings

13.5	12.5. Why Not Simple Sum
Do not use:
finalScore = voteCount + readerScore
Because the scales are completely different:
voteCount may be 10,000.
readerScore is only 1–10.
This would make reader score almost meaningless.
13.6	12.6. Series Cancellation Rule
Series is not canceled automatically.
System only marks:
NORMAL → WARNING → AT_RISK
Final cancellation is a manual Editorial Board decision.

14	13. Editorial Board Rules
14.1	13.1. Board Size
3–7 members
14.2	13.2. Board Member Roles
type BoardRole = "BOARD_MEMBER" | "BOARD_CHAIR";
14.3	13.3. Board Permission
Role
Permission
BOARD_MEMBER
Vote
BOARD_CHAIR
Vote + tie-break + final decision

14.4	13.4. Voting Rule
Majority vote wins.
If tie:
BOARD_CHAIR decides.
14.5	13.5. Why Board Chair Is Needed
Without Board Chair, a vote like:
3 approve vs 3 reject
would cause a decision deadlock.
Board Chair prevents deadlock and keeps the workflow moving.

15	14. Assistant Payroll and Earning
15.1	14.1. Payment Scope
This module is only for:
Tracking & Payroll Management
Not included in MVP:
Stripe
PayPal
Real Payment
15.2	14.2. Earning Rules
Rule
Decision
Pay by Page
No
Pay by Task
Yes
Pay by Hour
No
Different rate by Task Type
Yes
Deadline Bonus
Yes
Revision Round 1
Free
Revision Round 2+
Configurable
Rejected task gets paid
No
Real payment
No
Payout confirmation
Mangaka

15.3	14.3. Example Task Rates
Task Type
Rate
Background
100
Inking
80
Screentone
60
Cleanup
40

15.4	14.4. Deadline Bonus and Penalty
Condition
Bonus / Penalty
Early ≤ 24h
+10%
On time
0%
Late ≤ 24h
-5%
Late > 24h
Mark LATE, no bonus

15.5	14.5. Final Payment Formula
finalPayment = basePayment * (1 + bonusRate)
If task is rejected:
finalPayment = 0
If revision round 1:
revisionFee = 0
If revision round 2+:
revisionFee = configurable amount
15.6	14.6. Timing Status
type TaskTimingStatus =
  | "EARLY"
  | "ON_TIME"
  | "LATE_WITHIN_24H"
  | "LATE";

16	15. Comment Resolution Rules
16.1	15.1. Final Role Responsibility
Action
Role
Fix issue
Assistant
Mark fixed
Mangaka
Resolve officially
Editor
Reopen comment
Editor

16.2	15.2. Comment States
type CommentStatus =
  | "OPEN"
  | "FIXED_BY_ASSISTANT"
  | "VERIFIED_BY_MANGAKA"
  | "RESOLVED_BY_EDITOR";
16.3	15.3. Why Split Responsibility
If Mangaka can resolve comments alone, quality control can be bypassed.
If Editor handles everything, the process becomes a bottleneck.
Therefore:
Assistant fixes the issue.
Mangaka checks and marks it fixed.
Editor verifies and officially resolves.
Editor can reopen if quality is not enough.
16.4	15.4. Comment API
POST /api/comments/:commentId/mark-fixed
POST /api/comments/:commentId/verify-fixed
POST /api/comments/:commentId/resolve
POST /api/comments/:commentId/reopen
16.5	15.5. Comment Permission
API
Allowed Role
mark-fixed
Assistant
verify-fixed
Mangaka
resolve
Editor
reopen
Editor


17	16. State Machines
17.1	16.1. Series Status
DRAFT
  → SUBMITTED
  → EDITOR_REVIEW
  → BOARD_REVIEW
  → APPROVED
  → PUBLISHING
  → ONGOING
  → AT_RISK
  → CANCELLED

ONGOING
  → COMPLETED
17.2	16.2. Manuscript Status
DRAFT
  → SUBMITTED
  → EDITOR_REVIEW
  → REVISION_REQUESTED
  → BOARD_REVIEW
  → APPROVED
  → REJECTED
17.3	16.3. Chapter Status
DRAFT
  → IN_PROGRESS
  → READY_FOR_EDITOR
  → EDITOR_REVIEW
  → READY_FOR_PUBLICATION
  → PUBLISHED
17.4	16.4. Page Status
UPLOADED
  → AI_PROCESSED
  → REGION_MARKED
  → TASK_ASSIGNED
  → IN_PROGRESS
  → SUBMITTED
  → MANGAKA_APPROVED
  → EDITOR_APPROVED
  → READY_TO_PUBLISH

Any review state
  → NEEDS_REVISION
17.5	16.5. Task Status
TODO
  → IN_PROGRESS
  → SUBMITTED
  → MANGAKA_APPROVED
  → EDITOR_APPROVED

SUBMITTED
  → REVISION_REQUESTED
  → REJECTED

REVISION_REQUESTED
  → IN_PROGRESS
  → SUBMITTED
17.6	16.6. Submission Status
PENDING_MANGAKA_REVIEW
  → REVISION_REQUESTED
  → MANGAKA_APPROVED
  → EDITOR_APPROVED
  → REJECTED
17.7	16.7. Comment Status
OPEN
  → FIXED_BY_ASSISTANT
  → VERIFIED_BY_MANGAKA
  → RESOLVED_BY_EDITOR

Editor can reopen:
RESOLVED_BY_EDITOR → OPEN
VERIFIED_BY_MANGAKA → OPEN
FIXED_BY_ASSISTANT → OPEN

18	17. Data Models
18.1	17.1. User
User {
  _id: ObjectId
  clerkId: string
  email: string
  fullName: string
  avatarUrl?: string
  role: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD"
  status: "ACTIVE" | "SUSPENDED"
  createdAt: Date
  updatedAt: Date
}
18.2	17.2. Series
Series {
  _id: ObjectId

  title: string
  slug: string
  description: string
  genre: string[]
  coverUrl?: string

  ownerId: ObjectId

  status:
    | "DRAFT"
    | "SUBMITTED"
    | "EDITOR_REVIEW"
    | "BOARD_REVIEW"
    | "APPROVED"
    | "PUBLISHING"
    | "ONGOING"
    | "AT_RISK"
    | "CANCELLED"
    | "COMPLETED"

  publicationType?: "WEEKLY" | "MONTHLY"

  submittedAt?: Date
  approvedAt?: Date
  cancelledAt?: Date

  createdAt: Date
  updatedAt: Date
}
18.3	17.3. SeriesMember
SeriesMember {
  _id: ObjectId

  seriesId: ObjectId
  userId: ObjectId

  role:
    | "OWNER_MANGAKA"
    | "CO_MANGAKA"
    | "EDITOR"
    | "ASSISTANT"
    | "REVIEWER"

  invitedBy?: ObjectId
  joinedAt?: Date

  status: "INVITED" | "ACTIVE" | "REMOVED"

  createdAt: Date
  updatedAt: Date
}
18.4	17.4. Manuscript
Manuscript {
  _id: ObjectId

  seriesId: ObjectId
  uploadedBy: ObjectId

  title?: string
  description?: string

  fileUrls: string[]
  previewUrls?: string[]

  currentVersion: number

  status:
    | "DRAFT"
    | "SUBMITTED"
    | "EDITOR_REVIEW"
    | "REVISION_REQUESTED"
    | "BOARD_REVIEW"
    | "APPROVED"
    | "REJECTED"

  createdAt: Date
  updatedAt: Date
}
18.5	17.5. Chapter
Chapter {
  _id: ObjectId
  seriesId: ObjectId
  title: string
  chapterNumber: number

  status:
    | "DRAFT"
    | "IN_PROGRESS"
    | "READY_FOR_EDITOR"
    | "EDITOR_REVIEW"
    | "READY_FOR_PUBLICATION"
    | "PUBLISHED"

  deadline?: Date
  createdAt: Date
  updatedAt: Date
}
18.6	17.6. Page
Page {
  _id: ObjectId

  chapterId: ObjectId
  pageNumber: number

  originalFileUrl: string
  previewUrl?: string
  thumbnailUrl?: string
  processedFileUrl?: string

  width: number
  height: number

  currentVersion: number

  status:
    | "UPLOADED"
    | "AI_PROCESSED"
    | "REGION_MARKED"
    | "TASK_ASSIGNED"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "MANGAKA_APPROVED"
    | "EDITOR_APPROVED"
    | "NEEDS_REVISION"
    | "READY_TO_PUBLISH"

  createdAt: Date
  updatedAt: Date
}
18.7	17.7. FileAsset
FileAsset {
  _id: ObjectId

  ownerType:
    | "MANUSCRIPT"
    | "PAGE"
    | "SUBMISSION"
    | "AI_OUTPUT"

  ownerId: ObjectId

  originalUrl: string
  aiProcessUrl?: string
  previewUrl?: string
  thumbnailUrl?: string

  fileName: string
  mimeType: string
  fileSize: number

  width?: number
  height?: number

  versionNumber: number

  uploadedBy: ObjectId

  createdAt: Date
  updatedAt: Date
}
18.8	17.8. Region
Region {
  _id: ObjectId

  pageId: ObjectId
  taskId?: ObjectId

  type:
    | "BACKGROUND"
    | "INKING"
    | "SCREENTONE"
    | "CLEANUP"
    | "EFFECT"
    | "BUBBLE"
    | "OTHER"

  source: "MANUAL" | "AI"
  shape: "RECTANGLE"

  x: number
  y: number
  width: number
  height: number

  confidence?: number
  createdBy: ObjectId

  createdAt: Date
  updatedAt: Date
}
18.9	17.9. Annotation
Annotation {
  _id: ObjectId

  pageId: ObjectId
  createdBy: ObjectId

  targetType: "PAGE" | "TASK" | "SUBMISSION"
  targetId?: ObjectId

  type: "RECTANGLE"

  x: number
  y: number
  width: number
  height: number

  comment?: string
  status: "OPEN" | "RESOLVED"

  createdAt: Date
  updatedAt: Date
}
18.10	17.10. Task
Task {
  _id: ObjectId

  seriesId: ObjectId
  chapterId: ObjectId
  pageId: ObjectId
  regionId?: ObjectId

  assignedBy: ObjectId
  assignedTo: ObjectId

  title: string
  description: string

  type:
    | "BACKGROUND"
    | "INKING"
    | "SCREENTONE"
    | "CLEANUP"
    | "EFFECT"
    | "OTHER"

  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"

  status:
    | "TODO"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "REVISION_REQUESTED"
    | "MANGAKA_APPROVED"
    | "EDITOR_APPROVED"
    | "REJECTED"

  revisionRound: number

  baseRate: number
  bonusAmount: number

  dueDate?: Date
  submittedAt?: Date
  mangakaApprovedAt?: Date
  editorApprovedAt?: Date

  createdAt: Date
  updatedAt: Date
}
18.11	17.11. Submission
Submission {
  _id: ObjectId

  taskId: ObjectId
  submittedBy: ObjectId

  fileUrl: string
  previewUrl?: string
  note?: string

  version: number

  status:
    | "PENDING_MANGAKA_REVIEW"
    | "REVISION_REQUESTED"
    | "MANGAKA_APPROVED"
    | "EDITOR_APPROVED"
    | "REJECTED"

  reviewedBy?: ObjectId
  reviewedAt?: Date

  createdAt: Date
  updatedAt: Date
}
18.12	17.12. Comment
Comment {
  _id: ObjectId

  targetType:
    | "MANUSCRIPT"
    | "CHAPTER"
    | "PAGE"
    | "TASK"
    | "SUBMISSION"

  targetId: ObjectId

  pageId?: ObjectId
  annotationId?: ObjectId

  content: string
  createdBy: ObjectId

  status:
    | "OPEN"
    | "FIXED_BY_ASSISTANT"
    | "VERIFIED_BY_MANGAKA"
    | "RESOLVED_BY_EDITOR"

  fixedBy?: ObjectId
  fixedAt?: Date

  verifiedBy?: ObjectId
  verifiedAt?: Date

  resolvedBy?: ObjectId
  resolvedAt?: Date

  reopenedBy?: ObjectId
  reopenedAt?: Date
  reopenReason?: string

  createdAt: Date
  updatedAt: Date
}
18.13	17.13. BoardMember
BoardMember {
  _id: ObjectId

  userId: ObjectId
  role: "BOARD_MEMBER" | "BOARD_CHAIR"
  status: "ACTIVE" | "INACTIVE"

  createdAt: Date
  updatedAt: Date
}
18.14	17.14. BoardVote
BoardVote {
  _id: ObjectId

  seriesId: ObjectId
  boardMemberId: ObjectId

  vote: "APPROVE" | "REJECT" | "NEEDS_REVISION"
  reason?: string

  createdAt: Date
}
18.15	17.15. BoardDecision
BoardDecision {
  _id: ObjectId

  seriesId: ObjectId

  decision:
    | "APPROVED"
    | "REJECTED"
    | "NEEDS_REVISION"
    | "CONTINUE"
    | "CANCEL"

  voteSummary: {
    approve: number
    reject: number
    needsRevision: number
  }

  decidedBy: ObjectId
  isTieBreak: boolean
  reason?: string

  createdAt: Date
}
18.16	17.16. Publication
Publication {
  _id: ObjectId

  seriesId: ObjectId
  chapterId?: ObjectId

  scheduleType: "WEEKLY" | "MONTHLY" | "ONE_SHOT"

  plannedDate: Date
  actualDate?: Date

  status: "PLANNED" | "PUBLISHED" | "DELAYED" | "CANCELLED"

  decidedBy: ObjectId

  createdAt: Date
  updatedAt: Date
}
18.17	17.17. Ranking
Ranking {
  _id: ObjectId

  seriesId: ObjectId
  period: string

  voteCount: number
  readerScore: number
  normalizedReaderScore: number

  finalScore: number

  rank: number
  previousRank?: number

  status: "NORMAL" | "WARNING" | "AT_RISK"

  createdBy: ObjectId
  createdAt: Date
}
18.18	17.18. TaskRate
TaskRate {
  _id: ObjectId

  taskType:
    | "BACKGROUND"
    | "INKING"
    | "SCREENTONE"
    | "CLEANUP"
    | "EFFECT"
    | "OTHER"

  rate: number
  currency: string
  isActive: boolean

  createdAt: Date
  updatedAt: Date
}
18.19	17.19. AssistantEarning
AssistantEarning {
  _id: ObjectId

  assistantId: ObjectId
  taskId: ObjectId
  seriesId: ObjectId

  taskType: string

  basePayment: number
  bonusRate: number
  bonusAmount: number
  penaltyAmount: number

  revisionFee: number
  finalPayment: number

  timingStatus:
    | "EARLY"
    | "ON_TIME"
    | "LATE_WITHIN_24H"
    | "LATE"

  status:
    | "PENDING"
    | "CONFIRMED"
    | "PAID"
    | "CANCELLED"

  confirmedBy?: ObjectId
  confirmedAt?: Date

  createdAt: Date
  updatedAt: Date
}
18.20	17.20. Notification
Notification {
  _id: ObjectId

  userId: ObjectId

  type:
    | "TASK_ASSIGNED"
    | "TASK_SUBMITTED"
    | "TASK_APPROVED"
    | "REVISION_REQUESTED"
    | "EDITOR_COMMENT"
    | "BOARD_DECISION"
    | "RANKING_WARNING"
    | "PAYROLL_CONFIRMED"

  title: string
  message: string
  isRead: boolean
  link?: string

  createdAt: Date
}

19	18. API Specification
19.1	18.1. Auth API
GET    /api/auth/me
POST   /api/auth/sync-user
19.2	18.2. User API
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id/role
PATCH  /api/users/:id/status
19.3	18.3. Series API
GET    /api/series
POST   /api/series
GET    /api/series/:id
PATCH  /api/series/:id
DELETE /api/series/:id
POST   /api/series/:id/submit
POST   /api/series/:id/assign-editor
19.4	18.4. Series Member API
GET    /api/series/:seriesId/members
POST   /api/series/:seriesId/members/invite
PATCH  /api/series/:seriesId/members/:memberId/role
DELETE /api/series/:seriesId/members/:memberId
19.5	18.5. Manuscript API
GET    /api/series/:seriesId/manuscripts
POST   /api/series/:seriesId/manuscripts
GET    /api/manuscripts/:id
POST   /api/manuscripts/:id/submit
POST   /api/manuscripts/:id/request-revision
POST   /api/manuscripts/:id/approve
19.6	18.6. Chapter API
GET    /api/series/:seriesId/chapters
POST   /api/series/:seriesId/chapters
GET    /api/chapters/:id
PATCH  /api/chapters/:id
DELETE /api/chapters/:id
19.7	18.7. Page API
GET    /api/chapters/:chapterId/pages
POST   /api/chapters/:chapterId/pages
GET    /api/pages/:id
PATCH  /api/pages/:id
DELETE /api/pages/:id
POST   /api/pages/:id/process-bubbles
19.8	18.8. Page Version API
GET    /api/pages/:pageId/versions
POST   /api/pages/:pageId/versions
GET    /api/pages/:pageId/versions/:versionId
19.9	18.9. Before/After Compare API
GET /api/pages/:pageId/compare?fromVersion=1&toVersion=2
19.10	18.10. Region API
GET    /api/pages/:pageId/regions
POST   /api/pages/:pageId/regions
PATCH  /api/regions/:id
DELETE /api/regions/:id
POST   /api/pages/:pageId/regions/ai-detect
19.11	18.11. Annotation API
GET    /api/pages/:pageId/annotations
POST   /api/pages/:pageId/annotations
PATCH  /api/annotations/:id
DELETE /api/annotations/:id
19.12	18.12. Task API
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
POST   /api/tasks/:id/start
POST   /api/tasks/:id/submit
POST   /api/tasks/:id/approve-by-mangaka
POST   /api/tasks/:id/approve-by-editor
POST   /api/tasks/:id/request-revision
POST   /api/tasks/:id/reject
19.13	18.13. Submission API
GET    /api/tasks/:taskId/submissions
POST   /api/tasks/:taskId/submissions
GET    /api/submissions/:id
POST   /api/submissions/:id/review
19.14	18.14. Comment API
GET    /api/comments
POST   /api/comments
POST   /api/comments/:commentId/mark-fixed
POST   /api/comments/:commentId/verify-fixed
POST   /api/comments/:commentId/resolve
POST   /api/comments/:commentId/reopen
DELETE /api/comments/:commentId
19.15	18.15. Board API
GET    /api/board/members
POST   /api/board/members
PATCH  /api/board/members/:id
DELETE /api/board/members/:id
POST   /api/board/series/:seriesId/vote
GET    /api/board/series/:seriesId/votes
POST   /api/board/series/:seriesId/decision
19.16	18.16. Publication API
GET    /api/publications
POST   /api/publications
PATCH  /api/publications/:id
POST   /api/publications/:id/publish
POST   /api/publications/:id/cancel
19.17	18.17. Ranking API
GET    /api/rankings
POST   /api/rankings/import
POST   /api/rankings/calculate
GET    /api/series/:seriesId/rankings
19.18	18.18. Payroll API
GET   /api/payroll/me
GET   /api/payroll/assistants/:assistantId
GET   /api/payroll/series/:seriesId
POST  /api/payroll/tasks/:taskId/calculate
POST  /api/payroll/tasks/:taskId/confirm
POST  /api/payroll/monthly/confirm
19.19	18.19. Task Rate API
GET    /api/task-rates
POST   /api/task-rates
PATCH  /api/task-rates/:id
DELETE /api/task-rates/:id
19.20	18.20. Notification API
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
19.21	18.21. Dashboard API
GET    /api/dashboard/admin
GET    /api/dashboard/mangaka
GET    /api/dashboard/assistant
GET    /api/dashboard/editor
GET    /api/dashboard/board
19.22	18.22. AI Wrapper API
POST /api/pages/:pageId/ai/bubble-detect
POST /api/pages/:pageId/ai/bubble-whiten
POST /api/pages/:pageId/ai/bubble-process
POST /api/pages/:pageId/ai/batch-process

20	19. API Response Format
20.1	19.1. Success Response
{
  "success": true,
  "data": {},
  "message": "OK"
}
20.2	19.2. Error Response
{
  "success": false,
  "message": "Task not found",
  "code": "TASK_NOT_FOUND",
  "details": {}
}
20.3	19.3. Pagination Response
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

21	20. Dashboard Specification
21.1	20.1. Admin Dashboard
Displays:
User count by role.
Active/suspended users.
Total series.
Total chapters.
Total tasks.
Storage usage.
AI usage.
System health.
21.2	20.2. Mangaka Dashboard
Displays:
My series.
Current chapter progress.
Pending task reviews.
Assistant progress.
Ranking trend.
At-risk alerts.
Upcoming deadlines.
Payroll summary.
21.3	20.3. Assistant Dashboard
Displays:
Assigned tasks.
Tasks due soon.
Submitted tasks.
Revision requested tasks.
Approved tasks.
Monthly earning.
21.4	20.4. Editor Dashboard
Displays:
Assigned series.
Manuscripts waiting review.
Chapters waiting final approval.
Unresolved comments.
Deadline risk.
Studio progress.
21.5	20.5. Board Dashboard
Displays:
Series pending approval.
Voting status.
Publication schedule.
Ranking table.
At-risk series.
Cancel/continue decision queue.

22	21. Notification Requirements
22.1	21.1. Notification Events
System should notify users when:
Task is assigned.
Task is submitted.
Revision is requested.
Task is approved by Mangaka.
Task is approved by Editor.
Editor creates comment.
Comment is fixed.
Comment is resolved.
Board decision is made.
Ranking warning is triggered.
Payroll is confirmed.
22.2	21.2. MVP Notification Method
MVP can use:
Database notification.
Frontend polling every 15–30 seconds.
Realtime Socket.IO can be added later.

23	22. Security Requirements
23.1	22.1. Authentication
Clerk handles login and session.
Backend verifies Clerk session.
Backend syncs Clerk user into local database.
Frontend role cannot be trusted.
23.2	22.2. Authorization
Role-based access control.
Series-level permission check.
Ownership check.
Assistant can only see assigned tasks.
Board only sees summary, not detailed pages.
Admin has full access.
23.3	22.3. File Security
Use private signed URLs.
Validate file type.
Validate file size.
Do not expose raw storage path.
Do not upload executable files.
Protect unpublished manuscripts.
23.4	22.4. Audit Log Recommended Events
Role changed.
Series submitted.
Editor review completed.
Board voted.
Board decision created.
Series approved/rejected/cancelled.
Task approved/rejected.
Ranking imported.
Payroll confirmed.
Publication changed.

24	23. Environment Variables
24.1	23.1. Client
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_BASE_URL=
24.2	23.2. Backend
NODE_ENV=
PORT=
MONGODB_URI=

CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

CLIENT_URL=

S3_PROVIDER=cloudflare-r2
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_FORCE_PATH_STYLE=true

AI_SERVICE_URL=
AI_TIMEOUT_MS=60000

MAX_IMAGE_SIZE_MB=50
MAX_PAGE_UPLOAD=50
24.3	23.3. AI Service
MODEL_PATH=
UPLOAD_DIR=
OUTPUT_DIR=
MAX_FILE_SIZE_MB=50
PROCESS_TIMEOUT_SECONDS=60

25	24. Local Development
25.1	24.1. Local URLs
client:     http://localhost:5173
server:     http://localhost:5000
ai-service: http://localhost:8000
minio:      http://localhost:9000
mongodb:    MongoDB Atlas or local Docker
25.2	24.2. Recommended Local Services
MongoDB local or Atlas M0.
MinIO for S3-compatible local storage.
AI service running with uvicorn.
Backend running with ts-node-dev or nodemon.
Frontend running with Vite.

26	25. Non-Functional Requirements
26.1	25.1. Performance
Dashboard should load under 2 seconds in normal data size.
Page viewer should support smooth zoom and pan.
Upload should show progress.
AI processing should show loading state.
Lists should support pagination.
26.2	25.2. Reliability
AI service failure must not crash backend.
API errors use standard error response format.
AI service should have timeout handling.
File upload should be recoverable.
Important actions should be auditable.
26.3	25.3. Usability
UI should be clear by role.
Assistant should only see relevant tasks.
Mangaka should quickly select regions and assign tasks.
Editor should annotate and verify efficiently.
Board should vote and view ranking easily.
26.4	25.4. Maintainability
Keep business logic out of route files.
Use service and repository layers.
Keep modules independent.
Use shared validation.
Use consistent response format.
Keep frontend feature-based.

27	26. MVP Scope
27.1	26.1. Included in MVP
Clerk login.
User sync.
Role management.
Series creation.
SeriesMember management.
Manuscript upload.
Editor manuscript review.
Chapter creation.
Page upload.
File storage in Cloudflare R2.
MinIO for local dev.
Major versioning.
Preview and thumbnail generation.
Rectangle annotation.
Region creation.
Task assignment.
Assistant submission.
Mangaka review.
Editor final approval.
Comment resolve workflow.
Board voting.
Board Chair tie-break.
Weekly/monthly publication.
Ranking calculation.
At-risk warning.
Payroll tracking.
AI bubble detection and whitening.
Role-based dashboards.
Notifications.
27.2	26.2. Not Included in MVP
Real payment with Stripe/PayPal.
Polygon annotation.
Free draw annotation.
Layer management.
Clip Studio .clip file support.
Panel detection.
Character detection.
Background detection.
Real-time collaborative editing.
Public reader voting portal.
Mobile app.
Advanced publishing calendar integration.

28	27. MVP Milestones
28.1	Milestone 1 — Foundation
Setup monorepo.
Setup React + Vite + ShadCN/ui.
Setup Express TypeScript.
Setup MongoDB Atlas.
Setup Clerk.
Setup protected routes.
Setup Railway backend deploy.
Setup Vercel frontend deploy.
28.2	Milestone 2 — User, Role, SeriesMember
Sync Clerk user.
Internal user profile.
System role.
SeriesMember role.
RBAC middleware.
Series-level authorization.
28.3	Milestone 3 — Series & Manuscript
Create series.
Add co-mangaka.
Assign editor.
Upload manuscript PDF/images.
Submit manuscript to editor.
Editor review manuscript.
28.4	Milestone 4 — Chapter & Page
Create chapter.
Upload max 50 pages.
Store original file.
Generate preview.
Generate thumbnail.
Add major versioning.
Before/after compare.
28.5	Milestone 5 — Annotation & Task Assignment
Rectangle annotation.
Normalized coordinate.
Create region.
Create task from region.
Assign assistant.
Assistant only sees assigned tasks.
28.6	Milestone 6 — Submission & Review
Assistant submit task.
Submission versioning.
Mangaka review.
Revision request.
Mangaka approve.
Editor final approval.
Comments must be resolved before publish.
28.7	Milestone 7 — Payroll Tracking
Task type rate.
Earning calculation.
Bonus deadline.
Revision round rule.
Reject = no earning.
Mangaka confirms payout.
28.8	Milestone 8 — Board, Publication, Ranking
Board member management.
Board Chair role.
Board vote.
Majority approval.
Board Chair tiebreak.
Weekly/monthly publication.
Ranking input.
Vote + Reader Score formula.
At-risk warning.
Manual cancel decision.
28.9	Milestone 9 — AI Bubble Integration
Backend wrapper API.
AI bubble detect.
AI bubble whiten.
Batch process.
Save AI output to storage.
Save AI region.
User adjusts region.
28.10	Milestone 10 — Polish & Release
Notification.
Dashboard by role.
Audit log.
Error handling.
API docs.
Deployment docs.
Demo seed data.

29	28. Final SPEC Status
Section
Status
Architecture
Final
Roles
Final
Business Workflow
Final
Upload Constraints
Final
Ranking Formula
Final
Board Voting
Final
Storage Provider
Final
Resize Rule
Final
AI Scope
Final for MVP
Assistant Payroll
Final for MVP
Comment Resolve Rule
Final
Deployment Target
Final
Permission Rules
Final


30	29. Next Technical Documents
After this SPEC, the next documents should be:
database.md — Detailed Mongoose schemas.
api.md — Detailed API contracts with request/response examples.
frontend-routes.md — Route map and screen list.
backend-structure.md — Module-by-module backend folder and files.
ui-spec.md — Screen design specification.
deployment.md — Vercel, Railway, Cloudflare R2, MongoDB Atlas setup.
seed-data.md — Demo users and demo series.


