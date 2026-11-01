import { PageHeader } from "../../portal/PageHeader";
import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "../../portal/Button";

export function NotAuthorized() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <ShieldAlert className="h-10 w-10 text-gray-400 mb-3" />
      <PageHeader section="Access" title="You don't have access to this page" description="Your account role doesn't include this section." />
      <Button asChild variant="outline" className="mt-4"><Link to="/portal/dashboard">Back to Dashboard</Link></Button>
    </div>
  );
}
