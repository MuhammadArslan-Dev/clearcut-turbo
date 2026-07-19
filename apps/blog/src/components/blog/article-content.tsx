// Presentational wrapper that owns the article body's typography. The content
// is pre-parsed by parseArticle() (html-react-parser) so headings already carry
// their slugified `id` anchors; this component just applies the prose styles.
import type { ReactNode } from "react";

export default function ArticleContent({ content }: { content: ReactNode }) {
  return (
    <div
      className={[
        "max-w-none text-[15px] leading-7 text-slate-700",
        "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:scroll-mt-24",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:scroll-mt-24",
        "[&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-slate-900",
        "[&_p]:my-4",
        "[&_strong]:font-semibold [&_strong]:text-slate-900",
        "[&_a]:font-medium [&_a]:text-blue-600 [&_a:hover]:underline",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-1 [&_li]:pl-1",
        // Pull-quote style
        "[&_blockquote]:my-6 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-50/60 [&_blockquote]:py-3 [&_blockquote]:pl-5 [&_blockquote]:pr-4 [&_blockquote]:italic [&_blockquote]:text-slate-700",
        // Figures + images
        "[&_figure]:my-6",
        "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl",
        "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-slate-500",
        // Inline code (not inside <pre>) + code blocks
        "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-slate-100 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[0.85em] [&_:not(pre)>code]:font-medium [&_:not(pre)>code]:text-pink-600",
        "[&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-slate-100",
        // Tables
        "[&_table]:my-6 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm",
        "[&_thead]:bg-slate-50",
        "[&_th]:border [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-900",
        "[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2",
        // Divider
        "[&_hr]:my-8 [&_hr]:border-slate-200",
        // Inline "resourceTable" Lexical block (see clearcut-cms/src/blocks/
        // ResourceTable.ts) — a Previous-Year-Papers-style list with a
        // "View Solved Paper" link + "Download PDF" button per row. Rendered
        // as plain server HTML by the CMS's custom converter; these classes
        // just supply the visual styling.
        "[&_.resource-table]:not-prose [&_.resource-table]:my-8 [&_.resource-table]:overflow-hidden [&_.resource-table]:rounded-2xl [&_.resource-table]:border [&_.resource-table]:border-slate-200 [&_.resource-table]:bg-white",
        "[&_.resource-table\\_\\_title]:px-5 [&_.resource-table\\_\\_title]:pt-5 [&_.resource-table\\_\\_title]:text-lg [&_.resource-table\\_\\_title]:font-bold [&_.resource-table\\_\\_title]:text-slate-900",
        "[&_.resource-table\\_\\_desc]:px-5 [&_.resource-table\\_\\_desc]:pb-1 [&_.resource-table\\_\\_desc]:pt-1 [&_.resource-table\\_\\_desc]:text-sm [&_.resource-table\\_\\_desc]:text-slate-500",
        "[&_.resource-table\\_\\_head]:mt-4 [&_.resource-table\\_\\_head]:flex [&_.resource-table\\_\\_head]:justify-between [&_.resource-table\\_\\_head]:border-t [&_.resource-table\\_\\_head]:border-slate-200 [&_.resource-table\\_\\_head]:bg-slate-50 [&_.resource-table\\_\\_head]:px-5 [&_.resource-table\\_\\_head]:py-2 [&_.resource-table\\_\\_head]:text-xs [&_.resource-table\\_\\_head]:font-semibold [&_.resource-table\\_\\_head]:uppercase [&_.resource-table\\_\\_head]:tracking-wide [&_.resource-table\\_\\_head]:text-slate-500",
        "[&_.resource-table\\_\\_body]:divide-y [&_.resource-table\\_\\_body]:divide-slate-100",
        "[&_.resource-table\\_\\_row]:flex [&_.resource-table\\_\\_row]:flex-col [&_.resource-table\\_\\_row]:gap-3 [&_.resource-table\\_\\_row]:px-5 [&_.resource-table\\_\\_row]:py-4 sm:[&_.resource-table\\_\\_row]:flex-row sm:[&_.resource-table\\_\\_row]:items-center sm:[&_.resource-table\\_\\_row]:justify-between",
        "[&_.resource-table\\_\\_row-title]:m-0 [&_.resource-table\\_\\_row-title]:text-sm [&_.resource-table\\_\\_row-title]:font-semibold [&_.resource-table\\_\\_row-title]:text-slate-800",
        "[&_.resource-table\\_\\_stats]:mt-1.5 [&_.resource-table\\_\\_stats]:flex [&_.resource-table\\_\\_stats]:flex-wrap [&_.resource-table\\_\\_stats]:gap-2",
        "[&_.resource-table\\_\\_stat]:rounded-full [&_.resource-table\\_\\_stat]:bg-slate-100 [&_.resource-table\\_\\_stat]:px-2.5 [&_.resource-table\\_\\_stat]:py-1 [&_.resource-table\\_\\_stat]:text-xs [&_.resource-table\\_\\_stat]:font-medium [&_.resource-table\\_\\_stat]:text-slate-500",
        "[&_.resource-table\\_\\_actions]:flex [&_.resource-table\\_\\_actions]:shrink-0 [&_.resource-table\\_\\_actions]:flex-wrap [&_.resource-table\\_\\_actions]:gap-2",
        "[&_.resource-table\\_\\_btn]:!no-underline [&_.resource-table\\_\\_btn]:inline-flex [&_.resource-table\\_\\_btn]:items-center [&_.resource-table\\_\\_btn]:justify-center [&_.resource-table\\_\\_btn]:whitespace-nowrap [&_.resource-table\\_\\_btn]:rounded-lg [&_.resource-table\\_\\_btn]:px-3.5 [&_.resource-table\\_\\_btn]:py-2 [&_.resource-table\\_\\_btn]:text-sm [&_.resource-table\\_\\_btn]:font-semibold [&_.resource-table\\_\\_btn]:transition-colors",
        "[&_.resource-table\\_\\_btn--solid]:!text-white [&_.resource-table\\_\\_btn--solid]:bg-blue-600 hover:[&_.resource-table\\_\\_btn--solid]:bg-blue-700",
        "[&_.resource-table\\_\\_btn--outline]:border [&_.resource-table\\_\\_btn--outline]:border-blue-300 [&_.resource-table\\_\\_btn--outline]:!text-blue-700 hover:[&_.resource-table\\_\\_btn--outline]:bg-blue-50",
      ].join(" ")}
    >
      {content}
    </div>
  );
}
