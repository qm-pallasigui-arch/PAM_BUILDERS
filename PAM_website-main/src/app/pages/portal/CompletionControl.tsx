import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../portal/Button";

export function CompletionControl({
  value,
  saved,
  correction,
  disabled,
  onChange,
}: {
  value: number;
  saved: number;
  correction: boolean;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const minimum = correction ? 0 : saved;
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const choose = (next: number) => {
    const bounded = Math.min(100, Math.max(minimum, Math.round(next)));
    setDraft(String(bounded));
    onChange(bounded);
  };
  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 sm:p-5"
    >
      <legend className="px-1 font-medium text-gray-900">
        Overall project completion
      </legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Saved progress</p>
          <p className="text-lg font-semibold">{saved}%</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="percent" className="block text-sm font-medium">
            New completion
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="percent"
              type="number"
              inputMode="numeric"
              className="w-24 bg-white text-lg font-semibold"
              min={minimum}
              max={100}
              step={1}
              required
              value={draft}
              aria-describedby="completion-help"
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const raw = e.target.value;
                setDraft(raw);
                const next = Number(raw);
                if (
                  raw !== "" &&
                  Number.isInteger(next) &&
                  next >= minimum &&
                  next <= 100
                )
                  onChange(next);
              }}
              onBlur={() => choose(draft.trim() === "" ? value : Number(draft))}
            />
            <span className="font-semibold">%</span>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="completion-slider" className="sr-only">
          Adjust project completion percentage
        </label>
        <input
          id="completion-slider"
          type="range"
          min={minimum}
          max={100}
          step={1}
          value={value}
          disabled={disabled || minimum === 100}
          onChange={(e) => choose(Number(e.target.value))}
          aria-valuetext={`${value} percent complete`}
          aria-describedby="completion-help"
          className="h-10 w-full cursor-pointer accent-orange-600 disabled:cursor-default"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {minimum}% {correction ? "minimum" : "saved minimum"}
          </span>
          <span>100% complete</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 5, 10].map((step) => (
          <Button
            key={step}
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || value === 100}
            onClick={() => choose(value + step)}
          >
            +{step}%
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || value === saved}
          onClick={() => choose(saved)}
        >
          Reset to saved
        </Button>
      </div>
      <p id="completion-help" className="text-sm text-gray-600">
        {correction
          ? "Admin correction: a decrease requires a reason."
          : saved === 100
            ? "This project is already at 100%."
            : `Drag the slider or type a percentage. Progress cannot go below the saved ${saved}%.`}{" "}
        Changes are saved when you submit the report.
      </p>
    </fieldset>
  );
}
