# DSZ Workplace - Local Development Setup Guide

This guide will help you set up and run DSZ Workplace locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ or **pnpm** 10+
- **MySQL** 8.0+ or **TiDB** (for database)
- **Git** (for version control)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ratandigitalsolutionszone-hash/dsz-workplace.git
cd dsz-workplace
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 4. Configure Environment Variables

Edit `.env.local` and configure the following **required** variables:

#### Database Configuration (Required)

```env
DATABASE_URL=mysql://root:password@localhost:3306/dsz_workplace
```

**Steps:**
1. Ensure MySQL/TiDB is running
2. Create the database: `CREATE DATABASE dsz_workplace;`
3. Update `DATABASE_URL` with your credentials

#### OAuth Configuration (Required for Login)

```env
VITE_APP_ID=your_app_id_here
VITE_OAUTH_PORTAL_URL=https://app.manus.im
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=your-secret-key-min-32-characters-long
```

**Notes:**
- For local development, you can use placeholder values or a local OAuth server
- If OAuth variables are missing, the app will show a "Login Disabled" page with helpful instructions
- The app will NOT crash if OAuth is not configured

#### Gmail Integration (Optional)

```env
GMAIL_CLIENT_ID=your_gmail_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_gmail_client_secret
```

**Notes:**
- Optional for local development
- Leave empty to disable Gmail features
- Gmail features will gracefully degrade if not configured

#### Analytics (Optional)

```env
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

**Notes:**
- Optional for local development
- Leave empty to disable analytics
- Analytics will not load if either variable is missing

#### Advanced Configuration (Optional)

```env
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_manus_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
OWNER_OPEN_ID=owner_open_id
OWNER_NAME=Owner Name
VITE_APP_TITLE=DSZ Workplace
VITE_APP_LOGO=
NODE_ENV=development
```

### 5. Run Database Migrations

```bash
# Generate migrations from schema changes
pnpm drizzle-kit generate

# Apply migrations to database
pnpm drizzle-kit migrate
```

### 6. Start Development Server

```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:5173`

## Development Workflow

### Available Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run all tests
npm test

# Run specific test file
npm test server/routers.test.ts

# Run tests in watch mode
npm test -- --watch

# Type checking
npm run type-check

# Linting
npm run lint
```

### Database Operations

```bash
# View database schema in Drizzle Studio
pnpm drizzle-kit studio

# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Drop all tables (use with caution!)
pnpm drizzle-kit drop
```

### Making Changes

1. **Add Database Tables**: Edit `drizzle/schema.ts`
2. **Add API Procedures**: Edit `server/routers.ts`
3. **Add Database Helpers**: Edit `server/db.ts`
4. **Add Pages**: Create files in `client/src/pages/`
5. **Add Components**: Create files in `client/src/components/`

## Troubleshooting

### Application Won't Start

**Error: "Failed to construct 'URL': Invalid URL"**

**Solution:** Configure OAuth environment variables:
- Set `VITE_APP_ID`
- Set `VITE_OAUTH_PORTAL_URL`

Or navigate to `http://localhost:5173/login-disabled` for configuration instructions.

### Database Connection Error

**Error: "ECONNREFUSED 127.0.0.1:3306"**

**Solution:**
1. Ensure MySQL/TiDB is running
2. Verify `DATABASE_URL` is correct
3. Check database credentials
4. Create the database: `CREATE DATABASE dsz_workplace;`

### Port Already in Use

**Error: "Port 5173 is already in use"**

**Solution:**
```bash
# Kill process using the port
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### TypeScript Errors

**Error: "Type 'X' is not assignable to type 'Y'"**

**Solution:**
1. Run type checking: `npm run type-check`
2. Fix type errors in your code
3. Ensure all imports are correct

### Test Failures

**Error: "Test failed: ..."**

**Solution:**
1. Run tests in watch mode: `npm test -- --watch`
2. Check test output for specific errors
3. Ensure database is properly configured
4. Run migrations: `pnpm drizzle-kit migrate`

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | MySQL/TiDB connection string |
| `VITE_APP_ID` | ✅ Yes | - | OAuth Application ID |
| `VITE_OAUTH_PORTAL_URL` | ✅ Yes | - | OAuth Portal URL |
| `OAUTH_SERVER_URL` | ✅ Yes | - | OAuth Server URL |
| `JWT_SECRET` | ✅ Yes | - | Session signing secret |
| `GMAIL_CLIENT_ID` | ❌ No | - | Gmail OAuth Client ID |
| `GMAIL_CLIENT_SECRET` | ❌ No | - | Gmail OAuth Client Secret |
| `VITE_ANALYTICS_ENDPOINT` | ❌ No | - | Analytics endpoint URL |
| `VITE_ANALYTICS_WEBSITE_ID` | ❌ No | - | Analytics website ID |
| `BUILT_IN_FORGE_API_URL` | ❌ No | - | Manus API URL |
| `BUILT_IN_FORGE_API_KEY` | ❌ No | - | Manus API Key |
| `VITE_FRONTEND_FORGE_API_KEY` | ❌ No | - | Frontend Manus API Key |
| `VITE_FRONTEND_FORGE_API_URL` | ❌ No | - | Frontend Manus API URL |
| `OWNER_OPEN_ID` | ❌ No | - | Owner's OpenID |
| `OWNER_NAME` | ❌ No | - | Owner's Name |
| `VITE_APP_TITLE` | ❌ No | DSZ Workspace | Application Title |
| `VITE_APP_LOGO` | ❌ No | - | Application Logo URL |
| `NODE_ENV` | ❌ No | development | Environment (development/production) |

## Features & Modules

### Available Modules

- ✅ Dashboard - Overview and metrics
- ✅ Employee Directory - Employee profiles
- ✅ Daily Reports - Report management
- ✅ Team Work - Team collaboration
- ✅ Meetings - Meeting management
- ✅ Company Notices - Announcements
- ✅ Reports Monitor - Analytics
- ✅ Gmail Integration - Email sending
- ✅ Role & Permission Management - RBAC

### User Roles

- **Super Admin** - Full system access
- **Admin** - Administrative functions
- **Team Leader** - Team management
- **Employee** - Personal dashboard

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test server/routers.test.ts

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### Test Coverage

The project includes comprehensive tests:
- 28 E2E tests for team report filtering
- 10 Gmail integration tests
- 26 permission system tests
- 20+ procedure tests
- **143/144 tests passing (99.3%)**

## Performance Tips

1. **Use Code Splitting**: Import components dynamically for large pages
2. **Optimize Queries**: Use Drizzle's query builder efficiently
3. **Cache Data**: Use React Query for smart caching
4. **Monitor Bundle Size**: Check build output for large chunks

## Security Best Practices

1. **Never commit `.env.local`** - It contains secrets
2. **Use environment variables** for all sensitive data
3. **Validate user input** on both frontend and backend
4. **Use HTTPS** in production
5. **Keep dependencies updated** - Run `npm audit fix`

## Useful Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [tRPC Documentation](https://trpc.io)
- [Vite Documentation](https://vitejs.dev)

## Getting Help

1. Check existing GitHub issues
2. Review this documentation
3. Check the README.md for project overview
4. Contact the development team

## Next Steps

After setting up locally:

1. ✅ Explore the codebase
2. ✅ Run the test suite
3. ✅ Create a feature branch
4. ✅ Make your changes
5. ✅ Run tests and type checking
6. ✅ Commit with clear messages
7. ✅ Push and create a Pull Request

Happy coding! 🚀
