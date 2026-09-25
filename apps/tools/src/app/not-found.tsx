import ErrorPageContent from "@/components/ErrorPageContent";
import { ReportNotFound } from "@/components/page-error-reporter";

// Rendered for any unknown /tools/* URL (exported as 404.html and served by
// Cloudflare Pages with a real 404 status). Next adds noindex automatically.
export default function NotFound() {
  return (
    <>
      <ReportNotFound />
      <ErrorPageContent variant="404" />
    </>
  );
}
