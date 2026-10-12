import { toast } from "sonner";
import { Bell, AlertTriangle } from "lucide-react";
import { usePortalData } from "../../portal/data";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../portal/Button";

export function Notifications() {
  const { notifications, markNotificationRead, delayAlerts } = usePortalData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-8 tracking-tight text-gray-900">Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">Delay alerts and system messages.</p>
      </div>

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
            <p className="text-sm text-gray-500">No other notifications.</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className={`flex flex-wrap items-start justify-between gap-3 py-2 ${n.isRead ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3 text-sm">
                <Bell className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-800">{n.message}</span>
              </div>
              {!n.isRead && (
                <Button onClick={() => void markNotificationRead(n.id).catch(error => toast.error(error.message))}>
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
