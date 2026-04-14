/**
 * Normaliza el campo `role` de un usuario de PocketBase.
 * PocketBase puede devolver el rol como string o como array de strings.
 * Esta función siempre devuelve un array de strings en minúsculas.
 */
export function getUserRoles(role: unknown): string[] {
  if (!role) return [];
  if (Array.isArray(role)) {
    return role.map((r) => String(r).toLowerCase());
  }
  return [String(role).toLowerCase()];
}

/**
 * Verifica si el usuario tiene un rol específico (case-insensitive).
 * Soporta que `role` sea string o array de strings.
 */
export function hasRole(role: unknown, targetRole: string): boolean {
  return getUserRoles(role).includes(targetRole.toLowerCase());
}

/**
 * Verifica si el usuario es admin.
 */
export function isAdminRole(role: unknown): boolean {
  return hasRole(role, "admin");
}

/**
 * Verifica si el usuario es itinerante.
 */
export function isItineranteRole(role: unknown): boolean {
  return hasRole(role, "itinerante");
}

/**
 * Verifica si el usuario tiene el rol Ley Karin.
 */
export function isLeyKarinRole(role: unknown): boolean {
  return hasRole(role, "ley karin");
}
