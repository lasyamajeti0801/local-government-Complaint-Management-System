# Nagar Connect — Member 1 Foundation Documentation
**Local Government Complaint Management System**  
**Stage:** Member 1 — Phase 1 (Foundation, Authentication, RBAC, Database & Design System)  
**Branch:** `feature/member-1-foundation`

---

## 1. Executive Summary

Nagar Connect is a production-grade civic grievance redressal and municipal operations platform designed for local government administration.

As **Member 1 (Phase 1 Only)**, the initial project foundation has been architected, implemented, tested, and handed over. This foundation establishes:
- Production-grade modular backend (Node.js, Express, TypeScript, Prisma ORM, SQLite/PostgreSQL-ready).
- Zero-leak authentication system (BCrypt password hashing, JWT bearer tokens, session persistence).
- Extensible Role-Based Access Control (RBAC) foundation supporting all 7 municipal roles.
- Relational database schema with models for Users, Roles, Permissions, RolePermissions, Municipal Departments, Complaint Categories, and an extensible Complaint model foundation.
- Complete 28-component civic design system built strictly with humanized civic design tokens (Deep Civic Blue, Trust Blue, Municipal Teal, Public-Service Green, Muted Amber, Muted Red).
- Light (default) and Dark secondary themes.
- Responsive application shell with desktop sidebar, mobile drawer, civic navbar, breadcrumbs, toasts, and notifications.
- Seed data initializing 7 system roles, 14 granular permissions, 9 municipal departments, 12 complaint categories, and demo accounts.

---

## 2. Directory Structure

```text
NAGAR_CONNECT/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Relational models (RBAC, Users, Departments, Categories, Complaints)
│   │   └── nagar_connect.db           # SQLite local database (zero external setup required)
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.ts           # System enums (ROLES, COMPLAINT_STATUS, COMPLAINT_PRIORITY)
│   │   │   ├── database.ts            # Prisma client singleton
│   │   │   └── env.ts                 # Validated environment configuration
│   │   ├── controllers/
│   │   │   ├── authController.ts      # register, login, me, logout handlers
│   │   │   ├── categoryController.ts  # getCategories (filterable by departmentId)
│   │   │   ├── departmentController.ts# getDepartments, getDepartmentById
│   │   │   └── healthController.ts    # Service health & DB connectivity
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts      # requireAuth, requireRole, requirePermission
│   │   │   └── errorMiddleware.ts     # Global humanized civic error handler & 404
│   │   ├── routes/
│   │   │   ├── authRoutes.ts          # /api/auth/*
│   │   │   ├── categoryRoutes.ts      # /api/categories/*
│   │   │   ├── departmentRoutes.ts    # /api/departments/*
│   │   │   ├── healthRoutes.ts        # /api/health
│   │   │   └── index.ts               # Master API router
│   │   ├── seeds/
│   │   │   └── seed.ts                # Database seed script
│   │   ├── types/
│   │   │   └── express.d.ts           # Express Request user type extensions
│   │   ├── utils/
│   │   │   ├── apiResponse.ts         # Standardized civic JSON response envelope
│   │   │   ├── jwt.ts                 # JWT token generation & verification
│   │   │   ├── logger.ts              # Civic timestamped console logger
│   │   │   └── password.ts            # BCrypt hashing & comparison
│   │   ├── app.ts                     # Express app setup with SPA static serving
│   │   └── server.ts                  # Server entrypoint
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                # 28 Shared Design System Components
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Breadcrumb.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Checkbox.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   ├── Drawer.tsx
│   │   │   │   ├── Dropdown.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── ErrorState.tsx
│   │   │   │   ├── FileUploader.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── LoadingSkeleton.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Notification.tsx
│   │   │   │   ├── PriorityBadge.tsx
│   │   │   │   ├── Radio.tsx
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   ├── Timeline.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── index.ts           # Central export of all 28 common components
│   │   │   └── layout/
│   │   │       ├── AppLayout.tsx      # Main application shell with sidebar & navbar
│   │   │       ├── Navbar.tsx         # Header with branding, notifications, user menu, theme
│   │   │       └── Sidebar.tsx        # Responsive navigation sidebar
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Authentication & RBAC user state provider
│   │   │   └── ThemeContext.tsx       # Light / Dark municipal theme provider
│   │   ├── pages/
│   │   │   ├── DashboardShellPage.tsx # Foundation shell & interactive component showcase
│   │   │   ├── LandingPage.tsx        # Public portal gateway & department directory
│   │   │   ├── LoginPage.tsx          # Civic login with test account autofill
│   │   │   ├── NotFoundPage.tsx       # 404 handler
│   │   │   ├── RegisterPage.tsx       # Citizen registration page
│   │   │   └── UnauthorizedPage.tsx   # 403 access restricted page
│   │   ├── routes/
│   │   │   └── ProtectedRoute.tsx     # Route guard enforcing authentication & roles
│   │   ├── services/
│   │   │   ├── api.ts                 # Fetch wrapper with Bearer token injection
│   │   │   ├── authService.ts         # Login, register, me, logout API calls
│   │   │   └── departmentService.ts   # Departments and categories API calls
│   │   ├── styles/
│   │   │   ├── components.css         # Styling for all 28 shared components
│   │   │   ├── globals.css            # Base reset, typography, accessible focus rings
│   │   │   ├── layout.css             # Header, sidebar and responsive shell styles
│   │   │   └── tokens.css             # Civic color tokens, radii, shadows, typography
│   │   ├── types/
│   │   │   └── index.ts               # Core frontend interfaces (User, Dept, etc.)
│   │   ├── App.tsx                    # Route definitions
│   │   └── main.tsx                   # React root entrypoint
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   └── member-1-foundation.md         # This handoff documentation
├── .gitignore
├── .env.example
└── package.json                       # Unified root script runner
```

---

## 3. Environment Variables

### Backend (`backend/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the Express backend server |
| `NODE_ENV` | `development` | Runtime environment mode |
| `DATABASE_URL` | `"file:./nagar_connect.db"` | SQLite connection string (or PostgreSQL) |
| `JWT_SECRET` | `nagar_connect_civic_jwt_secret_dev_key_2026_secure` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN`| `7d` | JWT session lifetime |
| `CLIENT_ORIGIN`| `http://localhost:5173` | Allowed CORS origin for Vite dev server |

### Frontend (`frontend/.env.example`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api` | Base URL prefix for backend REST calls |

---

## 4. Database Architecture & Models

The database is built with **Prisma ORM**. The default datasource is SQLite for instant local execution without needing external database servers, and is fully portable to PostgreSQL by altering the `provider` in `prisma/schema.prisma`.

### Models Defined:
1. **`Role`** (`roles` table):
   - `id`: String (UUID)
   - `name`: String (Unique: `CITIZEN`, `OFFICER`, `FIELD_STAFF`, `MUNICIPAL_ADMIN`, `COMMISSIONER`, `KNOWLEDGE_ADMIN`, `SUPER_ADMIN`)
   - `description`: String?
   - Relations: `permissions: RolePermission[]`, `users: User[]`

2. **`Permission`** (`permissions` table):
   - `id`: String (UUID)
   - `name`: String (Unique, e.g. `complaints:create`, `complaints:assign`, `departments:read`)
   - `description`: String?
   - Relations: `roles: RolePermission[]`

3. **`RolePermission`** (`role_permissions` table):
   - `roleId`, `permissionId` (Composite unique key)
   - Explicit many-to-many relationship mapping roles to permissions.

4. **`User`** (`users` table):
   - `id`: String (UUID)
   - `name`: String
   - `email`: String (Unique)
   - `phone`: String? (Unique)
   - `passwordHash`: String (BCrypt salt rounds = 10)
   - `roleId`: String (foreign key to Role)
   - `departmentId`: String? (foreign key to Department)
   - `status`: String (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
   - Relations: `citizenComplaints`, `officerComplaints`, `fieldStaffComplaints` (prepared for future members).

5. **`Department`** (`departments` table):
   - `id`: String (UUID)
   - `name`: String (Unique: e.g. "Roads & Infrastructure", "Water Supply")
   - `code`: String (Unique: e.g. `ROADS`, `WATER`, `SANITATION`)
   - `description`: String?
   - `active`: Boolean (default true)
   - Relations: `users: User[]`, `categories: ComplaintCategory[]`, `complaints: Complaint[]`

6. **`ComplaintCategory`** (`complaint_categories` table):
   - `id`: String (UUID)
   - `name`: String
   - `description`: String?
   - `departmentId`: String (foreign key to Department)
   - `active`: Boolean (default true)
   - Unique composite: `[name, departmentId]`

7. **`Complaint`** (`complaints` table - Foundation for Member 2):
   - `id`: String (UUID)
   - `complaintNumber`: String (Unique, e.g. `NC-2026-0001`)
   - `citizenId`: String (foreign key to User)
   - `departmentId`: String? (foreign key to Department)
   - `categoryId`: String? (foreign key to ComplaintCategory)
   - `title`: String
   - `description`: String
   - `location`: String
   - `landmark`: String?
   - `priority`: String (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
   - `status`: String (`SUBMITTED`, `UNDER_REVIEW`, `ASSIGNED`, `FIELD_VERIFICATION`, `IN_PROGRESS`, `RESOLUTION_SUBMITTED`, `CITIZEN_VERIFICATION`, `RESOLVED`, `CLOSED`, `REJECTED`, `ESCALATED`, `CANNOT_RESOLVE`, `NEEDS_ESCALATION`, `REOPENED`)
   - `assignedOfficerId`: String?
   - `assignedFieldStaffId`: String?
   - `slaDeadline`: DateTime?
   - `createdAt`, `updatedAt`: DateTime

---

## 5. Authentication & RBAC Details

### Authentication Endpoints:
- `POST /api/auth/register`: Register new user (citizens can register directly; hashes password; returns JWT token + user profile).
- `POST /api/auth/login`: Accepts `identifier` (email or phone) and `password`. Returns JWT token + permissions array + department details.
- `GET /api/auth/me`: Protected route returning authenticated user session.
- `POST /api/auth/logout`: Invalidates client session.

### Authorization Middleware:
- `requireAuth(req, res, next)`: Validates Bearer token, checks if user exists and `status === 'ACTIVE'`, injects `req.user` with role and permissions.
- `requireRole(...roles)`: Enforces that the authenticated user possesses one of the allowed roles (e.g. `requireRole('OFFICER', 'MUNICIPAL_ADMIN')`). `SUPER_ADMIN` has global authorization.
- `requirePermission(...permissions)`: Enforces granular capability checks (e.g. `requirePermission('complaints:assign')`).

### Seeded Demo Accounts:
| Role | Email Identifier | Password | Department |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@example.com` | `Citizen@12345` | N/A |
| **Officer** | `officer.roads@nagarconnect.gov.in` | `Officer@12345` | Roads & Infrastructure |
| **Super Admin** | `admin@nagarconnect.gov.in` | `Admin@12345` | Municipal Administration |

---

## 6. Shared Civic Design System (28 Components)

All components are located in `frontend/src/components/common/` and exported via `index.ts`:

1. **`Button`**: Primary, secondary, outline, ghost, danger variants; sizes `sm`, `md`, `lg`; `isLoading` spinner state; left/right icon slots.
2. **`Input`**: Accessible text input with label, asterisk for required, helper text, and validation error messages.
3. **`Select`**: Select dropdown supporting `options` array or direct `<option>` children.
4. **`Textarea`**: Multi-line input with label, rows, helper text, and validation state.
5. **`Checkbox`**: Accessible checkbox with title and secondary description.
6. **`Radio`**: Accessible radio button group element.
7. **`Badge`**: Semantic badges (`default`, `primary`, `secondary`, `success`, `warning`, `danger`, `info`) with pill option.
8. **`StatusBadge`**: Specialized badge mapping all 14 complaint lifecycle states to restrained civic colors.
9. **`PriorityBadge`**: Specialized badge for complaint priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
10. **`Card`**: Standard content card with title, subtitle, headerRight action slot, and footer.
11. **`Table`**: Enterprise-style table with responsive container, subtle header, hover states, and empty text fallback.
12. **`Modal`**: Accessible dialog overlay with backdrop click dismiss, ESC key support, header, and footer.
13. **`Drawer`**: Slide-in panel for side inspection views with ESC key support.
14. **`Tabs`**: Tabbed navigation with active state, badge counts, and ARIA attributes.
15. **`Dropdown`**: Menu dropdown with click-outside detection and aligned container.
16. **`SearchBar`**: Search input with embedded magnifying glass icon and clear button.
17. **`FilterPanel`**: Toolbar container for multiple filter controls with reset button.
18. **`Breadcrumb`**: Civic breadcrumb hierarchy with home icon and chevron separators.
19. **`Toast` & `ToastProvider` / `useToast`**: Notification toast system with success, error, warning, and info banners.
20. **`Notification`**: Notification item component with unread indicator and category icon.
21. **`Timeline`**: Vertical timeline component for tracking grievance resolution history.
22. **`FileUploader`**: Photo and document evidence uploader with drag target and file preview chips.
23. **`LoadingSkeleton`**: Multi-line animated placeholder skeleton for asynchronous data fetches.
24. **`EmptyState`**: Professional empty state with civic messaging ("No records found.") and action button.
25. **`ErrorState`**: Humanized error state with retry action ("We couldn't complete that request.").
26. **`ConfirmDialog`**: Confirmation dialog for destructive actions (e.g. archiving or escalations).
27. **`Navbar`**: Civic top navigation bar with brand logo, notifications, theme switcher, and user menu.
28. **`Sidebar`**: Left navigation sidebar with mobile drawer toggle and foundation status.

---

## 7. How to Run the Project

### Prerequisites
- Node.js (v18+)
- npm

### Quick Setup:
```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Synchronize SQLite Database & Seed
npx prisma db push
npx tsx src/seeds/seed.ts

# 3. Build Backend
npm run build

# 4. Install & Build Frontend
cd ../frontend
npm install
npm run build

# 5. Start Application
cd ../backend
node dist/server.js
```
The application will be live at: **`http://localhost:5000/`**  
Both the React single-page frontend and the backend REST API (`/api/*`) are served on port 5000.

Alternatively, for frontend hot-module reloading during development:
```bash
# Terminal 1: Backend API
cd backend && npm run dev

# Terminal 2: Frontend Vite Dev Server
cd frontend && npm run dev
```

---

## 8. What Member 2 Should Do Next

Member 2 is responsible for **Citizen Complaint Management**. Member 2 can directly build upon this foundation:

1. **Complaint Submission Form (`/citizen/new-complaint`)**:
   - Reuse `Card`, `Input`, `Select`, `Textarea`, `FileUploader`, `Button`, and `useToast`.
   - Call `GET /api/departments` and `GET /api/categories?departmentId=...` to populate dropdowns.
   - Post to future `POST /api/complaints` using the existing `Complaint` model in Prisma.
2. **Citizen Complaints List (`/citizen/complaints`)**:
   - Reuse `Table`, `StatusBadge`, `PriorityBadge`, `SearchBar`, `FilterPanel`, `EmptyState`.
   - Display citizen complaints filtered by `citizenId = req.user.id`.
3. **Complaint Detail & Timeline View (`/citizen/complaints/:id`)**:
   - Reuse `Timeline`, `StatusBadge`, `Badge`, `Card`.
   - Render citizen verification controls (Satisfied / Reopen).
4. **Backend Routes to add**:
   - Create `backend/src/controllers/complaintController.ts` and `backend/src/routes/complaintRoutes.ts`.
   - Protect with `requireAuth` and `requireRole('CITIZEN')` or `requirePermission('complaints:create')`.

---

## 9. Conclusion & Handoff Notice

> **Member 1 Phase 1 completed. Member 2 can continue from this foundation.**
