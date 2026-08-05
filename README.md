# DSZ Workplace - Internal Management System

A comprehensive internal workplace management system for Digital Solutions Zone (DSZ), built with modern web technologies and enterprise-grade security.

## Features

### Core Modules
- **Dashboard** - Overview of key metrics and recent activity
- **Employee Directory** - Complete employee profiles and contact information
- **Daily Reports** - Track and manage employee daily work reports
- **Team Work** - Team collaboration and report filtering by team membership
- **Meetings** - Schedule and manage team meetings
- **Company Notices** - Share important announcements and notices
- **Reports Monitor** - Monitor and analyze all employee reports
- **Gmail Integration** - Send reports via Gmail with automatic token refresh
- **Role & Permission Management (RBAC)** - Comprehensive role-based access control

### User Roles
- **Super Admin** - Full system access and user management
- **Admin** - Administrative functions and reporting
- **Team Leader** - Team management and report oversight
- **Employee** - Personal dashboard and report submission

## Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Responsive styling
- **Vite** - Fast build tool
- **tRPC** - Type-safe API communication
- **shadcn/ui** - Reusable UI components

### Backend
- **Express.js** - Web server framework
- **tRPC** - RPC framework with type safety
- **Drizzle ORM** - Type-safe database access
- **MySQL/TiDB** - Database
- **Manus OAuth** - Authentication

### Testing
- **Vitest** - Unit and integration testing
- **143+ tests** - Comprehensive test coverage (99.3% pass rate)

## Project Structure

```
dsz-workspace/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Database helpers
│   ├── _core/             # Core utilities
│   └── *.test.ts          # Tests
├── drizzle/               # Database schema
│   ├── schema.ts          # Table definitions
│   └── migrations/        # Migration files
├── shared/                # Shared types and constants
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
└── drizzle.config.ts      # Drizzle config
```

## Getting Started

### Prerequisites
- Node.js 18+ or pnpm 10+
- MySQL 8.0+ or TiDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ratandigitalsolutionszone-hash/dsz-workplace.git
   cd dsz-workplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with required environment variables (see `.env.example` for reference)

4. **Run database migrations**
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   The application will be available at `http://localhost:5173`

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run specific test file
npm test server/routers.test.ts

# Type checking
npm run type-check

# Linting
npm run lint
```

### Database Operations

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Open Drizzle Studio
pnpm drizzle-kit studio
```

### Key Files to Modify

- **Add database tables**: `drizzle/schema.ts`
- **Add API procedures**: `server/routers.ts`
- **Add database helpers**: `server/db.ts`
- **Add pages**: `client/src/pages/`
- **Add components**: `client/src/components/`

## Architecture

### Authentication Flow
1. User logs in via Manus OAuth
2. OAuth callback at `/api/oauth/callback`
3. Session cookie created and stored
4. Each tRPC request includes user context
5. Protected procedures check user role

### Data Flow
1. Frontend calls tRPC procedure via `trpc.*.useQuery/useMutation`
2. Backend validates user permissions
3. Database query executed via Drizzle ORM
4. Response returned with type safety
5. Frontend updates UI with typed data

### Role-Based Access Control
- **Super Admin** - Full access to all features
- **Admin** - Can manage users and view all reports
- **Team Leader** - Can manage team members and view team reports
- **Employee** - Can submit reports and view personal data

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test suite
npm test server/e2e-team-reports.test.ts

# Generate coverage report
npm test -- --coverage
```

### Test Coverage
- ✅ 28 E2E tests for team report filtering
- ✅ 10 Gmail integration tests
- ✅ 26 permission system tests
- ✅ 20+ procedure tests
- ✅ 143/144 tests passing (99.3%)

## Security

### Sensitive Files Protection
The `.gitignore` file protects:
- Environment variables (`.env*`)
- API keys and tokens (`.key`, `.pem`, `*.secret`)
- Database credentials
- OAuth credentials
- Manus artifacts and logs

### Best Practices
- Never commit `.env` files
- Always use environment variables for secrets
- Validate user permissions on backend
- Use HTTPS in production
- Keep dependencies updated

## Deployment

### Production Build
```bash
npm run build
```

### Running in Production
```bash
npm run build
npm start
```

## Troubleshooting

### Database Connection Issues
- Verify database connection string is correct
- Check database server is running
- Ensure user has proper permissions

### OAuth Issues
- Verify OAuth credentials are correct
- Check OAuth server URL is accessible
- Ensure redirect URL matches configuration

### Gmail Integration Issues
- Verify Gmail OAuth credentials
- Check token expiration and refresh
- Ensure Gmail API is enabled

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Commit with clear message
5. Push to GitHub
6. Create a Pull Request

## Version History

### Latest Commits
- **6b33148** - chore: enhance .gitignore with additional security measures
- **0d7d0c0** - Checkpoint: Team Work Report Filtering - Complete E2E Testing
- **bae56e3** - Checkpoint: Gmail Integration Fix Complete
- **c837a5a** - Checkpoint: Fixed Gmail integration logic inconsistency
- **37b418c** - Checkpoint: Completed comprehensive end-to-end testing

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review documentation
3. Contact the development team

## License

Internal use only - Digital Solutions Zone

---

**Repository**: https://github.com/ratandigitalsolutionszone-hash/dsz-workplace
**Last Updated**: August 4, 2026
