import { ClientResponseError } from "pocketbase";

/**
 * Translates PocketBase error messages and field validations into user-friendly Spanish.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    const data = error.response?.data;

    // Check for specific field validation errors
    if (data && typeof data === "object") {
      // Common field mappings to friendly names
      const fieldNames: Record<string, string> = {
        email: "El correo electrónico",
        password: "La contraseña",
        passwordConfirm: "La confirmación de la contraseña",
        name: "El nombre",
        role: "El rol",
        establecimiento: "El establecimiento",
        cantidad: "La cantidad",
        protocolo: "El protocolo",
        meses: "El mes",
      };

      // Extract the first error message found in the data object
      for (const [field, details] of Object.entries(data)) {
        if (details && typeof details === "object" && "code" in details) {
          const errorDetail = details as { code: string; message?: string };
          const friendlyField = fieldNames[field] || field;

          switch (errorDetail.code) {
            case "validation_not_unique":
              return `${friendlyField} ya está en uso.`;
            case "validation_required":
              return `${friendlyField} es obligatorio.`;
            case "validation_invalid_email":
              return "El formato del correo electrónico no es válido.";
            case "validation_invalid_url":
              return "El formato de la URL no es válido.";
            case "validation_out_of_range":
              return `${friendlyField} está fuera del rango permitido.`;
            case "validation_length_out_of_range":
              return `${friendlyField} debe tener una longitud válida.`;
            case "validation_values_list":
              return `El valor de ${friendlyField} no es válido.`;
          }

          if (errorDetail.message) {
            return `${friendlyField}: ${translateTechnicalTerms(errorDetail.message)}`;
          }
        }
      }
    }

    // General error codes
    switch (error.status) {
      case 400:
        return "La solicitud es incorrecta. Por favor, verifica los datos e intenta de nuevo.";
      case 401:
        return "No tienes autorización para realizar esta acción.";
      case 403:
        return "No tienes permisos suficientes para realizar esta acción.";
      case 404:
        return "El recurso solicitado no fue encontrado.";
      case 429:
        return "Demasiadas solicitudes. Por favor, espera un momento antes de reintentar.";
      case 500:
        return "Hubo un error interno en el servidor. Por favor, contacta al soporte técnico.";
    }

    return translateTechnicalTerms(error.message);
  }

  if (error instanceof Error) {
    return translateTechnicalTerms(error.message);
  }

  return String(error || "Ha ocurrido un error inesperado.");
}

/**
 * Helper to translate common technical terms found in error messages.
 */
function translateTechnicalTerms(message: string): string {
  let translated = message;

  const translations: Record<string, string> = {
    "Failed to authenticate as admin.": "Error al autenticar como administrador.",
    "The requested resource wasn't found.": "El recurso solicitado no fue encontrado.",
    "Something went wrong while processing your request.": "Algo salió mal al procesar su solicitud.",
    "Missing required environment variables for admin authentication.":
      "Faltan variables de entorno necesarias para la autenticación de administrador.",
    "identity already exists": "ya existe una cuenta con estos datos",
    "unique constraint failed": "ya existe un registro con este valor",
  };

  for (const [search, replace] of Object.entries(translations)) {
    if (translated.includes(search)) {
      translated = translated.replace(new RegExp(search, "gi"), replace);
    }
  }

  return translated;
}
