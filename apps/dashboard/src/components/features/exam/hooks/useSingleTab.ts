import { useEffect } from "react";


export function useSingleTab(examId: string) {

  useEffect(() => {

    const key = `exam-lock-${examId}`;

    // Unique ID for this tab
    const tabId = crypto.randomUUID();


    // Register this tab as active
    localStorage.setItem(key, tabId);


    // Listen for changes from other tabs
    const handler = (e: StorageEvent) => {

      if (e.key !== key) return;

      // Another tab became active
      if (e.newValue !== tabId) {

        // alert("Exam opened in another tab. This tab will close.");

        // Try to close this tab
        window.close();

        // Fallback (if browser blocks close)
        document.body.innerHTML = `
          <h1 style="text-align:center;margin-top:20%">
            Exam session moved to another tab.
          </h1>
        `;
      }
    };


    window.addEventListener("storage", handler);


    // Cleanup on tab close
    const cleanup = () => {

      const current = localStorage.getItem(key);

      if (current === tabId) {
        localStorage.removeItem(key);
      }
    };

    window.addEventListener("beforeunload", cleanup);


    return () => {

      cleanup();

      window.removeEventListener("storage", handler);
      window.removeEventListener("beforeunload", cleanup);
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
