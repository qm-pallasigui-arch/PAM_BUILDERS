import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { HardHat, AlertCircle } from "lucide-react";
import { useAuth } from "../../portal/auth";
import { Button } from "../../portal/Button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";

export function PortalLogin() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/portal/dashboard";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Unable to sign in.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <HardHat className="h-10 w-10 text-orange-500 mb-2" />
          <h1 className="text-white text-xl font-semibold">PAM Builders Portal</h1>
          <p className="text-gray-400 text-sm">Construction Project Tracking & Progress Monitoring</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Internal use only — PAM Builders staff and engineers.</CardDescription>
          </CardHeader>
          <CardContent>
            {import.meta.env.MODE === 'demo' && (
              <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-semibold">Demo mode — no database needed</p>
                <p className="mt-1">Sample data and changes reset when you reload. Use demo details only.</p>
                <p className="mt-2">Admin: admin@pambuilders.com / admin123</p>
                <p>Project Manager: pm@pambuilders.com / pm123</p>
                <p>Site Staff: site@pambuilders.com / site123</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>


          </CardContent>
        </Card>
        <Button asChild variant="outline" className="mt-6 w-full border-orange-500 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 hover:text-orange-100"><Link to="/">Back to PAM Builders website</Link></Button>
      </div>
    </div>
  );
}
