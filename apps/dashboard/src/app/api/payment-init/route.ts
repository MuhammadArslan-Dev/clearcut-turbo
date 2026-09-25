import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(
      "https://n8n.clearcutoff.in/webhook-test/payment-init",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const text = await response.text();

    return Response.json({
      success: true,
      status: response.status,
      data: text,
    });

  } catch (error: any) {
    // Swallowed into a 200 {success:false} below, so onRequestError never sees it.
    Sentry.captureException(error, { tags: { route: "api/payment-init" } });
    return Response.json({
      success: false,
      message: error.message || "Webhook failed",
    });
  }
}