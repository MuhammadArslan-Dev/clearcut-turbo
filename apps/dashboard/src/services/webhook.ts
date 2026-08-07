export async function webhookPaymentInitiate(payload: any) {
  const res = await fetch("/api/payment-init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data;

  try {
    data = await res.json();
  } catch {
    data = await res.text(); // fallback
  }

  return data;
}