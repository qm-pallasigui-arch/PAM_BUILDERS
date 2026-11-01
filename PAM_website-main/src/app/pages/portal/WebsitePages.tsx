import { PageHeader } from "../../portal/PageHeader";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router";
import { api } from "../../portal/api";
import {
  useWebsiteContent,
  uploadContentAsset,
  type Leader,
  type ContactCardData,
} from "../../portal/content";
import {
  LeadershipCard,
  ContactInfoCard,
  RegistrationCard,
  phoneHref,
} from "../../components/ContentCards";
import { Button } from "../../portal/Button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
function move<T>(items: T[], index: number, direction: number) {
  const next = [...items];
  const target = index + direction;
  if (target >= 0 && target < next.length)
    [next[index], next[target]] = [next[target], next[index]];
  return next;
}
export function WebsitePages({ page }: { page: "about" | "contact" }) {
  const { content, setContent, loading, error } = useWebsiteContent(true);
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);
  const [leader, setLeader] = useState<Leader | null>(null),
    [card, setCard] = useState<ContactCardData | null>(null);
  const [birOpen, setBirOpen] = useState(false);
  const update: typeof setContent = (value) => {
    setDirty(true);
    setContent(value);
  };
  const save = async () => {
    if (busy) return;
    const projectTypes = content.contact.projectTypes
      .map((type) => type.trim())
      .filter(Boolean);
    if (!projectTypes.length) {
      toast.error("Add at least one project type.");
      return;
    }
    const next = { ...content, contact: { ...content.contact, projectTypes } };
    setBusy(true);
    try {
      await api("content", "PUT", next);
      setContent(next);
      setDirty(false);
      toast.success("Website content saved.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const controls = (
    index: number,
    total: number,
    onEdit: () => void,
    onMove: (step: number) => void,
    onDelete: () => void,
  ) => (
    <div className="space-y-3">
      <Button className="w-full" variant="outline" onClick={onEdit}>
        Edit card
      </Button>
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          aria-label="Move card earlier"
        >
          Move up
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          aria-label="Move card later"
        >
          Move down
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-700"
          onClick={() => {
            if (
              window.confirm(
                "Remove this card? Save changes to update the public page.",
              )
            )
              onDelete();
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
  const upload = async (file: File | undefined, portrait = false) => {
    if (!file) return;
    if (portrait && !file.type.startsWith("image/")) {
      toast.error("Choose an image for the leadership photo.");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadContentAsset(file);
      if (portrait) setLeader((l) => (l ? { ...l, image: url } : l));
      else update((c) => ({ ...c, birUrl: url }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <p>Loading website content...</p>;
  if (error) return <p role="alert">{error}</p>;
  return (
    <div className="space-y-8">
      <PageHeader section="Website content" title={page === "about" ? "About page" : "Contact page"} description="Preview your public cards below. Changes appear on the website after saving." actions={<><Button asChild variant="outline"><Link to={`/${page}`}>View public page</Link></Button><Button disabled={busy || !dirty} onClick={save}>{busy ? "Saving..." : "Save changes"}</Button></>}>
        <p className="mt-2 text-sm text-orange-800" role="status">{dirty ? "Unsaved changes" : "All changes saved"}</p>
      </PageHeader>
      <fieldset disabled={busy} className="min-w-0 space-y-8">
        {page === "about" ? (
          <>
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Our Leadership Team</h2>
                  <p className="text-gray-500">
                    Add a card for each team member. Use Move up/down to set the
                    display order.
                  </p>
                </div>
                <Button
                  onClick={() =>
                    setLeader({
                      id: crypto.randomUUID(),
                      name: "",
                      role: "",
                      experience: "",
                      image: "",
                    })
                  }
                >
                  Add team member
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                {content.leadership.map((member, i) => (
                  <div className="w-full max-w-sm" key={member.id}>
                    <LeadershipCard
                      member={member}
                      footer={controls(
                        i,
                        content.leadership.length,
                        () => setLeader({ ...member }),
                        (step) =>
                          update((c) => ({
                            ...c,
                            leadership: move(c.leadership, i, step),
                          })),
                        () =>
                          update((c) => ({
                            ...c,
                            leadership: c.leadership.filter(
                              (l) => l.id !== member.id,
                            ),
                          })),
                      )}
                    />
                  </div>
                ))}
              </div>
              {!content.leadership.length && (
                <p className="rounded-xl border border-dashed p-10 text-center">
                  No team members yet. Add a card to display the leadership
                  section.
                </p>
              )}
            </section>
            <section className="mx-auto max-w-3xl space-y-4">
              <RegistrationCard url={content.birUrl} />
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setBirOpen(true)}
              >
                Edit registration document
              </Button>
            </section>
          </>
        ) : (
          <>
            <section className="rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 p-8 text-center text-white">
              <h2 className="text-3xl">{content.contact.title}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-orange-100">
                {content.contact.intro}
              </p>
            </section>
            <details className="rounded-xl border bg-white p-6">
              <summary className="cursor-pointer text-lg font-semibold">
                Edit page heading and contact form
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                  Page title
                  <Input
                    value={content.contact.title}
                    onChange={(e) =>
                      update((c) => ({
                        ...c,
                        contact: { ...c.contact, title: e.target.value },
                      }))
                    }
                  />
                </label>
                <label>
                  Form heading
                  <Input
                    value={content.contact.formTitle}
                    onChange={(e) =>
                      update((c) => ({
                        ...c,
                        contact: { ...c.contact, formTitle: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="sm:col-span-2">
                  Introduction
                  <Textarea
                    value={content.contact.intro}
                    onChange={(e) =>
                      update((c) => ({
                        ...c,
                        contact: { ...c.contact, intro: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="sm:col-span-2">
                  Project types (one per line)
                  <Textarea
                    rows={5}
                    value={content.contact.projectTypes.join("\n")}
                    onChange={(e) =>
                      update((c) => ({
                        ...c,
                        contact: {
                          ...c.contact,
                          projectTypes: e.target.value.split("\n"),
                        },
                      }))
                    }
                  />
                </label>
                <p className="text-sm text-gray-500 sm:col-span-2">
                  The form's email delivery settings are managed separately from
                  these public contact details.
                </p>
              </div>
            </details>
            <section className="space-y-4">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-xl font-semibold">
                  Contact information cards
                </h2>
                <Button
                  onClick={() =>
                    setCard({
                      id: crypto.randomUUID(),
                      kind: "text",
                      title: "",
                      lines: [""],
                      note: "",
                    })
                  }
                >
                  Add contact card
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {content.contact.cards.map((item, i) => (
                  <ContactInfoCard
                    key={item.id}
                    card={item}
                    footer={controls(
                      i,
                      content.contact.cards.length,
                      () => setCard({ ...item, lines: [...item.lines] }),
                      (step) =>
                        update((c) => ({
                          ...c,
                          contact: {
                            ...c.contact,
                            cards: move(c.contact.cards, i, step),
                          },
                        })),
                      () =>
                        update((c) => ({
                          ...c,
                          contact: {
                            ...c.contact,
                            cards: c.contact.cards.filter(
                              (x) => x.id !== item.id,
                            ),
                          },
                        })),
                    )}
                  />
                ))}
              </div>
              {!content.contact.cards.length && (
                <p>No contact cards yet. Add one to get started.</p>
              )}
            </section>
            <section className="rounded-xl border bg-white p-6 space-y-4">
              <h2 className="text-xl font-semibold">
                Emergency contact section
              </h2>
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={content.contact.emergency.enabled}
                  onChange={(e) =>
                    update((c) => ({
                      ...c,
                      contact: {
                        ...c.contact,
                        emergency: {
                          ...c.contact.emergency,
                          enabled: e.target.checked,
                        },
                      },
                    }))
                  }
                />
                Show this section on the Contact page
              </label>
              {(["title", "description", "phone"] as const).map((key) => (
                <label className="block capitalize" key={key}>
                  {key}
                  <Input
                    value={content.contact.emergency[key]}
                    onChange={(e) =>
                      update((c) => ({
                        ...c,
                        contact: {
                          ...c.contact,
                          emergency: {
                            ...c.contact.emergency,
                            [key]: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </label>
              ))}
              {content.contact.emergency.enabled && (
                <div className="rounded-lg bg-orange-600 p-6 text-center text-white">
                  <h3 className="text-xl">{content.contact.emergency.title}</h3>
                  <p className="mt-2">
                    {content.contact.emergency.description}
                  </p>
                  <a
                    className="mt-4 inline-block rounded bg-white px-4 py-2 text-orange-700"
                    href={phoneHref(content.contact.emergency.phone)}
                  >
                    {content.contact.emergency.phone}
                  </a>
                </div>
              )}
            </section>
          </>
        )}
      </fieldset>
      <Dialog
        open={!!leader}
        onOpenChange={(open) => {
          if (!open && !busy) setLeader(null);
        }}
      >
        {leader && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {content.leadership.some((l) => l.id === leader.id)
                  ? "Edit team member"
                  : "Add team member"}
              </DialogTitle>
              <DialogDescription>
                Update this card, then save changes to publish it.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                update((c) => ({
                  ...c,
                  leadership: c.leadership.some((l) => l.id === leader.id)
                    ? c.leadership.map((l) => (l.id === leader.id ? leader : l))
                    : [...c.leadership, leader],
                }));
                setLeader(null);
              }}
            >
              <fieldset disabled={busy} className="space-y-4">
                {(["name", "role", "experience"] as const).map((key) => (
                  <label className="block capitalize" key={key}>
                    {key}
                    <Input
                      required={key !== "experience"}
                      value={leader[key]}
                      onChange={(e) =>
                        setLeader({ ...leader, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <label className="block">
                  Photo (optional, up to 2 MB)
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => void upload(e.target.files?.[0], true)}
                  />
                </label>
                {leader.image && (
                  <div className="flex items-center gap-4">
                    <img
                      src={leader.image}
                      alt="Team member preview"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLeader({ ...leader, image: "" })}
                    >
                      Remove photo
                    </Button>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLeader(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Apply card</Button>
                </div>
              </fieldset>
            </form>
          </DialogContent>
        )}
      </Dialog>
      <Dialog
        open={!!card}
        onOpenChange={(open) => {
          if (!open && !busy) setCard(null);
        }}
      >
        {card && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit contact card</DialogTitle>
              <DialogDescription>
                One phone number, email, address line or hours entry per line.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const cleaned = {
                  ...card,
                  lines: card.lines.map((l) => l.trim()).filter(Boolean),
                };
                if (!cleaned.lines.length) {
                  toast.error("Add at least one line.");
                  return;
                }
                if (
                  cleaned.kind === "email" &&
                  cleaned.lines.some(
                    (line) => !z.string().email().safeParse(line).success,
                  )
                ) {
                  toast.error("Enter a valid email address on each line.");
                  return;
                }
                if (
                  cleaned.kind === "phone" &&
                  cleaned.lines.some(
                    (line) => !/^\+?[0-9 ()-]{7,30}$/.test(line),
                  )
                ) {
                  toast.error("Enter a valid phone number on each line.");
                  return;
                }
                update((c) => ({
                  ...c,
                  contact: {
                    ...c.contact,
                    cards: c.contact.cards.some((x) => x.id === card.id)
                      ? c.contact.cards.map((x) =>
                          x.id === card.id ? cleaned : x,
                        )
                      : [...c.contact.cards, cleaned],
                  },
                }));
                setCard(null);
              }}
            >
              <label className="block">
                Card type
                <select
                  className="block w-full rounded border p-2"
                  value={card.kind}
                  onChange={(e) =>
                    setCard({
                      ...card,
                      kind: e.target.value as ContactCardData["kind"],
                    })
                  }
                >
                  {["phone", "email", "address", "hours", "text"].map(
                    (kind) => (
                      <option key={kind}>{kind}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="block">
                Title
                <Input
                  required
                  value={card.title}
                  onChange={(e) => setCard({ ...card, title: e.target.value })}
                />
              </label>
              <label className="block">
                Information
                <Textarea
                  required
                  rows={5}
                  value={card.lines.join("\n")}
                  onChange={(e) =>
                    setCard({ ...card, lines: e.target.value.split("\n") })
                  }
                />
              </label>
              <label className="block">
                Supporting note
                <Textarea
                  value={card.note}
                  onChange={(e) => setCard({ ...card, note: e.target.value })}
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCard(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Apply card</Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
      <Dialog
        open={birOpen}
        onOpenChange={(open) => {
          if (!busy) setBirOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>BIR registration</DialogTitle>
            <DialogDescription>
              Upload an image or PDF up to 2 MB, then save the page to publish.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Registration file"
            disabled={busy}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          {content.birUrl && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => update((c) => ({ ...c, birUrl: "" }))}
            >
              Remove document
            </Button>
          )}
          <Button disabled={busy} onClick={() => setBirOpen(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function WebsiteAbout() {
  return <WebsitePages page="about" />;
}
export function WebsiteContact() {
  return <WebsitePages page="contact" />;
}
