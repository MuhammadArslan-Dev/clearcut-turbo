import createMiddleware from "next-intl/middleware";
import { routing } from "@clearcut/i18n/routing";

export const intlMiddleware = createMiddleware(routing);
