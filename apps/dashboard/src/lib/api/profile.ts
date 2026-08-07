import { Profile } from "@/components/features/profile/ProfileCard";
import { apiFetch } from "./apiClient";

const token = () => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
};

export const getProfile = async (): Promise<Profile> => {
  const res = await apiFetch("/v2/profile", {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw json;
  }

  return json.data;
};

export const updateProfile = async (profile: Profile): Promise<Profile> => {
  const payload = {
    name: profile.name?.trim() || "",
    gender: profile.gender ? profile.gender.toLowerCase() : null, // ✅ FIX
    dob: profile.dob || "",
    email: profile.email?.trim() || "",
    phone: profile.phone ? String(profile.phone) : null,
  };

  const res = await apiFetch("/v2/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw json;
  }

  return json.data;
};

// export async function webhookPaymentInitiate(payload: {
//   event: string;
//   data: {
//     user_id: number;
//     amount: number;
//     course_id: string;
//     transaction_id: string;
//     status: string;
//   };
// }): Promise<{ status: string; message?: string; data?: any }> {
//   if (!payload) {
//     return { status: "error", message: "No payload" };
//   }

//   const res = await fetch("https://n8n.clearcutoff.in/webhook/payment-init", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   const data = await res.json();
//   return data;
// }
