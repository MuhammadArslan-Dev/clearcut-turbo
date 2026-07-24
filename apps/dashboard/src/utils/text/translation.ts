// utils/translation.ts
export function parseTranslation<T = any>(
    translation: string | T
): T | undefined {
    if (!translation) return undefined;

    if (typeof translation === "string") {
        try {
            return JSON.parse(translation) as T;
        } catch (error) {
            console.error("Invalid translation JSON", error);
            return undefined;
        }
    }

    return translation;
}
