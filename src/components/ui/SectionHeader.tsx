import { cn } from "@/lib/utils";

/**
 * Section heading. Inside a `.on-dark` section the eyebrow, headline and
 * copy recolor themselves from CSS — no `onDark` prop needed.
 */
export function SectionHeader({
  eyebrow,
  title,
  copy,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  copy?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-[62ch]", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="display-xl text-balance">{title}</h2>
      {copy && <p className="body-lg mt-5 text-pretty">{copy}</p>}
    </div>
  );
}
