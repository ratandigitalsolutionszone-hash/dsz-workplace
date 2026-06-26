import { Request, Response } from "express";
import { sdk } from "./sdk";
import * as db from "../db";

export async function handleMeetingReminder(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    // Find meeting by scheduleCronTaskUid
    const meetings = await db.getAllMeetings();
    const meeting = meetings.find(m => m.scheduleCronTaskUid === user.taskUid);
    
    if (!meeting) {
      return res.json({ ok: true, skipped: "orphan" });
    }

    // Send notification to the meeting creator
    try {
      const { notifyOwner } = await import("./notification");
      await notifyOwner({
        title: `Meeting Reminder: ${meeting.title}`,
        content: `Your meeting "${meeting.title}" is starting soon${meeting.location ? ` at ${meeting.location}` : ""}.\n\nTime: ${new Date(meeting.startTime).toLocaleString()}`,
      });
    } catch (error) {
      console.error("Failed to send reminder notification:", error);
    }

    // Mark reminder as sent
    await db.updateMeeting(meeting.id, {
      reminderSent: true,
    });

    res.json({ ok: true, meetingId: meeting.id });
  } catch (error) {
    console.error("Meeting reminder handler error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, taskUid: req.body?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
