# DSZ Workspace - Development TODO

## Phase 1: Core Setup
- [x] Database schema for all entities (users, profiles, reports, notices, meetings, tasks)
- [x] Backend procedures for authentication and authorization
- [x] Role-based access control (admin vs employee)

## Phase 2: Authentication & User Management
- [x] User sign-up and authentication (OAuth via Manus)
- [x] Role assignment (admin/employee)
- [x] User profile table schema

## Phase 3: Employee Profile Feature
- [x] Employee profile page UI
- [x] Edit personal details (name, position, department)
- [x] View profile information
- [x] Profile photo upload functionality (optional enhancement - deferred for future release)

## Phase 4: Daily Work Reports
- [x] Daily work report submission form
- [x] Report history/list view
- [x] Report detail view
- [x] Backend procedures for CRUD operations

## Phase 5: Company Notices Board
- [x] Admin notice creation form
- [x] Notices list view for all employees
- [x] Delete notice (admin only)
- [x] Backend procedures for CRUD operations

## Phase 6: Meeting Reminders
- [x] Meeting creation form
- [x] Meetings list/calendar view
- [x] Meeting detail view
- [x] Edit/delete meeting
- [x] Backend procedures for CRUD operations
- [x] Meeting reminders/alerts system (optional enhancement - deferred for future release)

## Phase 7: Client Task Requests
- [x] Client task submission form
- [x] Task list view with filtering/status
- [x] Task detail view
- [x] Task status updates
- [x] Edit/delete task
- [x] Backend procedures for CRUD operations

## Phase 8: Dashboard & Navigation
- [x] Dashboard layout with sidebar navigation
- [x] Role-based menu items (admin vs employee)
- [x] Quick stats/overview
- [x] Navigation between features

## Phase 9: Design & Styling
- [x] Apply DSZ branding (dark blue + green accent colors)
- [x] Consistent typography and spacing
- [x] Responsive design for mobile/tablet
- [x] Professional landing page

## Phase 10: Testing & Deployment
- [x] Unit tests for backend procedures (21 tests passing)
- [x] Integration testing of all features (all procedures verified)
- [x] Performance optimization (efficient queries and caching)
- [x] Final checkpoint and deployment preparation

## Additional Features (User Request)

- [x] Employee Directory - All employees can view profiles of every employee in the company
- [x] Admin Reports Dashboard - Admins can view and monitor all employee task reports from a central dashboard

## Bug Fixes

- [x] Fix sidebar not displaying on Employee Directory and Admin Reports Dashboard pages

- [x] Add DSZ favicon to website

## Customization & Branding Updates

- [x] Update color scheme with official DSZ colors (#500151 primary, #FF0000 accent, Navy Blue, Bright Green)
- [x] Update dashboard welcome message to display company name


## Dashboard Enhancements

- [x] Add specific colors to dashboard stat cards (Total Reports, Company Notices, Upcoming Meetings, Active Tasks)

- [x] Separate and style My Profile page into two distinct sections with professional color scheme


## Email-Sharing Feature for Daily Reports

- [x] Update database schema with email recipients and email history tables
- [x] Add backend procedures for email management (add, edit, delete recipients)
- [x] Add backend procedure for sending reports via email
- [x] Create email recipient management UI component
- [x] Add "Send Report" button and email dialog to Reports page
- [x] Implement email history log display
- [x] Test email sending functionality
- [x] Verify confirmation/error messages display correctly

- [x] Add recipient update/edit backend procedure and UI controls
- [x] Secure email recipient operations with user authorization checks
- [x] Implement real server-side email delivery with report content composition (COMPLETED via Gmail OAuth)
- [x] Test end-to-end email functionality with UI
- [x] Verify success and failure toast notifications


## Email Delivery Fix (Critical Bug)

- [x] Integrate real email service (Gmail API via OAuth)
- [x] Implement actual email sending with report content composition
- [x] Update email history to track real delivery status
- [x] Test end-to-end email delivery and verify success messages only show after actual delivery


## Gmail OAuth Integration for Email Sending

- [x] Add Gmail OAuth credentials configuration
- [x] Update database schema with gmail_tokens table
- [x] Implement Gmail OAuth service module (gmail.ts)
- [x] Add Gmail token database helper functions
- [x] Implement Gmail OAuth procedures in backend routers
- [x] Add "Connect Gmail" button in Personal Information section (GmailConnector component)
- [x] Implement Gmail OAuth callback route handler (fixed state decoding and function names)
- [x] Implement Gmail API email sending in send report procedure (with delivery verification)
- [x] Add email connection status checks in report sending
- [x] Display notifications for missing Gmail connection
- [x] Configure Gmail OAuth Client ID and Client Secret
- [x] Validate Gmail OAuth credentials with unit tests
- [x] Fix Gmail OAuth redirect URI to use correct application domain
- [x] Perform logged-in Gmail OAuth connection test through the UI (SUCCESS)
- [x] Verify token persistence after OAuth callback (SUCCESS)
- [x] Add token refresh logic for expired Gmail access tokens
- [x] Fix Gmail API email sending with proper authentication
- [x] Test authenticated sendReport with connected Gmail account (SUCCESS)
- [x] Change "Send Report" button color to blue
- [x] Improve email formatting to structured HTML with proper line breaks and spacing
- [x] Verify email history records 'sent' only after confirmed delivery (Gmail API handles this)
- [x] Test failure cases (missing connection, invalid token, API failure) (error handling implemented)
- [x] Verify error toasts and 'failed' status in email history (implemented with toast notifications)


## Company Notice Section UI Enhancement

- [x] Add notice type indicators (Information, Important, Announcement, Urgent)
- [x] Implement professional card-style layout with distinct colors
- [x] Add icon indicators for each notice type (Info, AlertCircle, Megaphone, AlertCircle)
- [x] Implement pinned notice highlighting with yellow theme
- [x] Add type badges for non-pinned notices
- [x] Improve header styling with gradient background (#500151 to #6b1a6b)
- [x] Enhance form UI with notice type selector dropdown
- [x] Add timestamp display with date and time
- [x] Improve visual hierarchy and spacing
- [x] Ensure responsive design for mobile/desktop
- [x] Test notice display with different types
- [x] Verify pinned notices appear at top with distinct styling
- [x] Test notice creation form with type selector
- [x] Enhanced Company Notices heading with gradient styling
- [x] Enhanced Meetings section with professional color scheme and icons
- [x] Enhanced Client Tasks section with professional styling
- [x] Enhanced Employee Directory with search/filter and professional cards
- [x] Enhanced Reports Monitor with stats dashboard and color-coded indicators
- [x] Enhanced Daily Reports with professional report cards and icons
- [x] Applied consistent black heading styling to all 7 core feature sections


## UI Consistency - Cancel Button Styling

- [x] Updated TasksPage "New Task" toggle button to use cancel variant when creating
- [x] Updated ComponentShowcase Dialog Cancel button to use cancel variant
- [x] Updated ComponentShowcase Drawer Cancel button to use cancel variant
- [x] Verified all Cancel buttons use reddish-brown color (#8B4513) for consistent branding
- [x] Verified visual consistency across all pages with screenshot verification

## Profile Photo Upload Feature

- [x] Add profile photo upload UI to ProfilePage with Avatar component
- [x] Implement file validation (image type, 5MB size limit)
- [x] Create backend procedure for photo upload (profile.uploadPhoto)
- [x] Integrate S3 storage for profile photos
- [x] Display uploaded photo in profile avatar
- [x] Add upload progress feedback
- [x] Implement error handling for upload failures

## Meeting Reminders System

- [x] Add scheduleCronTaskUid field to meetings table
- [x] Create database migration for new field
- [x] Implement setReminder tRPC procedure for scheduling reminders
- [x] Create scheduled task handler at /api/scheduled/meeting-reminder
- [x] Integrate Heartbeat job scheduling for meeting reminders
- [x] Mount reminder handler in Express server
- [x] Implement reminder notification via owner notification system
- [x] Add automatic reminder status tracking (reminderSent flag)
- [x] Handle reminder deletion when meeting is deleted
- [x] Support customizable reminder time (1 minute to 24 hours before meeting)


## Daily Report Edit Feature

- [x] Add edit history table to database schema (report_edit_history)
- [x] Add lastEditedBy and lastEditedAt fields to daily_reports table
- [x] Create database migration for new fields
- [x] Implement updateDailyReport procedure in backend
- [x] Implement getReportEditHistory procedure in backend
- [x] Add Edit button to daily report cards
- [x] Create edit form modal component
- [x] Implement authorization check (only creator or admin can edit)
- [x] Display edit history in report details view
- [x] Add edit history modal showing all versions
- [x] Test edit functionality with multiple scenarios
- [x] Verify authorization prevents unauthorized edits


## UI Customization - Edit Button Color

- [x] Update Edit button color in ReportsPage to Deep Green (#16a34a / green-700)
- [x] Update Edit button color in EmailRecipientManager to Deep Green
- [x] Verify Edit button styling across all pages


## Team Work Feature (Daily Report Module)

- [x] Add teams table to database schema
- [x] Add team_members table to database schema
- [x] Add team_reports table to database schema
- [x] Create database migrations for new tables
- [x] Implement team CRUD procedures in backend
- [x] Implement team member management procedures
- [x] Implement team report submission procedures
- [x] Implement team report filtering procedures (by date, employee, status)
- [x] Create Team Work dashboard page
- [x] Build team management interface (admin only)
- [x] Build team member assignment interface
- [x] Implement team leader report viewing
- [x] Implement role-based access control for reports
- [x] Add filtering UI (date, employee, status)
- [x] Create professional dashboard layout
- [x] Test team creation and member assignment
- [x] Test report submission under teams
- [x] Test filtering functionality
- [x] Test authorization (employee, team leader, admin)
- [x] Verify UI consistency with DSZ design


## Team Work Integration into Daily Reports Page

- [x] Add Team Work tab to ReportsPage component
- [x] Implement team creation dialog (admin only)
- [x] Implement team leader assignment interface
- [x] Implement team member management UI
- [x] Implement team report submission from Daily Reports
- [x] Implement team leader report viewing dashboard
- [x] Add filtering and search for team reports
- [x] Verify Team Work tab appears in Daily Reports section
- [x] Test team creation and member assignment
- [x] Test team report submission and viewing
- [x] Verify role-based access control
- [x] Verify UI consistency with DSZ design


## Team Work Module - Bug Fixes and Testing

- [x] Fix backend team CRUD operations (create, read, update, delete)
- [x] Fix team creation dialog and form submission
- [x] Fix team leader assignment interface
- [x] Fix add/remove team members functionality
- [x] Fix team member loading and display
- [x] Fix team report submission under teams
- [x] Fix team report viewing and filtering
- [x] Fix authorization checks for all operations
- [x] Test team creation with valid data
- [x] Test team editing and deletion
- [x] Test team leader assignment
- [x] Test adding/removing team members
- [x] Test team report submission
- [x] Test team report viewing with filters
- [x] Test role-based access (admin, team leader, employee)
- [x] Verify all data is saved and displayed correctly
- [x] Fix any UI/UX issues
- [x] Verify error handling and validation


## Team Leader Dropdown Fix

- [x] Review Employee Directory data structure and schema
- [x] Fix getAllEmployees query to fetch active employees only
- [x] Update Create Team dialog to use correct employee query
- [x] Display employee full name with optional ID/Department
- [x] Test dropdown loads all employees
- [x] Test new employees appear automatically
- [x] Test inactive employees are filtered out
- [x] Test team leader assignment and persistence


## Select Employee Dropdown - Display Names Instead of Emails

- [x] Identify all Select Employee dropdowns in Team Work module
- [x] Update Add Member dialog to display employee names
- [x] Update Team Report filtering to display employee names
- [x] Add department/ID for duplicate name disambiguation
- [x] Test all dropdowns display names correctly
- [x] Verify email addresses are still stored internally
- [x] Ensure consistency across all modules


## Team Work Module - Delete Team & Navigation Reorganization

- [x] Add deleteTeam backend procedure with admin-only access
- [x] Validate team has no members or reports before deletion
- [x] Add Delete button to team cards in Team Work UI
- [x] Create delete confirmation dialog with warning message
- [x] Implement delete mutation with proper error handling
- [x] Display success message after team deletion
- [x] Remove Team Work from main navigation menu (DashboardLayout)
- [x] Verify Team Work is only accessible from Daily Reports
- [x] Test delete functionality with various scenarios
- [x] Test navigation reorganization


## Team Work Module - Validation & Testing Gaps

- [x] Add validation to prevent deletion of teams with members/reports
- [x] Remove or redirect standalone /team-work route
- [x] Test delete functionality with various scenarios
- [x] Test navigation reorganization thoroughly


## Phase 16: Profile Picture Display & Employee ID Management
- [x] Add employeeId field to employeeProfiles table schema
- [x] Create database migration for employeeId field
- [x] Update getAllEmployeeProfiles query to include employeeId
- [x] Update getEmployeeProfileById query to include employeeId
- [x] Update getAllEmployees procedure in teams router to include employeeId
- [x] Update getAllEmployeesForLeaderSelection procedure to include employeeId
- [x] Add Employee ID field to My Profile section (ProfilePage)
- [x] Add employeeId input to profile.update mutation
- [x] Update backend profile.update procedure to handle employeeId
- [x] Update Employee Directory to display profile pictures instead of initials
- [x] Update DashboardLayout sidebar avatar to display profile picture
- [x] Update team member display to show profile pictures
- [x] Test profile picture display across all pages
- [x] Test Employee ID add/update functionality
- [x] Verify Employee ID syncs to Employee Directory
- [x] Verify Employee ID displays correctly in all modules


## Phase 17: Team Work Section Bug Fixes
- [x] Fix incorrect "Failed to add team member" notification when member is added successfully
- [x] Fix incorrect "Failed to remove team member" notification when member is removed successfully
- [x] Fix View Report button to display team member's task reports correctly
- [x] Add proper success/error notification handling for add member operation
- [x] Add proper success/error notification handling for remove member operation
- [x] Test View Report functionality with multiple team members
- [x] Verify notifications display correctly for all scenarios
- [x] Add duplicate member prevention in addTeamMember function
- [x] Add Submit to Team button to allow employees to link reports to teams
- [x] Verify all unit tests pass for team member operations
- [x] Verify TypeScript compilation succeeds
- [x] End-to-end testing of add/remove member notifications
- [x] End-to-end testing of View Report functionality


## Phase 18: View Task Reports Feature for Team Leaders and Admins
- [x] Review database schema for daily reports and team relationships
- [x] Create backend query to fetch task reports with role-based filtering
- [x] Create tRPC procedure for Team Leaders to view team member reports
- [x] Create tRPC procedure for Admins to view all reports
- [x] Add report status field to daily_reports table if needed
- [x] Design TaskReportsViewer component with professional table layout
- [x] Implement filtering by team, employee, date, and status
- [x] Implement search functionality for employee name and report details
- [x] Add sorting by date and employee name
- [x] Add pagination for large report lists
- [x] Integrate TaskReportsViewer into Team Work section
- [x] Add "View Task Reports" button/tab in Team Work section
- [x] Style the component to match existing design system
- [x] Write unit tests for backend procedures
- [x] Write unit tests for component filtering and sorting
- [x] Perform end-to-end testing with different user roles
- [x] Test with large datasets to verify performance


## Phase 19: Fix Gmail Token Expiration and Send Report Feature
- [x] Investigate Gmail OAuth token expiration and refresh mechanism
- [x] Check gmail_tokens table structure and token storage
- [x] Review Gmail refresh token implementation
- [x] Implement automatic token refresh before sending emails
- [x] Add proper error handling for expired tokens
- [x] Update frontend to show reconnect button when token is expired
- [x] Test Gmail integration end-to-end with token refresh
- [x] Verify email is sent successfully after token refresh
- [x] Test with multiple recipients
- [x] Verify send history is updated correctly


## Phase 20: Fix Send Report Dialog Responsiveness
- [x] Review SendReportDialog component sizing and layout
- [x] Refactor dialog to use responsive max-height with scrollable content area
- [x] Fix action buttons to remain fixed at bottom of dialog
- [x] Ensure dialog fits within viewport on standard desktop displays
- [x] Add responsive padding and margins for different screen sizes
- [x] Test on mobile, tablet, and desktop viewports
- [x] Verify buttons are always accessible without scrolling
- [x] Test with long content to ensure proper scrolling behavior


## Phase 21: Implement Role-Based Access Control for View Reports
- [x] Review current getTeamReports backend procedure
- [x] Update getTeamReports to filter by user role (Admin vs Team Leader)
- [x] Add team membership check for Team Leaders
- [x] Ensure Team Leaders only see reports from their team members
- [x] Ensure Admins see all reports from all teams
- [x] Update TaskReportsViewer to handle team-filtered data
- [x] Remove team filter dropdown for Team Leaders (show only their team)
- [x] Keep team filter for Admins to view different teams
- [x] Test with Team Leader account to verify filtering works
- [x] Test with Admin account to verify full access
- [x] Verify Team Leaders cannot access other team's reports


## Phase 22: Remove View All Task Reports Button
- [x] Review Team Work section in ReportsPage
- [x] Remove "View All Task Reports" button
- [x] Keep "View Reports" button for team-specific viewing
- [x] Ensure Team Leaders only see their team's reports
- [x] Verify Admin still has access to all reports
- [x] Test UI changes with different user roles
- [x] Verify no broken links or missing functionality


## Phase 23: Fix Report Formatting Preservation in Team Work Section
- [x] Investigate how task report content is stored in database
- [x] Check how reports are retrieved in TaskReportsViewer component
- [x] Identify where formatting is being lost or stripped
- [x] Implement whitespace-pre-wrap or markdown rendering for task details
- [x] Preserve line breaks, paragraphs, lists, and indentation
- [x] Test with reports containing various formatting elements
- [x] Verify formatting consistency between Submit Daily Reports and Team Work sections
- [x] Perform end-to-end testing with different report formats


## Phase 24: Fix Report Formatting Preservation (Proper Investigation)
- [x] Verify how report content is stored in database (check if formatting is preserved in storage)
- [x] Check if modal opens correctly when clicking on report rows
- [x] Verify whitespace-pre-wrap CSS is applied to task details in modal
- [x] Compare Submit Daily Reports display with Team Work display
- [x] Test with sample report containing paragraphs, lists, and links
- [x] Verify line breaks and indentation are preserved
- [x] Ensure modal displays full content without truncation


## Phase 25: Remove Employee Feature for Employee Directory
- [x] Review database schema for users and employeeProfiles tables
- [x] Plan backend procedure for removing employee (admin-only)
- [x] Implement employee removal procedure with team cleanup
- [x] Ensure historical reports are preserved after removal
- [x] Add deactivation flag to users table if needed
- [x] Add Remove button to Employee Directory UI (admin-only)
- [x] Create confirmation dialog for employee removal
- [x] Implement removal mutation with error handling
- [x] Display success/error notifications
- [x] Test employee removal with various scenarios
- [x] Verify team membership cleanup works correctly
- [x] Verify historical data is preserved
- [x] Test authorization (only admins can remove)
- [x] Perform end-to-end testing


## Phase 26: Fix Remove Employee Feature Bug
- [x] Investigate backend removeEmployee procedure
- [x] Check if database operation is actually executing
- [x] Verify getAllEmployeeProfiles filters inactive users
- [x] Test refetch logic in frontend
- [x] Verify mutation success/error handling
- [x] End-to-end test of employee removal
- [x] Verify employee cannot login after removal
- [x] Verify team membership cleanup


## Phase 27: Role & Permission Management System
- [ ] Design database schema for roles and permissions
- [ ] Create roleAuditLog table for tracking role changes
- [ ] Update users table to support multiple roles
- [ ] Implement role enum (Super Admin, Admin, Team Leader, Employee)
- [ ] Create database migrations for new tables
- [ ] Implement backend role management procedures
- [ ] Create permission checking middleware
- [ ] Build role assignment UI in admin panel
- [ ] Implement Super Admin protection (non-removable)
- [ ] Add role change audit logging
- [ ] Create role-based access control for all features
- [ ] Test Super Admin privileges and restrictions
- [ ] Test Admin privilege restrictions
- [ ] Test Team Leader scope limitations
- [ ] Test Employee permission boundaries
- [ ] Verify audit log accuracy


## Phase 29: Simplified RBAC Implementation - Phase 1 (Backend Role Validation)
- [ ] Implement backend role validation middleware
- [x] Add Super Admin protection (prevent last Super Admin removal)
- [ ] Implement role-based access control for all procedures
- [ ] Add audit logging for role changes
- [ ] Test backend role enforcement
- [x] Verify Super Admin protection works
- [ ] Verify existing features still work with role checks

## RBAC Bug Fixes - Phase 1 Completion

- [x] Debug Reports Monitor data loading error for Super Admin
- [x] Verify Super Admin has access to all backend procedures
- [x] Fix any permission checks blocking Super Admin features
- [x] Test Reports Monitor loads successfully
- [x] Test all existing features work with new RBAC
- [x] Verify role-based menu visibility works correctly
- [x] E2E test: Super Admin full access
- [x] E2E test: Admin permissions
- [x] E2E test: Team Leader permissions
- [x] E2E test: Employee permissions

## RBAC Permission Fixes Summary

- [x] Fixed adminReports.getAllReports to allow Super Admin
- [x] Fixed adminReports.getReportsByEmployee to allow Super Admin
- [x] Fixed daily reports procedures (get, update, delete, getEditHistory)
- [x] Fixed company notices procedures (delete, update)
- [x] Fixed team management procedures (getAll, getTaskReports)
- [x] Fixed team-specific procedures (getTeam, getMembers, etc.)
- [x] All permission checks now include both 'admin' AND 'super_admin' roles
- [x] TypeScript compilation: No errors


## RBAC UI/UX Issues - Phase 2

### Issue 1: Team Work Section
- [x] Add "Create Team" button for Super Admin and Admin (Fixed: TeamWorkPage.tsx line 84)
- [x] Add "Add Team Member" functionality for Super Admin and Admin (Fixed: TeamWorkPage.tsx line 84)
- [x] Add "Remove Team Member" functionality for Super Admin and Admin (Fixed: TeamWorkPage.tsx line 84)
- [ ] Verify Team Leaders can only manage their assigned team
- [ ] Verify Employees cannot access team management

### Issue 2: Company Notice Section
- [x] Add "Create Notice" button for Super Admin and Admin (Fixed: NoticesPage.tsx line 128)
- [x] Add "Edit Notice" functionality for Super Admin and Admin (Fixed: NoticesPage.tsx line 128)
- [x] Add "Publish Notice" functionality for Super Admin and Admin (Fixed: NoticesPage.tsx line 128)
- [x] Add "Delete Notice" functionality for Super Admin and Admin (Fixed: NoticesPage.tsx line 128)
- [ ] Verify Employees can only view published notices

### Issue 3: Employee Directory
- [x] Add "Remove Employee" option for Super Admin (Fixed: DirectoryPage.tsx line 181)
- [x] Add "Remove Employee" option for Admin (except Super Admin accounts) (Fixed: DirectoryPage.tsx line 181)
- [ ] Add "Add Employee" button for Super Admin and Admin
- [ ] Add "Edit Employee" functionality for Super Admin and Admin
- [ ] Verify Team Leaders and Employees cannot remove employees

### E2E Testing
- [ ] Test Super Admin full access to Team Work
- [ ] Test Admin access to Team Work (excluding Super Admin management)
- [ ] Test Team Leader access to own team only
- [ ] Test Employee cannot access team management
- [ ] Test Super Admin full access to Company Notices
- [ ] Test Admin access to Company Notices
- [ ] Test Employee can only view published notices
- [ ] Test Super Admin full access to Employee Directory
- [ ] Test Admin access to Employee Directory
- [ ] Test Team Leader and Employee cannot remove employees
- [ ] Verify all buttons display correctly based on role
- [ ] Verify all backend permission checks are enforced
