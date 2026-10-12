import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "../../portal/Button";

export function NotAuthorized() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <ShieldAlert className="h-10 w-10 text-gray-400 mb-3" />
      <h1 className="text-xl font-semibold text-gray-900">You don't have access to this page</h1>
      <p className="text-gray-500 text-sm mt-1">Your account role doesn't include this section.</p>
      <Link to="/portal/dashboard" className="mt-4">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
