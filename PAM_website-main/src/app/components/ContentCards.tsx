import type { ReactNode } from "react";
import { Phone, Mail, MapPin, Clock, Info } from "lucide-react";
import type { Leader, ContactCardData } from "../portal/content";
export const phoneHref = (phone: string) =>
  `tel:${phone.replace(/[^+0-9]/g, "")}`;
export function LeadershipCard({
  member,
  footer,
}: {
  member: Leader;
  footer?: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex-1 p-6 text-center">
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            className="mx-auto mb-4 h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-3xl font-semibold text-white">
            {member.name
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")}
          </div>
        )}
        <h3 className="mb-1 break-words text-xl font-semibold">
          {member.name}
        </h3>
        <p className="mb-2 text-orange-600 font-medium">{member.role}</p>
        <p className="whitespace-pre-line text-sm text-gray-600">
          {member.experience}
        </p>
      </div>
      {footer && <div className="border-t bg-gray-50 p-4">{footer}</div>}
    </article>
  );
}
export function ContactInfoCard({
  card,
  footer,
}: {
  card: ContactCardData;
  footer?: ReactNode;
}) {
  const Icon = {
    phone: Phone,
    email: Mail,
    address: MapPin,
    hours: Clock,
    text: Info,
  }[card.kind];
  return (
    <article className="flex min-w-0 flex-col rounded-xl border bg-white shadow-sm">
      <div className="flex flex-1 items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          <h3 className="mb-2 break-words font-semibold">{card.title}</h3>
          <div className="space-y-1 text-gray-600">
            {card.lines.map((line, i) =>
              card.kind === "phone" ? (
                <a
                  className="block break-words hover:text-orange-600"
                  key={i}
                  href={phoneHref(line)}
                >
                  {line}
                </a>
              ) : card.kind === "email" ? (
                <a
                  className="block hover:text-orange-600"
                  key={i}
                  href={`mailto:${line}`}
                >
                  {line}
                </a>
              ) : (
                <p className="whitespace-pre-line break-words" key={i}>
                  {line}
                </p>
              ),
            )}
          </div>
          {card.note && (
            <p className="mt-2 whitespace-pre-line text-sm text-gray-500">
              {card.note}
            </p>
          )}
        </div>
      </div>
      {footer && <div className="border-t bg-gray-50 p-4">{footer}</div>}
    </article>
  );
}
export function RegistrationCard({ url }: { url: string }) {
  return (
    <div className="rounded-xl border bg-white p-8 text-center">
      <h2 className="mb-4 text-2xl font-semibold">BIR Registration</h2>
      {url ? (
        <a
          className="text-orange-700 underline"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          View BIR registration document
        </a>
      ) : (
        <div className="rounded-lg border border-dashed bg-gray-50 p-8 text-gray-500">
          Registration document to be uploaded.
        </div>
      )}
    </div>
  );
}
