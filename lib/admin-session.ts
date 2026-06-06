type AdminSession = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function createAdminSessionValue(session: AdminSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function parseAdminSessionValue(rawValue?: string): AdminSession | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as AdminSession;
    if (!parsed?.email || !parsed?.role || parsed.role.toLowerCase() !== 'admin') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
