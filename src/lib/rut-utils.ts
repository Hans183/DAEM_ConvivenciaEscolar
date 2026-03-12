/**
 * Funciones de utilidad para validar y formatear el RUT chileno.
 */

/**
 * Valida un RUT chileno (con o sin puntos/guion).
 * Utiliza el algoritmo del Módulo 11.
 */
export const validateRut = (rut: string): boolean => {
  // Limpiar el RUT de puntos y guiones
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  // Regex básico para el cuerpo y DV
  if (!/^[0-9]+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDvNum = 11 - (sum % 11);
  const expectedDv = expectedDvNum === 11 ? "0" : expectedDvNum === 10 ? "K" : expectedDvNum.toString();

  return expectedDv === dv;
};

/**
 * Formatea un RUT a su forma 12.345.678-K en tiempo real.
 */
export const formatRut = (value: string): string => {
  // Limpiar caracteres no permitidos y quitar ceros iniciales
  const cleanValue = value.replace(/[^0-9kK]/g, "");
  if (cleanValue.length === 0) return "";

  // Quitar ceros a la izquierda del cuerpo (pero no si es solo "0")
  let actualValue = cleanValue;
  if (actualValue.length > 1 && actualValue.startsWith("0")) {
    actualValue = actualValue.replace(/^0+/, "");
    // Si quedó vacío por error o era todo ceros y un DV, al menos dejar el DV
    if (actualValue.length === 0) actualValue = cleanValue.slice(-1);
  }

  if (actualValue.length === 1) return actualValue.toUpperCase();

  const body = actualValue.slice(0, -1);
  const dv = actualValue.slice(-1).toUpperCase();

  // Agregar puntos cada 3 dígitos y el guion
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};

/**
 * Limpia el RUT de puntos y guiones para guardarlo en la base de datos (opcional).
 */
export const cleanRut = (value: string): string => {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
};
