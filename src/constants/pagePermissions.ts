export interface PermissionUser {
  role?: string;
  permissions?: string[] | string | null;
}

export const PAGE_KEYS = [
  'home',
  'quote',
  'history',
  'clients',
  'items',
  'intervention',
  'planning',
  'org-chart',
  'users',
  'logs',
  'financial',
  'help'
] as const;

export type PageKey = typeof PAGE_KEYS[number];

export const PAGE_DEFINITIONS: { key: PageKey; label: string; path: string }[] = [
  { key: 'home', label: 'Accueil', path: '/home' },
  { key: 'quote', label: 'Nouveau Devis', path: '/quote' },
  { key: 'history', label: 'Historique', path: '/history' },
  { key: 'clients', label: 'Clients', path: '/clients' },
  { key: 'items', label: 'Articles', path: '/items' },
  { key: 'intervention', label: 'Intervention', path: '/intervention' },
  { key: 'planning', label: 'Planning', path: '/planning' },
  { key: 'org-chart', label: 'Organigramme', path: '/org-chart' },
  { key: 'users', label: 'Utilisateurs', path: '/users' },
  { key: 'logs', label: 'Journal', path: '/logs' },
  { key: 'financial', label: 'Financier', path: '/financial' },
  { key: 'help', label: 'Aide', path: '/help' }
];

const PATH_ALIASES: { prefix: string; page: PageKey }[] = [
  { prefix: '/quote-test', page: 'quote' },
  { prefix: '/price-offer', page: 'quote' },
  { prefix: '/interventions', page: 'intervention' },
  { prefix: '/intervention', page: 'intervention' },
  { prefix: '/employees', page: 'org-chart' },
  { prefix: '/quote', page: 'quote' },
  { prefix: '/history', page: 'history' },
  { prefix: '/clients', page: 'clients' },
  { prefix: '/items', page: 'items' },
  { prefix: '/planning', page: 'planning' },
  { prefix: '/org-chart', page: 'org-chart' },
  { prefix: '/users', page: 'users' },
  { prefix: '/logs', page: 'logs' },
  { prefix: '/financial', page: 'financial' },
  { prefix: '/help', page: 'help' },
  { prefix: '/home', page: 'home' }
];

export function parsePermissions(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

export function permissionsFromRole(role?: string): string[] {
  if (role === 'admin') return ['all'];
  if (role === 'editor') {
    return ['home', 'quote', 'history', 'clients', 'items', 'intervention', 'planning', 'org-chart', 'help'];
  }
  if (role === 'user') {
    return ['home', 'quote', 'history', 'planning', 'help'];
  }
  return ['home', 'history', 'planning', 'help'];
}

export function normalizePermissions(user?: PermissionUser | null): string[] {
  if (!user) return [];
  const parsed = parsePermissions(user.permissions);
  if (parsed.includes('all')) return ['all'];
  const known = parsed.filter((key) => PAGE_KEYS.includes(key as PageKey));
  if (known.length > 0) return known;
  return permissionsFromRole(user.role);
}

export function hasAllAccess(permissions: string[]): boolean {
  return permissions.includes('all');
}

export function hasPageAccess(user: PermissionUser | null | undefined, page: PageKey): boolean {
  if (!user) return false;
  const permissions = normalizePermissions(user);
  if (hasAllAccess(permissions)) return true;
  if (page === 'home') return true;
  return permissions.includes(page);
}

export function canManageUsers(user: PermissionUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || hasPageAccess(user, 'users');
}

export function pageFromPath(path: string): PageKey | null {
  const clean = path.split('?')[0];
  const match = PATH_ALIASES.find((item) => clean === item.prefix || clean.startsWith(`${item.prefix}/`));
  return match?.page || null;
}

export function togglePagePermission(current: string[], page: PageKey, enabled: boolean): string[] {
  if (enabled) {
    if (hasAllAccess(current)) return ['all'];
    const next = Array.from(new Set([...current.filter((key) => key !== 'all'), page]));
    return PAGE_KEYS.every((key) => next.includes(key)) ? ['all'] : next;
  }

  const expanded = hasAllAccess(current) ? [...PAGE_KEYS] : current.filter((key) => key !== 'all');
  return expanded.filter((key) => key !== page);
}

export function applyAllPermission(enabled: boolean): string[] {
  return enabled ? ['all'] : ['home'];
}

export function isPageChecked(permissions: string[], page: PageKey): boolean {
  return hasAllAccess(permissions) || permissions.includes(page);
}
