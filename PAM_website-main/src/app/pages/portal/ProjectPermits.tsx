import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Permit, Project } from "../../portal/types";
import { usePortalData } from "../../portal/data";
import { useAuth } from "../../portal/auth";
import { api } from "../../portal/api";
import { uploadContentAsset } from "../../portal/content";
import { Input } from "../../components/ui/input";
import { Button } from "../../portal/Button";
const newPermit = (name = ""): Permit => ({
  name,
  status: "pending",
  reference: "",
  issuedDate: "",
  expiryDate: "",
  attachment: "",
});
export function ProjectPermits({ project }: { project: Project }) {
  const { hasRole } = useAuth(),
    { updateProject } = usePortalData();
  const editable = hasRole("admin", "project_manager");
  const [permits, setPermits] = useState<Permit[]>(project.permits ?? []),
    [templates, setTemplates] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);
  useEffect(() => {
    setPermits(project.permits ?? []);
  }, [project.id, project.permits]);
  useEffect(() => {
    api<string[]>("permit-templates")
      .then(setTemplates)
      .catch(() => {});
  }, []);
  const change = (index: number, patch: Partial<Permit>) => {
    setDirty(true);
    setPermits((items) =>
      items.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  };
  const save = async () => {
    setBusy(true);
    try {
      await updateProject(project.id, { permits });
      setDirty(false);
      toast.success("Permits saved.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-xl border bg-white p-6 space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Permits - {permits.filter((p) => p.status === "approved").length}/
          {permits.length} approved
        </h2>
        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setPermits((p) => [...p, newPermit()]);
                setDirty(true);
              }}
            >
              Add permit
            </Button>
            <Button
              variant="outline"
              disabled={busy || !templates.length}
              onClick={() => {
                setPermits((p) => [
                  ...p,
                  ...templates
                    .filter((t) => !p.some((x) => x.name === t))
                    .map((t) => newPermit(t)),
                ]);
                setDirty(true);
              }}
            >
              Apply checklist
            </Button>
            <Button
              disabled={busy || !dirty || permits.some((p) => !p.name.trim())}
              onClick={save}
            >
              Save permits
            </Button>
          </div>
        )}
      </div>
      {!permits.length && (
        <p className="text-gray-500">No permits added yet.</p>
      )}
      {permits.map((p, i) => (
        <fieldset
          key={i}
          disabled={busy}
          className="rounded-lg border p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              Name
              <Input
                value={p.name}
                readOnly={!editable}
                onChange={(e) => change(i, { name: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                className="block w-full rounded border p-2"
                disabled={!editable}
                value={p.status}
                onChange={(e) =>
                  change(i, { status: e.target.value as Permit["status"] })
                }
              >
                {["pending", "submitted", "approved", "expired"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Reference number
              <Input
                value={p.reference}
                readOnly={!editable}
                onChange={(e) => change(i, { reference: e.target.value })}
              />
            </label>
            <label>
              Issued date
              <Input
                type="date"
                value={p.issuedDate}
                readOnly={!editable}
                onChange={(e) => change(i, { issuedDate: e.target.value })}
              />
            </label>
            <label>
              Expiry date
              <Input
                type="date"
                value={p.expiryDate}
                readOnly={!editable}
                onChange={(e) => change(i, { expiryDate: e.target.value })}
              />
            </label>
          </div>
          {p.attachment && (
            <a
              className="block text-orange-700 underline"
              href={p.attachment}
              target="_blank"
              rel="noreferrer"
            >
              View permit attachment
            </a>
          )}
          {editable && (
            <>
              <label className="block">
                Upload image or PDF (up to 2 MB)
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    try {
                      change(i, {
                        attachment: await uploadContentAsset(file, project.id),
                      });
                    } catch (e) {
                      toast.error((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
              <div className="flex gap-2">
                {p.attachment && (
                  <Button
                    variant="outline"
                    onClick={() => change(i, { attachment: "" })}
                  >
                    Remove attachment
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setPermits((p) => p.filter((_, j) => j !== i));
                    setDirty(true);
                  }}
                >
                  Remove permit
                </Button>
              </div>
            </>
          )}
        </fieldset>
      ))}
    </section>
  );
}
