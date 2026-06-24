import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, X } from "lucide-react";
import EmailRecipientManager from "./EmailRecipientManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SendReportDialogProps {
  reportId: number;
  reportDate: string;
  tasksCompleted: string;
  hoursWorked?: number;
  notes?: string;
}

export default function SendReportDialog({
  reportId,
  reportDate,
  tasksCompleted,
  hoursWorked,
  notes,
}: SendReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState(`Daily Report - ${reportDate}`);
  const { data: emailHistory, refetch: refetchHistory } = trpc.emailHistory.getByReport.useQuery(
    { reportId },
    { enabled: isOpen }
  );

  const sendMutation = trpc.emailHistory.sendReport.useMutation({
    onSuccess: () => {
      toast.success("Report sent successfully to all recipients!");
      setSelectedRecipients([]);
      setSubject(`Daily Report - ${reportDate}`);
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send report");
    },
  });

  const handleSendReport = () => {
    if (selectedRecipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    sendMutation.mutate({
      reportId,
      recipients: selectedRecipients,
      subject,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Send className="w-4 h-4" />
          Send Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Daily Report</DialogTitle>
          <DialogDescription>
            Share your daily report with team members or managers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Preview */}
          <Card className="p-4 bg-gradient-to-r from-[#f5f0f7] to-[#f9f7fc] border-[#e8dff5]">
            <h4 className="font-semibold text-[#500151] mb-3">Report Summary</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-[#500151]">Date:</span>
                <span className="ml-2">{reportDate}</span>
              </div>
              <div>
                <span className="font-medium text-[#500151]">Tasks Completed:</span>
                <span className="ml-2">{tasksCompleted}</span>
              </div>
              {hoursWorked && (
                <div>
                  <span className="font-medium text-[#500151]">Hours Worked:</span>
                  <span className="ml-2">{hoursWorked}</span>
                </div>
              )}
              {notes && (
                <div>
                  <span className="font-medium text-[#500151]">Notes:</span>
                  <span className="ml-2">{notes}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Subject Line */}
          <div>
            <Label htmlFor="subject" className="text-[#500151] font-semibold">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Email Recipient Manager */}
          <EmailRecipientManager
            onRecipientSelected={(recipients) => setSelectedRecipients(recipients)}
          />

          {/* Email History */}
          {emailHistory && emailHistory.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Send History</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {emailHistory.map((history) => (
                  <div key={history.id} className="text-sm p-2 bg-white rounded border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{history.recipients.join(", ")}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        history.status === "sent" ? "bg-green-100 text-green-800" :
                        history.status === "failed" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {history.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Sent at: {new Date(history.sentAt).toLocaleString()}
                    </p>
                    {history.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">Error: {history.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSendReport}
              disabled={sendMutation.isPending || selectedRecipients.length === 0}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
              {sendMutation.isPending ? "Sending..." : "Send Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
