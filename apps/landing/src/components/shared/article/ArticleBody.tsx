// No @tailwindcss/typography plugin in this project, so the article's rich
// text (headings/paragraphs/lists from the CMS) is styled here via child
// selectors instead of a `prose` class. `scroll-mt` on headings keeps them
// clear of the sticky header when the TOC jumps to an anchor.
const ARTICLE_CLASSES =
  "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text-gray-normal [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24 " +
  "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-text-gray-normal [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:scroll-mt-24 " +
  "[&_p]:text-text-gray-subtle [&_p]:leading-relaxed [&_p]:mb-4 " +
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:text-text-gray-subtle " +
  "[&_li]:mb-1 " +
  "[&_a]:text-brand [&_a]:underline " +
  // `dataTable` block (CMS: src/blocks/DataTable.ts) — a fully author-defined
  // table, any number of columns/rows, rendered as a real <table>.
  "[&_.data-table]:my-6 [&_.data-table-title]:text-xl [&_.data-table-title]:font-bold [&_.data-table-title]:text-text-gray-normal [&_.data-table-title]:mb-2 " +
  "[&_.data-table-desc]:text-text-gray-subtle [&_.data-table-desc]:mb-4 " +
  "[&_.data-table-grid]:w-full [&_.data-table-grid]:border-collapse [&_.data-table-grid]:text-left " +
  "[&_.data-table-grid_th]:border-b [&_.data-table-grid_th]:border-border-gray-subtle [&_.data-table-grid_th]:pb-2 [&_.data-table-grid_th]:pr-4 [&_.data-table-grid_th]:font-semibold [&_.data-table-grid_th]:text-text-gray-normal [&_.data-table-grid_th]:align-top " +
  "[&_.data-table-grid_td]:border-b [&_.data-table-grid_td]:border-border-gray-subtle [&_.data-table-grid_td]:py-3 [&_.data-table-grid_td]:pr-4 [&_.data-table-grid_td]:text-text-gray-subtle [&_.data-table-grid_td]:align-top " +
  "[&_.data-table-grid_tr:last-child_td]:border-b-0";

export default function ArticleBody({ html }: { html: string }) {
  return <div className={ARTICLE_CLASSES} dangerouslySetInnerHTML={{ __html: html }} />;
}
