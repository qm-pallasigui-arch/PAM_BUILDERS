import { PageHeader } from "../../portal/PageHeader";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { ContentState } from "../../portal/ContentState";
import { Bell, AlertTriangle } from "lucide-react";
import { usePortalData } from "../../portal/data";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../portal/Button";

export function Notifications() {
  const { notifications, markNotificationRead, delayAlerts } = usePortalData();
  const [pending, setPending] = useState<number | null>(null);
  const lock = useRef(false);
  const markRead = async (id: number) => {
    if (lock.current) return;
    lock.current = true; setPending(id);
    try { await markNotificationRead(id); toast.success('Notification marked read.'); }
    catch (error) { toast.error((error as Error).message); }
    finally { lock.current = false; setPending(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader section="Activity" title="Notifications" description="Review delay alerts and system messages." />

      {delayAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardContent className="pt-6 space-y-3">
            {delayAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-gray-800">{a.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-3">
          {notifications.length === 0 && (
            <ContentState title={delayAlerts.length ? 'No other notifications' : 'You are all caught up'} description="New system messages will appear here. Delay alerts are shown separately when deadlines pass." />
          )}
          {notifications.map((n) => (
            <div key={n.id} className={`flex flex-wrap items-start justify-between gap-3 py-2 ${n.isRead ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3 text-sm">
                <Bell className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-800">{n.message}</span>
              </div>
              {!n.isRead && (
                <Button disabled={pending !== null} loading={pending === n.id} loadingLabel="Marking read..." onClick={() => void markRead(n.id)}>
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
