import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

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
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createCompanyNotice({ ...input, authorId: ctx.user.id });
      }),
    delete: protectedProcedure
      .input(z.object({ noticeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
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
  }),

  // Admin Reports Monitor Router
  adminReports: router({
    getAllReports: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getAllEmployeeReports();
    }),
    getReportsByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
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
      return {
        connected: !!token,
        email: token?.gmailEmail || null,
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
          
          const sendResult = await sendEmailViaGmail(
            accessToken,
            input.recipients,
            input.subject,
            emailBody
          );

          // Check if email was actually sent
          if (!sendResult.success) {
            throw new Error(`Gmail API error: ${sendResult.error}`);
          }

          // Create successful email history entry only after confirmed delivery
          await db.createEmailHistory(
            input.reportId,
            ctx.user.id,
            input.recipients,
            input.subject,
            "sent"
          );
          return { success: true, message: "Report sent successfully via Gmail" };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to send report";
          
          // Create failed email history entry
          try {
            await db.createEmailHistory(
              input.reportId,
              ctx.user.id,
              input.recipients,
              input.subject,
              "failed",
              errorMessage
            );
          } catch (historyError) {
            console.error("Failed to create error history entry:", historyError);
          }
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage,
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
});

export type AppRouter = typeof appRouter;
