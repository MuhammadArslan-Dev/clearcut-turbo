import { cookies } from 'next/headers';
import { ReactNode } from 'react';
import { getMeApi } from '@/lib/api/auth';
import { AuthClientProvider } from './AuthClientProvider';
import { UserPreview } from '@/types/User';

async function getUserFromServer(): Promise<UserPreview | null> {
  const cookieStore = cookies();

  
      const token = (await cookies()).get("auth_token")?.value;
      // console.log('server_Token',token)

//   const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const res = await getMeApi(token);
          // console.log('server_res',res.data)

    return res.data;
  } catch {
    return null;
  }
}

export default async function AuthServerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUserFromServer();

  return (
    <AuthClientProvider initialUser={user}>
      {children}
    </AuthClientProvider>
  );
}
