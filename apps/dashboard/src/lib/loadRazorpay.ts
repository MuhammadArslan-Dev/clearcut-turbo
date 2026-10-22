// Loads Razorpay's checkout.js once. The payment page preloads it on mount
// and the pay tap awaits the same promise, so a tap during the preload no
// longer adds a second <script> (CC-60). A request that neither loads nor
// errors (very bad network) resolves false after LOAD_TIMEOUT_MS instead of
// leaving the pay button spinning for ever; the next tap tries again.
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const LOAD_TIMEOUT_MS = 15000;

let loading: Promise<boolean> | null = null;

export const loadRazorpay = (): Promise<boolean> => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ("Razorpay" in window) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    const timer = window.setTimeout(() => finish(false), LOAD_TIMEOUT_MS);
    function finish(ok: boolean) {
      window.clearTimeout(timer);
      if (!ok) {
        loading = null;
        script.remove();
      }
      resolve(ok);
    }
    script.onload = () => finish("Razorpay" in window);
    script.onerror = () => finish(false);
    document.body.appendChild(script);
  });
  return loading;
};
