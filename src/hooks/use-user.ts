/**
 * Hook to retrieve the current logged-in user.
 *
 * ARCHITECTURE:
 * - Local development: Reads the email from the VITE_DEV_USER_EMAIL environment variable.
 * - Production: Reads the session from the backend /auth/me endpoint.
 *
 * The role system (use-user-role.ts) uses the userPrincipalName from this hook
 * to look up the user in the backend's AsignacionesRolUsuario table.
 */
import { useQuery } from '@tanstack/react-query';

export interface AppUser {
  id?: string;
  displayName?: string;
  userPrincipalName?: string;
  mail?: string;
}

async function getCurrentUser(): Promise<AppUser | null> {
  // 1. Local development: use env variable in development environment
  if (import.meta.env.DEV) {
    const devEmail = import.meta.env.VITE_DEV_USER_EMAIL as string | undefined;
    const devName = import.meta.env.VITE_DEV_USER_NAME as string | undefined;

    if (devEmail) {
      return {
        userPrincipalName: devEmail,
        mail: devEmail,
        displayName: devName ?? devEmail,
      };
    }
  }

  // 2. Production: query user profile from backend
  const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
  try {
    const res = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' });
    if (res.ok) {
      return await res.json() as AppUser;
    }
    // If 401 Unauthorized is returned, there is no active session.
    if (res.status === 401) {
      return null;
    }
  } catch {
    console.error("No se pudo contactar al servidor de autenticación");
  }

  // 3. No identified user
  return null;
}

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // No re-fetch for 5 minutes
  });
};
