// lib/profile.ts
export async function getProfile(userId: string) {
  const res = await fetch(
    `https://api.example.com/users/${userId}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}
