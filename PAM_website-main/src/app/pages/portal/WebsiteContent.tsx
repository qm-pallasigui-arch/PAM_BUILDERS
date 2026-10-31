import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../portal/api";
import {
  projectColor,
  useWebsiteContent,
  uploadContentAsset,
  type WebsiteProject,
} from "../../portal/content";
import { usePortalData } from "../../portal/data";
import { Button } from "../../portal/Button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { WebsiteProjectCard } from "../../components/WebsiteProjectCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
export function WebsiteContent({ about = false }: { about?: boolean }) {
  const { content, setContent, loading, error } = useWebsiteContent(true),
    { projects } = usePortalData();
  const [selected, setSelected] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [category, setCategory] = useState(""),
    [template, setTemplate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const visibleProjects = [...content.projects]
    .filter(
      (p) =>
        (!filterCategory || p.category === filterCategory) &&
        (!filterStatus ||
          (p.published ? "published" : "draft") === filterStatus) &&
        `${p.title} ${p.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.order - b.order);
  const current = content.projects.find((p) => p.id === selected);
  const patch = (changes: Partial<WebsiteProject>) =>
    setContent((c) => ({
      ...c,
      projects: c.projects.map((p) =>
        p.id === selected ? { ...p, ...changes } : p,
      ),
    }));
  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api("content", "PUT", content);
      toast.success("Website content saved.");
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file: File | undefined, bir = false) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadContentAsset(file);
      if (bir) setContent((c) => ({ ...c, birUrl: url }));
      else patch({ image: url });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <p>Loading website content...</p>;
  if (error) return <p role="alert">{error}</p>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {about ? "Website Content / About" : "Website Projects"}
          </h1>
          <p className="text-gray-500">
            Changes go live when you save. Draft projects stay private.
          </p>
        </div>
        <Button disabled={busy} onClick={save}>
          Save website content
        </Button>
      </div>
      {about ? (
        <section className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">BIR registration</h2>
          <p>
            {content.birUrl
              ? "Registration file ready."
              : "Placeholder: registration document to be uploaded."}
          </p>
          <label className="block">
            Upload registration image or PDF (up to 2 MB)
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={busy}
              onChange={(e) => void upload(e.target.files?.[0], true)}
            />
          </label>
          {content.birUrl && (
            <>
              <a
                className="text-orange-700 underline"
                href={content.birUrl}
                target="_blank"
                rel="noreferrer"
              >
                Preview document
              </a>
              <Button
                variant="outline"
                onClick={() => setContent((c) => ({ ...c, birUrl: "" }))}
              >
                Remove document
              </Button>
            </>
          )}
        </section>
      ) : (
        <>
          <div className="space-y-6">
            <section className="space-y-6">
              <Button
                disabled={busy}
                onClick={() => {
                  const id = crypto.randomUUID();
                  setContent((c) => ({
                    ...c,
                    projects: [
                      ...c.projects,
                      {
                        id,
                        title: "New project",
                        description: "",
                        image: "",
                        category: c.categories[0]?.name ?? "General",
                        color: null,
                        order: c.projects.length,
                        published: false,
                        linkedProjectId: null,
                        showClient: false,
                        showBudget: false,
                        showLocation: false,
                      },
                    ],
                  }));
                  setSelected(id);
                }}
              >
                Add website project
              </Button>
              <div className="grid gap-3 sm:grid-cols-3 rounded-xl border bg-white p-4">
                <label className="space-y-1 text-sm font-medium">
                  Search projects
                  <Input
                    placeholder="Search title or description"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Category
                  <select
                    className="block h-9 w-full rounded-md border px-3"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All categories</option>
                    {content.categories.map((c) => (
                      <option key={c.name}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Visibility
                  <select
                    className="block h-9 w-full rounded-md border px-3"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All projects</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>
              <p className="text-sm text-gray-500">
                {visibleProjects.length} of {content.projects.length} projects.
                Cards preview the information shown on the public website.
              </p>
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {visibleProjects.map((p) => {
                  const linked = projects.find(
                    (project) => project.id === p.linkedProjectId,
                  );
                  const preview = {
                    ...p,
                    client: p.showClient ? linked?.client : undefined,
                    location: p.showLocation ? linked?.location : undefined,
                    budget: p.showBudget ? linked?.budget : undefined,
                  };
                  return (
                    <WebsiteProjectCard
                      key={p.id}
                      project={preview}
                      color={projectColor(p, content)}
                      footer={
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                            >
                              {p.published ? "Published" : "Draft"}
                            </span>
                            <span className="text-xs text-gray-500">
                              Display order: {p.order}
                            </span>
                          </div>
                          <Button
                            className="w-full"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setSelected(p.id)}
                          >
                            Edit project
                          </Button>
                        </div>
                      }
                    />
                  );
                })}
              </div>
              {!visibleProjects.length && (
                <p className="rounded-xl border border-dashed p-10 text-center text-gray-500">
                  {content.projects.length
                    ? "No projects match these filters."
                    : "No portfolio projects yet. Add a project to get started."}
                </p>
              )}
            </section>
            <Dialog
              open={!!current}
              onOpenChange={(open) => {
                if (!open && !busy) setSelected(null);
              }}
            >
              {current && (
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit {current.title}</DialogTitle>
                    <DialogDescription>
                      Update the project below. Save website content to apply
                      your changes.
                    </DialogDescription>
                  </DialogHeader>
                  <fieldset disabled={busy} className="min-w-0 space-y-4">
                    <label className="block">
                      Title
                      <Input
                        value={current.title}
                        onChange={(e) => patch({ title: e.target.value })}
                      />
                    </label>
                    <label className="block">
                      Description
                      <Textarea
                        value={current.description}
                        onChange={(e) => patch({ description: e.target.value })}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["year", "duration", "size"] as const).map((key) => (
                        <label key={key} className="block capitalize">
                          {key}
                          <Input
                            value={current.details?.[key] ?? ""}
                            onChange={(e) =>
                              patch({
                                details: {
                                  year: "",
                                  duration: "",
                                  size: "",
                                  ...current.details,
                                  [key]: e.target.value,
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label className="block">
                      Cover image (up to 2 MB)
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        onChange={(e) => void upload(e.target.files?.[0])}
                      />
                    </label>
                    {current.image && (
                      <>
                        <img
                          src={current.image}
                          alt="Project cover preview"
                          className="h-40 rounded object-cover"
                        />
                        <Button
                          variant="outline"
                          onClick={() => patch({ image: "" })}
                        >
                          Remove image
                        </Button>
                      </>
                    )}
                    <label className="block">
                      Category
                      <select
                        className="block w-full rounded border p-2"
                        value={current.category}
                        onChange={(e) => patch({ category: e.target.value })}
                      >
                        {content.categories.map((c) => (
                          <option key={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={!current.color}
                        onChange={(e) =>
                          patch({ color: e.target.checked ? null : "#ea580c" })
                        }
                      />
                      Inherit category color
                    </label>
                    {current.color && (
                      <label className="block">
                        Project color
                        <Input
                          type="color"
                          value={current.color}
                          onChange={(e) => patch({ color: e.target.value })}
                        />
                      </label>
                    )}
                    <label className="block">
                      Display order
                      <Input
                        type="number"
                        value={current.order}
                        onChange={(e) =>
                          patch({ order: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={current.published}
                        onChange={(e) => patch({ published: e.target.checked })}
                      />
                      Published
                    </label>
                    <label className="block">
                      Optional internal project link
                      <select
                        className="block w-full rounded border p-2"
                        value={current.linkedProjectId ?? ""}
                        onChange={(e) =>
                          patch({
                            linkedProjectId: Number(e.target.value) || null,
                          })
                        }
                      >
                        <option value="">No linked project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {current.linkedProjectId && (
                      <fieldset className="rounded border p-3">
                        <legend>Publish linked information</legend>
                        {(
                          ["showClient", "showBudget", "showLocation"] as const
                        ).map((key) => (
                          <label key={key} className="flex gap-2">
                            <input
                              type="checkbox"
                              checked={current[key]}
                              onChange={(e) =>
                                patch({ [key]: e.target.checked })
                              }
                            />
                            {key.replace("show", "")}
                          </label>
                        ))}
                      </fieldset>
                    )}
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Delete this website project? Save to apply the deletion.",
                          )
                        ) {
                          setContent((c) => ({
                            ...c,
                            projects: c.projects.filter(
                              (p) => p.id !== selected,
                            ),
                          }));
                          setSelected(null);
                        }
                      }}
                    >
                      Delete website project
                    </Button>
                    <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setSelected(null)}
                      >
                        Back to projects
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={async () => {
                          if (await save()) setSelected(null);
                        }}
                      >
                        Save website content
                      </Button>
                    </div>
                  </fieldset>
                </DialogContent>
              )}
            </Dialog>
          </div>
          <section className="rounded-xl border bg-white p-6 space-y-3">
            <h2 className="text-lg font-semibold">Category colors</h2>
            {content.categories.map((c, i) => (
              <label className="flex items-center gap-4" key={c.name}>
                {c.name}
                <Input
                  className="w-20"
                  type="color"
                  value={c.color}
                  onChange={(e) =>
                    setContent((s) => ({
                      ...s,
                      categories: s.categories.map((x, j) =>
                        j === i ? { ...x, color: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </label>
            ))}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  category.trim() &&
                  !content.categories.some((c) => c.name === category.trim())
                ) {
                  setContent((c) => ({
                    ...c,
                    categories: [
                      ...c.categories,
                      { name: category.trim(), color: "#ea580c" },
                    ],
                  }));
                  setCategory("");
                }
              }}
            >
              <Input
                aria-label="New category"
                placeholder="New category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <Button type="submit">Add category</Button>
            </form>
          </section>
          <section className="rounded-xl border bg-white p-6 space-y-3">
            <h2 className="text-lg font-semibold">Reusable permit checklist</h2>
            <p>
              Apply these items from a project's Permits section. Existing
              project permits keep their own status and files.
            </p>
            {content.permitTemplates.map((t, i) => (
              <div className="flex justify-between" key={i}>
                {t}
                <Button
                  variant="outline"
                  onClick={() =>
                    setContent((c) => ({
                      ...c,
                      permitTemplates: c.permitTemplates.filter(
                        (_, j) => j !== i,
                      ),
                    }))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (template.trim()) {
                  setContent((c) => ({
                    ...c,
                    permitTemplates: [...c.permitTemplates, template.trim()],
                  }));
                  setTemplate("");
                }
              }}
            >
              <Input
                aria-label="Permit template name"
                placeholder="Permit name"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                required
              />
              <Button type="submit">Add permit template</Button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
