export enum Role {
  CIUDADANO = 1,
  MEDICO = 2,
  ADMINISTRADOR = 3,
  CONSULTOR = 4
}

/**
 * Devuelve el nombre normalizado (minúsculas) para un role numérico o string.
 * Ej: 1 -> 'ciudadano', '3' -> 'administrador'
 */
export function roleName(value: number | string | undefined | null): string | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  switch (n) {
    case Role.CIUDADANO:
      return 'ciudadano';
    case Role.MEDICO:
      return 'medico';
    case Role.ADMINISTRADOR:
      return 'administrador';
    case Role.CONSULTOR:
      return 'consultor';
    default:
      // si no es numérico, devolver como string normalizado
      return String(value).toLowerCase() || null;
  }
}
