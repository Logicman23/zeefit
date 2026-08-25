"use client";

import { useActionState, useState } from "react";
import type { SettingDef, SettingsMap } from "@/lib/settings";
import {
  updateSettings,
  type SettingsActionState,
} from "@/app/admin/(protected)/settings/actions";
import { Section, Field, inputClass, Button } from "./ui";

type Group = { id: string; title: string; description: string };

export default function SettingsForm({
  groups,
  defs,
  values,
}: {
  groups: Group[];
  defs: SettingDef[];
  values: SettingsMap;
}) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateSettings,
    {}
  );
  const err = state.fieldErrors ?? {};

  // Only used for the character counters; everything else stays uncontrolled.
  const [lengths, setLengths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const d of defs) {
      if (d.maxLength) initial[d.key] = String(values[d.key] ?? "").length;
    }
    return initial;
  });

  const noindexOn = values["seo.noindexSite"] === true;

  return (
    <form action={formAction} className="mx-auto max-w-[900px]">
      <header className="mb-8 rule-tick relative pt-6">
        <h1 className="display text-3xl text-ink">Settings</h1>
        <p className="mt-2 text-[0.875rem] text-ink-muted">
          Every setting here is read by the storefront. Anything left untouched keeps its default.
        </p>
      </header>

      {state.error && (
        <p className="mb-6 rounded-[2px] border border-alert/30 bg-alert/5 px-4 py-3 text-[0.875rem] text-alert" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && !pending && (
        <p className="mb-6 rounded-[2px] border border-brand-200 bg-brand-50 px-4 py-3 text-[0.875rem] text-brand-700" role="status">
          Settings saved. The storefront has been refreshed.
        </p>
      )}
      {Object.keys(err).length > 0 && (
        <p className="mb-6 rounded-[2px] border border-alert/30 bg-alert/5 px-4 py-3 text-[0.875rem] text-alert" role="alert">
          {Object.keys(err).length} setting{Object.keys(err).length === 1 ? "" : "s"} could not be
          saved. Nothing was changed — see the messages below.
        </p>
      )}

      {noindexOn && (
        <p className="mb-6 rounded-[2px] border border-alert/40 bg-alert/5 px-4 py-3 text-[0.875rem] text-alert">
          <strong>The whole site is hidden from search engines.</strong> No product will appear in
          search results, whatever its own SEO settings say.
        </p>
      )}

      <div className="space-y-4">
        {groups.map((group, i) => {
          const fields = defs.filter((d) => d.group === group.id);
          if (fields.length === 0) return null;

          return (
            <Section
              key={group.id}
              step={String(i + 1).padStart(2, "0")}
              title={group.title}
              description={group.description}
            >
              {fields.map((def) => (
                <SettingField
                  key={def.key}
                  def={def}
                  value={values[def.key]}
                  error={err[def.key]}
                  length={lengths[def.key]}
                  onLength={(n) => setLengths((p) => ({ ...p, [def.key]: n }))}
                />
              ))}
            </Section>
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-4 border-t border-line bg-paper/95 py-4 backdrop-blur-md">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function SettingField({
  def,
  value,
  error,
  length,
  onLength,
}: {
  def: SettingDef;
  value: string | number | boolean | undefined;
  error?: string;
  length?: number;
  onLength: (n: number) => void;
}) {
  const id = `set-${def.key}`;

  if (def.type === "boolean") {
    return (
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          id={id}
          name={def.key}
          defaultChecked={value === true}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-[2px] border-line-strong accent-[var(--color-brand)]"
        />
        <span>
          <span className="block text-[0.8125rem] text-ink">{def.label}</span>
          {def.hint && (
            <span className="mt-0.5 block text-[0.75rem] leading-snug text-ink-muted">{def.hint}</span>
          )}
          <span className="mt-0.5 block text-[0.6875rem] text-ink-muted/80">Used by: {def.usedBy}</span>
        </span>
      </label>
    );
  }

  const counter =
    def.maxLength !== undefined ? (
      <span
        className={`text-[0.6875rem] tabular-nums ${
          (length ?? 0) > def.maxLength ? "text-alert" : "text-ink-muted"
        }`}
      >
        {length ?? 0}/{def.maxLength}
      </span>
    ) : undefined;

  const common = {
    id,
    name: def.key,
    defaultValue: String(value ?? ""),
    className: inputClass(!!error),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onLength(e.target.value.length),
  };

  return (
    <Field
      label={def.label}
      htmlFor={id}
      error={error}
      counter={counter}
      hint={def.hint ? `${def.hint} · Used by: ${def.usedBy}` : `Used by: ${def.usedBy}`}
    >
      {def.type === "textarea" ? (
        <textarea {...common} rows={3} />
      ) : (
        <input
          {...common}
          type={def.type === "number" ? "number" : def.type === "email" ? "email" : "text"}
          min={def.type === "number" ? 0 : undefined}
        />
      )}
    </Field>
  );
}
