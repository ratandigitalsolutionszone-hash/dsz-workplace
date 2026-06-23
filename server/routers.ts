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
          hoursWorked: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createDailyReport({
          userId: ctx.user.id,
          reportDate: input.reportDate,
          tasksCompleted: input.tasksCompleted,
          hoursWorked: input.hoursWorked ? String(input.hoursWorked) : undefined,
          notes: input.notes,
        })
      ),
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserDailyReports(ctx.user.id)
    ),
  }),

  // Company Notices Router
  notices: router({
    list: protectedProcedure.query(() => db.getAllCompanyNotices()),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          content: z.string(),
          isPinned: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createCompanyNotice({
          authorId: ctx.user.id,
          title: input.title,
          content: input.content,
          isPinned: input.isPinned || false,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ noticeId: z.number() }))
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.deleteCompanyNotice(input.noticeId);
      }),
  }),

  // Meetings Router
  meetings: router({
    list: protectedProcedure.query(() => db.getAllMeetings()),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          startTime: z.date(),
          endTime: z.date(),
          location: z.string().optional(),
          attendees: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createMeeting({
          createdById: ctx.user.id,
          title: input.title,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          attendees: input.attendees,
        })
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
      .mutation(({ ctx, input }) => {
        const { meetingId, ...updateData } = input;
        return db.updateMeeting(meetingId, updateData);
      }),
    delete: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .mutation(({ ctx, input }) => db.deleteMeeting(input.meetingId)),
  }),

  // Employee Directory Router
  directory: router({
    list: protectedProcedure.query(() => db.getAllEmployeeProfiles()),
    getById: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getEmployeeProfileById(input.userId)),
  }),

  // Admin Reports Monitoring Router
  adminReports: router({
    listAll: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getAllEmployeeReports();
    }),
    getByEmployee: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getEmployeeReportsByUserId(input.userId);
      }),
    stats: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getReportStats();
    }),
  }),

  // Client Tasks Router
  tasks: router({
    list: protectedProcedure.query(() => db.getAllClientTasks()),
    create: protectedProcedure
      .input(
        z.object({
          clientName: z.string(),
          title: z.string(),
          description: z.string().optional(),
          assignedToId: z.number().optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          dueDate: z.date().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createClientTask({
          createdById: ctx.user.id,
          clientName: input.clientName,
          title: input.title,
          description: input.description,
          assignedToId: input.assignedToId,
          priority: input.priority || "medium",
          dueDate: input.dueDate,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          assignedToId: z.number().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        const { taskId, ...updateData } = input;
        return db.updateClientTask(taskId, updateData);
      }),
    delete: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(({ ctx, input }) => db.deleteClientTask(input.taskId)),
  }),

  // Email Recipients Router
  emailRecipients: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getEmailRecipients(ctx.user.id)
    ),
    add: protectedProcedure
      .input(
        z.object({
          recipientName: z.string(),
          recipientEmail: z.string().email(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.addEmailRecipient(ctx.user.id, input.recipientName, input.recipientEmail)
      ),
    update: protectedProcedure
      .input(
        z.object({
          recipientId: z.number(),
          recipientName: z.string(),
          recipientEmail: z.string().email(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.updateEmailRecipient(input.recipientId, input.recipientName, input.recipientEmail, ctx.user.id)
      ),
    delete: protectedProcedure
      .input(z.object({ recipientId: z.number() }))
      .mutation(({ ctx, input }) => db.deleteEmailRecipient(input.recipientId, ctx.user.id)),
    markFrequent: protectedProcedure
      .input(z.object({ recipientId: z.number(), isFrequent: z.boolean() }))
      .mutation(({ ctx, input }) =>
        db.markRecipientAsFrequent(input.recipientId, input.isFrequent, ctx.user.id)
      ),
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
          // Create email history entry
          await db.createEmailHistory(
            input.reportId,
            ctx.user.id,
            input.recipients,
            input.subject,
            "sent"
          );
          return { success: true, message: "Report sent successfully" };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to send report";
          await db.createEmailHistory(
            input.reportId,
            ctx.user.id,
            input.recipients,
            input.subject,
            "failed",
            errorMessage
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage,
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
