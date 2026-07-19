// Branded cover shown for posts that have no hero image — a gradient with a
// dotted texture and a faded book watermark, so image-less cards still look
// intentional and consistent alongside real photos.
export default function CardPlaceholder({
  title,
  size = "default",
}: {
  title: string;
  size?: "default" | "large";
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
      {/* dotted texture */}
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      {/* faded book watermark */}
      <svg
        className="absolute -right-6 -top-8 h-40 w-40 text-white/10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
      <span
        className={[
          "relative px-5 text-center font-semibold leading-snug text-white line-clamp-3",
          size === "large" ? "text-2xl" : "text-lg",
        ].join(" ")}
      >
        {title}
      </span>
    </div>
  );
}
