export interface Question {
    id: number | string;
    language_code: string;
    [key: string]: any;
}

export function getQuestionsByLanguage(data: Question[] = [], courseLanguage: string = 'en'): Question[] {
    if (!Array.isArray(data) || data.length === 0) return [];

    const courseLangName = courseLanguage.toLowerCase() === 'en' ? 'english' : 'hindi';

    return data
        .filter(item => {
            const lang = (item.language_code || '').toLowerCase();
            return lang === courseLangName || (lang !== 'english' && lang !== 'hindi');
        })
        .sort((a, b) => {
            const aLang = (a.language_code || '').toLowerCase();
            const bLang = (b.language_code || '').toLowerCase();
            const aIsCourseLang = aLang === courseLangName;
            const bIsCourseLang = bLang === courseLangName;

            if (aIsCourseLang && !bIsCourseLang) return -1;
            if (!aIsCourseLang && bIsCourseLang) return 1;
            return aLang.localeCompare(bLang);
        });
}
