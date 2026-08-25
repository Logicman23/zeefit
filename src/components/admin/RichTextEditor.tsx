"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useId } from "react";

/**
 * Rich-text field. Emits HTML, which is what the existing catalogue already
 * stores and what the storefront's .prose-clinical styles already render — so
 * copy written here lands on the product page looking the way it looks here.
 *
 * The value is mirrored into a hidden input so the surrounding <form> submits it
 * with everything else and the Server Action sees one FormData payload.
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

export default function RichTextEditor({
  name,
  defaultValue,
  placeholder,
  minHeight = "12rem",
}: Props) {
  const id = useId();

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
    editorProps: {
      attributes: {
        class: "prose-clinical focus:outline-none",
        style: `min-height:${minHeight}`,
        "aria-labelledby": id,
      },
    },
  });

  // Keep the hidden input in sync without re-rendering the whole form on every
  // keystroke — the DOM node is written to directly.
  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const el = document.getElementById(`${id}-value`) as HTMLInputElement | null;
      if (!el) return;
      const html = editor.getHTML();
      el.value = html === "<p></p>" ? "" : html;
    };
    sync();
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor, id]);

  if (!editor) {
    return (
      <div
        className="rounded-[2px] border border-line bg-mist"
        style={{ minHeight }}
        aria-busy="true"
      />
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

      <div className="px-4 py-3 text-[0.875rem]">
        <EditorContent editor={editor} />
        {placeholder && editor.isEmpty && (
          <p className="pointer-events-none -mt-[1.75rem] text-[0.875rem] text-ink-muted/70">
            {placeholder}
          </p>
        )}
      </div>

      <input type="hidden" id={`${id}-value`} name={name} defaultValue={defaultValue ?? ""} />
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
    // window.prompt is intentional here: a modal dialog for one URL field would
    // be more UI than the task needs, and it keeps focus handling simple.
    const url = window.prompt("Link URL (include https://)");
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      window.alert("Links must start with http:// or https://");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor, active]);

  return (
    <ToolbarButton editor={editor} label={active ? "Remove link" : "Add link"} active={active} onClick={toggle}>
      🔗
    </ToolbarButton>
  );
}
