import { useWebsiteContent } from "../../portal/content";
import { Input } from "../../components/ui/input";
export function ProjectAppearance({
  category,
  color,
  onChange,
}: {
  category: string;
  color: string | null;
  onChange: (patch: { category?: string; color?: string | null }) => void;
}) {
  const { content } = useWebsiteContent();
  const categories = [
    ...new Set([category, ...content.categories.map((c) => c.name)]),
  ];
  return (
    <div className="space-y-3">
      <label className="block">
        Category
        <select
          className="block w-full rounded border p-2"
          value={category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={!color}
          onChange={(e) =>
            onChange({ color: e.target.checked ? null : "#ea580c" })
          }
        />
        Use category color
      </label>
      {color && (
        <label className="block">
          Project color
          <Input
            type="color"
            value={color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </label>
      )}
    </div>
  );
}
