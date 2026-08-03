import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

// Super Admin-only procedure
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Only Super Admin can perform this action' });
  }
  return next({ ctx });
});
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { parse as parseCookie } from "cookie";
import { createHeartbeatJob, deleteHeartbeatJob } from "./_core/heartbeat";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Employee Profile Router
  profile: router({
    get: protectedProcedure.query(({ ctx }) =>
      db.getOrCreateEmployeeProfile(ctx.user.id)
    ),
    update: protectedProcedure
      .input(
        z.object({
          employeeId: z.string().optional(),
          position: z.string().optional(),
          department: z.string().optional(),
          phoneNumber: z.string().optional(),
          profilePhotoUrl: z.string().optional(),
          bio: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.updateEmployeeProfile(ctx.user.id, input)
      ),
    uploadPhoto: protectedProcedure
      .input(
        z.object({
          photoBase64: z.string(),
          fileName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Decode base64 to buffer
          const buffer = Buffer.from(input.photoBase64, 'base64');
          
          // Upload to storage
          const { url } = await storagePut(
            `profile-photos/${ctx.user.id}/${input.fileName}`,
            buffer,
            'image/jpeg'
          );
          
          // Update profile with photo URL
          return db.updateEmployeeProfile(ctx.user.id, { profilePhotoUrl: url });
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload profile photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }),
  }),

  // Daily Reports Router
  reports: router({
    create: protectedProcedure
      .input(
        z.object({
          reportDate: z.date(),
          tasksCompleted: z.string(),
          hoursWorked: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createDailyReport({ ...input, userId: ctx.user.id })
      ),
    getAll: protectedProcedure.query(({ ctx }) =>
      db.getUserDailyReports(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(async ({ ctx, input }) => {
        const report = await db.getDailyReport(input.reportId);
        if (!report) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
        }
        if ((report.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "super_admin")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot access this report" });
        }
        return report;
      }),
    update: protectedProcedure
      .input(
        z.object({
          reportId: z.number(),
          reportDate: z.date().optional(),
          tasksCompleted: z.string().optional(),
          hoursWorked: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { reportId, ...updateData } = input;
        const report = await db.getDailyReport(reportId);
        
        if (!report) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
        }
        
        if ((report.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "super_admin")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot edit this report" });
        }

        // Create edit history entry before updating
        await db.createEditHistory({
          reportId,
          editedBy: ctx.user.id,
          tasksCompleted: report.tasksCompleted,
          hoursWorked: report.hoursWorked ? (report.hoursWorked as any) : undefined,
          notes: report.notes,
        });

        // Update the report
        const result = await db.updateDailyReport(reportId, {
          ...updateData,
          lastEditedBy: ctx.user.id,
          lastEditedAt: new Date(),
        });

        return result?.[0];
      }),
    delete: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getDailyReport(input.reportId);
        
        if (!report) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
        }
        
        if ((report.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "super_admin")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete this report" });
        }

        return db.deleteDailyReport(input.reportId);
      }),
    getEditHistory: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(async ({ ctx, input }) => {
        const report = await db.getDailyReport(input.reportId);
        
        if (!report) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
        }
        
        if ((report.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "super_admin")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot access this report" });
        }

        return db.getReportEditHistory(input.reportId);
      }),
  }),

  // Company Notices Router
  notices: router({
    getAll: publicProcedure.query(() => db.getAllCompanyNotices()),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          content: z.string(),
          isPinned: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createCompanyNotice({ ...input, authorId: ctx.user.id });
      }),
    delete: protectedProcedure
      .input(z.object({ noticeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.deleteCompanyNotice(input.noticeId);
      }),
  }),

  // Meetings Router
  meetings: router({
    getAll: protectedProcedure.query(() => db.getAllMeetings()),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          startTime: z.date(),
          endTime: z.date(),
          location: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createMeeting({ ...input, createdById: ctx.user.id })
      ),
    update: protectedProcedure
      .input(
        z.object({
          meetingId: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          startTime: z.date().optional(),
          endTime: z.date().optional(),
          location: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { meetingId, ...updateData } = input;
        return db.updateMeeting(meetingId, updateData);
      }),
    delete: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteMeeting(input.meetingId);
      }),
    setReminder: protectedProcedure
      .input(
        z.object({
          meetingId: z.number(),
          reminderMinutesBefore: z.number().min(1).max(1440),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const meetings = await db.getAllMeetings();
        const meeting = meetings.find(m => m.id === input.meetingId);
        
        if (!meeting) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" });
        }

        // Calculate reminder time
        const reminderTime = new Date(meeting.startTime);
        reminderTime.setMinutes(reminderTime.getMinutes() - input.reminderMinutesBefore);

        // Delete existing reminder if any
        if (meeting.scheduleCronTaskUid) {
          const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
          try {
            await deleteHeartbeatJob(meeting.scheduleCronTaskUid, sessionToken);
          } catch (error) {
            console.error("Failed to delete old reminder:", error);
          }
        }

        // Create cron expression for reminder time
        const minutes = reminderTime.getUTCMinutes();
        const hours = reminderTime.getUTCHours();
        const day = reminderTime.getUTCDate();
        const month = reminderTime.getUTCMonth() + 1;
        const cronExpression = `0 ${minutes} ${hours} ${day} ${month} *`;

        // Create new scheduled reminder
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        try {
          const job = await createHeartbeatJob({
            name: `meeting-reminder-${meeting.id}`,
            cron: cronExpression,
            path: "/api/scheduled/meeting-reminder",
            payload: { meetingId: meeting.id },
            description: `Reminder for meeting: ${meeting.title}`,
          }, sessionToken);

          // Update meeting with task UID
          await db.updateMeeting(input.meetingId, {
            scheduleCronTaskUid: job.taskUid,
          });

          return { success: true, taskUid: job.taskUid };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to schedule reminder: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      }),
  }),

  // Client Tasks Router
  tasks: router({
    getAll: protectedProcedure.query(() => db.getAllClientTasks()),
    create: protectedProcedure
      .input(
        z.object({
          clientName: z.string(),
          title: z.string(),
          description: z.string().optional(),
          dueDate: z.date().optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createClientTask({ ...input, createdById: ctx.user.id })
      ),
    update: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.date().optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { taskId, ...updateData } = input;
        return db.updateClientTask(taskId, updateData);
      }),
    delete: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteClientTask(input.taskId);
      }),
  }),

  // Employee Directory Router
  directory: router({
    getAllEmployees: publicProcedure.query(() => db.getAllEmployeeProfiles()),
    getEmployeeProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getOrCreateEmployeeProfile(input.userId)),
    removeEmployee: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot remove yourself',
          });
        }
        return db.removeEmployee(input.userId);
      }),
  }),

  // Admin Reports Monitor Router
  adminReports: router({
    getAllReports: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getAllEmployeeReports();
    }),
    getReportsByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getEmployeeReportsByUserId(input.employeeId);
      }),
  }),

  // Gmail OAuth Router
  gmail: router({
    getAuthUrl: protectedProcedure.query(({ ctx }) => {
      const { getGmailAuthUrl } = require("./_core/gmail");
      return { authUrl: getGmailAuthUrl(ctx.user.id) };
    }),
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const token = await db.getGmailToken(ctx.user.id);
      if (!token) {
        return {
          connected: false,
          email: null,
        };
      }

      // Check if token is expired and needs refresh
      if (token.expiresAt && new Date() > token.expiresAt) {
        if (token.refreshToken) {
          try {
            const { refreshAccessToken } = require("./_core/gmail");
            const refreshResult = await refreshAccessToken(token.refreshToken);
            if (refreshResult) {
              // Update the token in database
              await db.updateGmailAccessToken(ctx.user.id, refreshResult.accessToken, refreshResult.expiresAt);
              return {
                connected: true,
                email: token.gmailEmail,
              };
            } else {
              // Token refresh failed - connection is invalid
              return {
                connected: false,
                email: null,
              };
            }
          } catch (error) {
            console.error("[Gmail] Error refreshing token in getStatus:", error);
            return {
              connected: false,
              email: null,
            };
          }
        } else {
          // No refresh token available - connection is invalid
          return {
            connected: false,
            email: null,
          };
        }
      }

      // Token is valid
      return {
        connected: true,
        email: token.gmailEmail,
      };
    }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteGmailToken(ctx.user.id);
      return { success: true };
    }),
  }),

  // Email History Router
  emailHistory: router({
    getByReport: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(({ input }) => db.getEmailHistory(input.reportId)),
    getUserHistory: protectedProcedure.query(({ ctx }) =>
      db.getUserEmailHistory(ctx.user.id)
    ),
    sendReport: protectedProcedure
      .input(
        z.object({
          reportId: z.number(),
          recipients: z.array(z.string().email()),
          subject: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Check if Gmail is connected
          const gmailToken = await db.getGmailToken(ctx.user.id);
          if (!gmailToken) {
            throw new Error("Gmail account not connected. Please connect your Gmail account in your profile.");
          }

          // Fetch the report details
          const reports = await db.getUserDailyReports(ctx.user.id);
          const report = reports.find(r => r.id === input.reportId);
          if (!report) {
            throw new Error("Report not found");
          }

          // Compose email content with HTML formatting
          const reportDate = new Date(report.reportDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
          
          const emailBody = `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #500151; border-bottom: 2px solid #500151; padding-bottom: 10px;">
                    Today's Task Update ${reportDate} - ${ctx.user.name}
                  </h2>
                  
                  <p>Hello there,</p>
                  
                  <p>Today we have completed the following tasks:</p>
                  
                  <div style="background-color: #f9f7fc; padding: 15px; border-left: 4px solid #500151; margin: 15px 0;">
                    <p><strong>Task Summary:</strong></p>
                    <p style="white-space: pre-wrap; margin: 10px 0;">${report.tasksCompleted}</p>
                  </div>
                  
                  ${report.hoursWorked ? `
                  <div style="margin: 15px 0;">
                    <p><strong>Hours Worked:</strong> ${report.hoursWorked}</p>
                  </div>
                  ` : ''}
                  
                  ${report.notes ? `
                  <div style="margin: 15px 0;">
                    <p><strong>Notes:</strong></p>
                    <p style="white-space: pre-wrap; margin: 10px 0;">${report.notes}</p>
                  </div>
                  ` : ''}
                  
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="font-size: 12px; color: #666; text-align: center;">
                    Sent via DSZ Workspace
                  </p>
                </div>
              </body>
            </html>
          `.trim();

          // Send via Gmail API
          const { sendEmailViaGmail, refreshAccessToken } = require("./_core/gmail");
          
          // Check if token needs refresh
          let accessToken = gmailToken.accessToken;
          if (gmailToken.expiresAt && new Date() > gmailToken.expiresAt) {
            // Token has expired, try to refresh it
            if (gmailToken.refreshToken) {
              const refreshResult = await refreshAccessToken(gmailToken.refreshToken);
              if (refreshResult) {
                accessToken = refreshResult.accessToken;
                // Update the token in database
                await db.updateGmailAccessToken(ctx.user.id, refreshResult.accessToken, refreshResult.expiresAt);
              } else {
                throw new Error("Gmail token expired and could not be refreshed. Please reconnect your Gmail account.");
              }
            } else {
              throw new Error("Gmail token expired and no refresh token available. Please reconnect your Gmail account.");
            }
          }

          // Send the email
          const result = await sendEmailViaGmail(
            accessToken,
            input.recipients,
            input.subject,
            emailBody
          );

          // Log to email history
          if (result.success) {
            await db.createEmailHistory(
              input.reportId,
              ctx.user.id,
              input.recipients,
              input.subject,
              "sent"
            );
            return { success: true, message: "Email sent successfully" };
          } else {
            await db.createEmailHistory(
              input.reportId,
              ctx.user.id,
              input.recipients,
              input.subject,
              "failed",
              result.error || "Unknown error"
            );
            throw new Error(result.error || "Failed to send email");
          }
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to send report',
          });
        }
      }),
  }),

  // Email Recipients Router
  emailRecipients: router({
    getAll: protectedProcedure.query(({ ctx }) =>
      db.getEmailRecipients(ctx.user.id)
    ),
    add: protectedProcedure
      .input(z.object({ email: z.string().email(), name: z.string().optional() }))
      .mutation(({ ctx, input }) =>
        db.addEmailRecipient(ctx.user.id, input.name || input.email, input.email)
      ),
    delete: protectedProcedure
      .input(z.object({ recipientId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEmailRecipient(ctx.user.id, input.recipientId);
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({ recipientId: z.number(), name: z.string(), email: z.string().email() }))
      .mutation(({ ctx, input }) =>
        db.updateEmailRecipient(input.recipientId, input.name, input.email, ctx.user.id)
      ),
    markFrequent: protectedProcedure
      .input(z.object({ recipientId: z.number() }))
      .mutation(({ ctx, input }) =>
        db.markRecipientAsFrequent(input.recipientId, true, ctx.user.id)
      ),
  }),

  // Team Management Router
  teams: router({
    create: adminProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional(), teamLeaderId: z.number() }))
      .mutation(async ({ ctx, input }: any) => {
        return db.createTeam({ name: input.name, description: input.description || '', teamLeaderId: input.teamLeaderId, createdBy: ctx.user.id });
      }),

    update: adminProcedure
      .input(z.object({ teamId: z.number(), name: z.string().min(1).optional(), description: z.string().optional(), teamLeaderId: z.number().optional() }))
      .mutation(async ({ ctx, input }: any) => {
        return db.updateTeam(input.teamId, { name: input.name, description: input.description, teamLeaderId: input.teamLeaderId });
      }),

    delete: adminProcedure
      .input(z.object({ teamId: z.number() }))
      .mutation(async ({ ctx, input }: any) => {
        return db.deleteTeam(input.teamId);
      }),

    assignLeader: adminProcedure
      .input(z.object({ teamId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }: any) => {
        return db.updateTeam(input.teamId, { teamLeaderId: input.userId });
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      if ((ctx.user.role === 'admin' || ctx.user.role === 'super_admin')) {
        return db.getAllTeams();
      }
      return db.getUserTeams(ctx.user.id);
    }),

    getAllEmployees: protectedProcedure.query(async ({ ctx }) => {
      return db.getAllEmployees();
    }),

    getById: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const team = await db.getTeam(input.teamId);
        if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
        if ((ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') && ctx.user.id !== team.teamLeaderId && ctx.user.id !== team.createdBy) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return team;
      }),

    getMembers: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const team = await db.getTeam(input.teamId);
        if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
        if ((ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') && ctx.user.id !== team.teamLeaderId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.getTeamMembers(input.teamId);
      }),

    getAllEmployeesForLeaderSelection: protectedProcedure.query(async ({ ctx }) => {
      return db.getAllEmployees();
    }),

    getEligibleMembers: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const team = await db.getTeam(input.teamId);
        if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
        if ((ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') && ctx.user.id !== team.teamLeaderId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const allEmployees = await db.getAllEmployees();
        const teamMembers = await db.getTeamMembers(input.teamId);
        const memberIds = teamMembers.map((m: any) => m.userId);
        return allEmployees.filter((emp: any) => !memberIds.includes(emp.id));
      }),

    getReports: protectedProcedure
      .input(z.object({ teamId: z.number(), startDate: z.date().optional(), endDate: z.date().optional(), userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const team = await db.getTeam(input.teamId);
        if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
        if ((ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') && ctx.user.id !== team.teamLeaderId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.getTeamReports(input.teamId, { startDate: input.startDate, endDate: input.endDate, userId: input.userId });
      }),

    addMember: protectedProcedure
      .input(z.object({ teamId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const team = await db.getTeam(input.teamId);
        if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
        if ((ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') && ctx.user.id !== team.teamLeaderId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.addTeamMember(input.teamId, input.userId);
      }),

    removeMember: protectedProcedure
      .input(z.object({ teamId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const team = await db.getTeam(input.teamId);
        if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
        if ((ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') && ctx.user.id !== team.teamLeaderId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.removeTeamMember(input.teamId, input.userId);
      }),

    submitReport: protectedProcedure
      .input(z.object({ teamId: z.number(), reportId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const team = await db.getTeam(input.teamId);
        if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
        const members = await db.getUserTeamMemberships(ctx.user.id);
        const isMember = members.some(m => m.teamId === input.teamId);
        if ((ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') && !isMember && ctx.user.id !== team.teamLeaderId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.addTeamReport(input.teamId, input.reportId);
      }),

    getTaskReports: protectedProcedure
      .input(z.object({
        teamId: z.number().optional(),
        userId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        searchQuery: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if ((ctx.user.role === 'admin' || ctx.user.role === 'super_admin')) {
          return db.getTaskReportsForAdmin({
            teamId: input.teamId,
            userId: input.userId,
            startDate: input.startDate,
            endDate: input.endDate,
            searchQuery: input.searchQuery,
          });
        } else {
          return db.getTaskReportsForTeamLeader(ctx.user.id, {
            teamId: input.teamId,
            userId: input.userId,
            startDate: input.startDate,
            endDate: input.endDate,
            searchQuery: input.searchQuery,
          });
        }
      }),
  }),

  // Role Management Router (Super Admin only)
  roles: router({
    changeUserRole: superAdminProcedure
      .input(
        z.object({
          userId: z.number(),
          newRole: z.enum(['super_admin', 'admin', 'team_leader', 'employee']),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.changeUserRole(
          input.userId,
          input.newRole,
          ctx.user.id,
          input.reason
        );
      }),

    getAuditLog: superAdminProcedure
      .input(
        z.object({
          limit: z.number().max(500).default(100),
        })
      )
      .query(({ input }) => db.getRoleAuditLog(input.limit)),

    getUserRole: superAdminProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getUserRole(input.userId)),
  }),

  users: router({
    changeRole: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          newRole: z.enum(["super_admin", "admin", "team_leader", "employee"]),
        })
      )
      .mutation(({ input, ctx }) => db.changeUserRole(
        input.userId,
        input.newRole as 'super_admin' | 'admin' | 'team_leader' | 'employee',
        ctx.user.id
      )),

    getAvailableRoles: protectedProcedure
      .query(({ ctx }) => {
        if (ctx.user.role === "super_admin") {
          return ["super_admin", "admin", "team_leader", "employee"];
        }
        if (ctx.user.role === "admin") {
          return ["team_leader", "employee"];
        }
        return [];
      }),
  }),

  permissions: router({
    getAll: superAdminProcedure.query(() => db.getAllPermissions()),

    getRolePermissions: superAdminProcedure
      .input(z.object({ role: z.string() }))
      .query(({ input }) => db.getRolePermissions(input.role)),

    updateRolePermission: superAdminProcedure
      .input(
        z.object({
          role: z.string(),
          permissionId: z.number(),
          granted: z.boolean(),
          reason: z.string().optional(),
        })
      )
      .mutation(({ input, ctx }) => db.updateRolePermission({
        role: input.role,
        permissionId: input.permissionId,
        granted: input.granted,
        changedBy: ctx.user.id,
        reason: input.reason,
      })),

    getAuditLog: superAdminProcedure
      .input(
        z.object({
          limit: z.number().max(500).default(100),
          role: z.string().optional(),
        })
      )
      .query(({ input }) => db.getPermissionAuditLog(input.limit, input.role)),
  }),
});

export type AppRouter = typeof appRouter;
