"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function ReactQueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  // ✅ useState ensures single instance
//   const [queryClient] = useState(
//     () =>
//       new QueryClient({
//         defaultOptions: {
//           queries: {
//             staleTime: 1000 * 60 * 5,
//             gcTime: 1000 * 60 * 10,
//             retry: 1,
//             refetchOnWindowFocus: false,
//           },
//         },
//       })
//   );
const queryClient = new QueryClient();


  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
