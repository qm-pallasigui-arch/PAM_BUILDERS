import type { ReactNode } from "react";
import type { WebsiteProject } from "../portal/content";
import { formatCurrency } from "../portal/utils";

export function WebsiteProjectCard({
  project,
  color,
  footer,
}: {
  project: WebsiteProject;
  color: string;
  footer?: ReactNode;
}) {
  return (
    <article
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm"
      style={{ borderTop: `5px solid ${color}` }}
    >
      {project.image ? (
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="h-64 w-full object-cover"
        />
      ) : (
        <div className="flex h-64 items-center justify-center bg-gray-100 text-gray-400">
          No cover image
        </div>
      )}
      <div className="flex-1 space-y-3 p-6">
        <p className="text-sm text-gray-500">{project.category}</p>
        <h2 className="break-words text-xl font-semibold text-gray-900">
          {project.title}
        </h2>
        <p className="whitespace-pre-line break-words text-gray-600">
          {project.description || "No description yet."}
        </p>
        {project.details && (
          <dl className="grid grid-cols-3 gap-3 border-t pt-3 text-sm">
            {(["year", "duration", "size"] as const).map(
              (key) =>
                project.details?.[key] && (
                  <div key={key}>
                    <dt className="capitalize text-gray-500">{key}</dt>
                    <dd className="break-words font-medium text-gray-800">
                      {project.details[key]}
                    </dd>
                  </div>
                ),
            )}
          </dl>
        )}
        <dl className="space-y-2 text-sm">
          {project.client && (
            <div>
              <dt className="text-gray-500">Client</dt>
              <dd className="font-medium">{project.client}</dd>
            </div>
          )}
          {project.location && (
            <div>
              <dt className="text-gray-500">Location</dt>
              <dd className="font-medium">{project.location}</dd>
            </div>
          )}
          {project.budget !== undefined && (
            <div>
              <dt className="text-gray-500">Budget</dt>
              <dd className="text-lg font-semibold">
                {formatCurrency(project.budget)}
              </dd>
            </div>
          )}
        </dl>
      </div>
      {footer && <div className="border-t bg-gray-50 px-6 py-4">{footer}</div>}
    </article>
  );
}
