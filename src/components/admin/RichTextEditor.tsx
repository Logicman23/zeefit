"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useState } from "react";

/**
 * Rich-text field. Emits HTML, which is what the existing catalogue already
 * stores and what the storefront's .prose-clinical styles already render — so
 * copy written here lands on the product page looking the way it looks here.
 *
 * The value lives in React state and is rendered into a hidden input, so the
 * surrounding <form> submits it with everything else.
 *
 * It used to write into that input imperatively via getElementById, which
 * silently failed: the input is only mounted once Tiptap has initialised, and
 * `immediatelyRender: false` means that happens a tick later, so a submit could
 * carry no description at all and the server would reject a product the user
 * had plainly written copy for. Controlled state removes the ordering problem —
 * the input is now present, and correct, from the very first render.
 *
 * NOTE: HTML from this editor is stored as-authored and rendered with
 * dangerouslySetInnerHTML on the storefront. Tiptap constrains input to its own
 * schema, which is a meaningful constraint but NOT a sanitiser — see the
 * hardening note in README-ADMIN.md before opening authoring to wider roles.
 */

type Props = {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  minHeight?: string;
};

const HEADING_LEVELS = [2, 3] as const;

/** Tiptap represents "empty" as <p></p>; that must not count as content. */
export function normalizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .trim();
  return text.length === 0 ? "" : html;
}

export default function RichTextEditor({
  name,
  defaultValue,
  placeholder,
  minHeight = "12rem",
}: Props) {
  const [html, setHtml] = useState(() => normalizeHtml(defaultValue));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
    ],
    content: defaultValue ?? "",
    // Required in the App Router: rendering the editor during SSR produces a
    // hydration mismatch, so the first paint is deferred to the client.
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(normalizeHtml(editor.getHTML())),
    editorProps: {
      attributes: {
        class: "prose-clinical focus:outline-none",
        style: `min-height:${minHeight}`,
      },
    },
  });

  // Rendered in both branches: the form must carry a value even if it is
  // submitted before Tiptap has finished initialising.
  const hidden = <input type="hidden" name={name} value={html} readOnly />;

  if (!editor) {
    return (
      <div>
        <div
          className="rounded-[2px] border border-line bg-mist"
          style={{ minHeight }}
          aria-busy="true"
        />
        {hidden}
      </div>
    );
  }

  return (
    <div className="rounded-[2px] border border-line focus-within:border-brand">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-mist px-2 py-1.5">
        <ToolbarButton
          editor={editor}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </ToolbarButton>

        <Divider />

        {HEADING_LEVELS.map((level) => (
          <ToolbarButton
            key={level}
            editor={editor}
            label={`Heading ${level}`}
            active={editor.isActive("heading", { level })}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          >
            H{level}
          </ToolbarButton>
        ))}

        <Divider />

        <ToolbarButton
          editor={editor}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •&nbsp;—
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.&nbsp;—
        </ToolbarButton>

        <Divider />

        <LinkButton editor={editor} />

        <div className="ml-auto flex gap-0.5">
          <ToolbarButton
            editor={editor}
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            ↶
          </ToolbarButton>
          <ToolbarButton
            editor={editor}
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            ↷
          </ToolbarButton>
        </div>
      </div>

      <div className="relative px-4 py-3 text-[0.875rem]">
        {placeholder && html === "" && (
          <p className="pointer-events-none absolute left-4 top-3 text-[0.875rem] text-ink-muted/70">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      {hidden}
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-line-strong" aria-hidden />;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  editor: Editor;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`min-w-[1.9rem] rounded-[2px] px-2 py-1 text-[0.75rem] transition-colors disabled:opacity-35 ${
        active ? "bg-brand text-paper" : "text-ink-soft hover:bg-haze hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function LinkButton({ editor }: { editor: Editor }) {
  const active = editor.isActive("link");

  const toggle = useCallback(() => {
    if (active) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Link URL (include https://)");
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor, active]);

  return (
    <ToolbarButton editor={editor} label={active ? "Remove link" : "Add link"} active={active} onClick={toggle}>
      🔗
    </ToolbarButton>
  );
}
