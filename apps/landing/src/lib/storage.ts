// /lib/storage.ts
export const saveSession = (source: string, data: any) => {
  localStorage.setItem(source, JSON.stringify(data));
};

export const loadSession = (source: string) => {
  return JSON.parse(localStorage.getItem(source) || "{}");
};