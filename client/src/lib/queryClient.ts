import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const error = await res.json();
        errorMessage = error.message || error.error || res.statusText;
      } else {
        errorMessage = await res.text();
      }
    } catch (e) {
      errorMessage = res.statusText;
    }

    // Don't throw on 401 during logout or when already at login page
    const currentPath = window.location.pathname;
    const isLogoutRequest = res.url.includes("/api/logout");
    
    if (res.status === 401 && (
      currentPath === "/auth/login" || 
      isLogoutRequest
    )) {
      console.log("Ignoring 401 error during logout or at login page");
      return;
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  signal?: AbortSignal,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    signal,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      headers: {
        'Accept': 'application/json'
      },
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Changed to returnNull to handle 401s gracefully
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0, // Don't cache any data
      gcTime: 1000, // Very short garbage collection time (1 second)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  }
});

// Add a listener for notification mutations
queryClient.getMutationCache().subscribe(() => {
  // Whenever any mutation happens, invalidate notification queries
  // This ensures they get refreshed after notification deletions
  queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
});