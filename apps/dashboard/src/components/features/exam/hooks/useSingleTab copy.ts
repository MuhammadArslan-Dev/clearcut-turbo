import { useEffect } from "react";

export function useSingleTab(examId: string) {

  useEffect(() => {

    const key = `exam-lock-${examId}`;
    const id = crypto.randomUUID();

    localStorage.setItem(key, id);

    const handler = (e: StorageEvent) => {

      if (e.key === key && e.newValue !== id) {
        alert("Exam opened in another tab!");
        window.location.reload();
      }
    };

    window.addEventListener("storage", handler);

    return () => {
      localStorage.removeItem(key);
      window.removeEventListener("storage", handler);
    };

  }, [examId]);
}



// useEffect(() => {

//   const onBlur = () => {
//     console.warn("User left tab");
//   };

//   window.addEventListener("blur", onBlur);

//   return () => window.removeEventListener("blur", onBlur);

// }, []);
