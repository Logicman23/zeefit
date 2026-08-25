"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-media";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads straight from the browser to Supabase Storage using the signed-in
 * user's session, so the bucket policies in prisma/sql/02_product_media.sql are
 * what actually authorise the write — there is no server action in between.
 *
 * The form still submits plain text: this component owns a hidden input holding
 * either one URL (`multiple: false`) or a comma-separated list. That keeps the
 * Server Action's FormData contract identical to when these were typed by hand,
 * so existing products with hand-entered paths like /products/foo.jpeg keep
 * working and can be mixed with uploads.
 */
export default function ImageUploader({
  name,
  defaultValue = "",
  multiple = false,
  label,
}: {
  name: string;
  defaultValue?: string;
  multiple?: boolean;
  label?: string;
}) {
  const initial = defaultValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const value = urls.join(", ");

  const upload = useCallback(
    async (files: FileList) => {
      setError(null);
      const supabase = createClient();
      const accepted: string[] = [];
      const list = multiple ? Array.from(files) : Array.from(files).slice(0, 1);

      setBusy(true);
      try {
        for (const [i, file] of list.entries()) {
          if (!ACCEPT.includes(file.type)) {
            setError(`${file.name}: only JPEG, PNG, WebP or AVIF are accepted.`);
            continue;
          }
          if (file.size > MAX_BYTES) {
            setError(`${file.name}: ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the 5 MB limit.`);
            continue;
          }

          setProgress(`Uploading ${i + 1} of ${list.length}…`);

          // Collision-proof without needing a lookup: random prefix + safe name.
          const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
          const path = `${crypto.randomUUID().slice(0, 8)}-${safe}`;

          const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
            cacheControl: "31536000",
            upsert: false,
          });

          if (upErr) {
            // The most common cause is the session having expired, which the
            // policies see as an anonymous write.
            setError(`${file.name}: ${upErr.message}`);
            continue;
          }

          const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
          accepted.push(data.publicUrl);
        }

        if (accepted.length) {
          setUrls((prev) => (multiple ? [...prev, ...accepted] : accepted));
        }
      } finally {
        setBusy(false);
        setProgress(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [multiple]
  );

  return (
    <div>
      <div className="rounded-[2px] border border-dashed border-line-strong bg-mist/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-[2px] border border-line-strong bg-paper px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {busy ? progress ?? "Uploading…" : multiple ? "Add images" : "Choose image"}
          </button>
          <span className="text-[0.75rem] text-ink-muted">
            JPEG, PNG, WebP or AVIF · up to 5 MB{multiple ? " each" : ""}
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
          aria-label={label ?? "Upload image"}
        />

        {urls.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-3">
            {urls.map((url) => (
              <li key={url} className="group relative">
                {/* Plain <img>: these are arbitrary user-supplied origins and
                    next/image would need each one allow-listed in next.config. */}
                <img
                  src={url}
                  alt=""
                  className="h-24 w-24 rounded-[2px] border border-line object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => setUrls((p) => p.filter((u) => u !== url))}
                  title="Remove from this product"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-paper text-[0.75rem] text-ink-muted shadow-sm transition-colors hover:border-alert hover:text-alert"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {urls.length > 0 && (
          <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-muted">
            Removing an image here detaches it from the product. The file itself stays in storage —
            deleting files is an administrator action.
          </p>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[0.75rem] text-alert" role="alert">
          {error}
        </p>
      )}

      <input type="hidden" name={name} value={value} readOnly />

      <details className="mt-2">
        <summary className="cursor-pointer text-[0.6875rem] text-ink-muted hover:text-ink">
          Or enter paths manually
        </summary>
        <input
          value={value}
          onChange={(e) =>
            setUrls(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="/products/product-featured-83.jpeg"
          className="mt-2 w-full rounded-[2px] border border-line bg-paper px-3 py-2 text-[0.8125rem] outline-none focus:border-brand"
        />
      </details>
    </div>
  );
}
