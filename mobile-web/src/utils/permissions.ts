import type { User } from '../types/models';

export function hasPermission(user: User | null, slug: string): boolean {
  return !!user?.role?.permissions?.some((p) => p.slug === slug);
}
