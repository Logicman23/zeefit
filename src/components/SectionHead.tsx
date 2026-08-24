export default function SectionHead({
  title,
  sub,
  align = "left",
}: {
  title: string;
  sub?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`rule-tick pt-6 ${align === "center" ? "text-center [&::before]:left-1/2 [&::before]:-translate-x-1/2" : ""}`}>
      <h2 className="display text-[1.75rem] text-ink sm:text-4xl lg:text-[2.75rem]">{title}</h2>
      {sub && <p className="mt-3 max-w-xl text-sm text-ink-muted lg:text-[0.9375rem]">{sub}</p>}
    </div>
  );
}
