import { useState } from "react";
import { useWebsiteContent, projectColor } from "../portal/content";
import { WebsiteProjectCard } from "../components/WebsiteProjectCard";
export function Projects() {
  const { content, loading, error } = useWebsiteContent();
  const [category, setCategory] = useState("");
  const projects = content.projects
    .filter((p) => !category || p.category === category)
    .sort((a, b) => a.order - b.order);
  return (
    <div>
      <section className="bg-gradient-to-br from-orange-600 to-orange-700 text-white py-20 text-center">
        <h1 className="text-4xl md:text-5xl mb-6">Our Projects</h1>
        <p className="text-xl text-orange-100">
          Explore our construction portfolio.
        </p>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-16">
        <label className="block mb-8">
          Project category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="ml-3 rounded border p-2"
          >
            <option value="">All projects</option>
            {content.categories.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        {loading ? (
          <p>Loading projects...</p>
        ) : error ? (
          <p role="alert">Unable to load projects. Please try again later.</p>
        ) : !projects.length ? (
          <p>Portfolio updates are coming soon.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((p) => (
              <WebsiteProjectCard
                key={p.id}
                project={p}
                color={projectColor(p, content)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
