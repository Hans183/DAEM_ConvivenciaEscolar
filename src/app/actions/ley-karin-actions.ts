"use server";

import { denunciaKarinSchema } from "../(external)/ley-karin/denuncia/schema";
import { Resend } from "resend";
import DenunciaRecibidaEmail from "@/components/emails/denuncia-recibida-email";
import AlertaLeyKarinEmail from "@/components/emails/alerta-ley-karin-email";
import * as React from "react";
import { pb } from "@/lib/pocketbase";
import { RecaptchaError, verifyRecaptchaToken } from "@/lib/recaptcha";
import PocketBase from "pocketbase";

function getAdminPb() {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "https://apiconvivencia.daemlu.cl";
  const adminPb = new PocketBase(url);
  adminPb.beforeSend = (url, options) => {
    options.cache = "no-store";
    return { url, options };
  };
  return adminPb;
}

export async function getEstablecimientosKarin() {
  try {
    const adminPb = getAdminPb();
    const adminEmail = process.env.PB_ADMIN_EMAIL;
    const adminPassword = process.env.PB_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return { success: false, error: "Missing required environment variables for admin authentication." };
    }

    await adminPb.admins.authWithPassword(adminEmail, adminPassword);

    const records = await adminPb.collection("establecimientos").getFullList({
      sort: "nombre",
    });

    // Extract only necessary data (id, nombre) to pass to client
    const establecimientos = records.map(record => ({
      id: record.id,
      nombre: record.nombre,
    }));

    return { success: true, data: establecimientos };
  } catch (error) {
    console.error("Error fetching establecimientos:", error);
    return { success: false, error: "Error al cargar establecimientos." };
  }
}


// Si la env var de Resend no está presente, se creará una instancia mock o fallback?
// Generalmente `new Resend(...)` espera la env var en el construtor.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function submitDenunciaKarin(formData: FormData) {
  try {
    // --- reCAPTCHA verification (must be first) ---
    const recaptchaToken = formData.get("recaptchaToken");
    formData.delete("recaptchaToken"); // Remove before passing to PocketBase

    if (!recaptchaToken || typeof recaptchaToken !== "string") {
      return { error: "Token de verificación de seguridad requerido." };
    }

    try {
      const score = await verifyRecaptchaToken(recaptchaToken, "denuncia_karin", 0.4);
      console.log(`[reCAPTCHA] Denuncia Ley Karin score: ${score}`);
    } catch (err) {
      if (err instanceof RecaptchaError) {
        console.warn(`[reCAPTCHA] Denuncia rechazada: ${err.message}`);
        return { error: "Verificación de seguridad fallida. Por favor recarga la página e intenta de nuevo." };
      }
      throw err;
    }
    // --- Fin verificación reCAPTCHA ---

    const rawData = Object.fromEntries(formData.entries());
    
    // Zod parsing (Convert boolean str to boolean to match schema)
    const dataToValidate = {
      ...rawData,
      firmaAnonima: rawData.firmaAnonima === "true",
    };
    
    const validatedData = denunciaKarinSchema.parse(dataToValidate);

    // Conectar a PocketBase e insertar los datos
    // Modificamos el formData original que trae los archivos y añadimos el estado por defecto
    formData.append("estado", "Ingresada");
    
    // Añadir la fecha de creación en el momento exacto del envío
    formData.append("createdAt", new Date().toISOString());
    
    // Pocketbase maneja FormData nativamente para soportar subidas de archivos (evidencia)
    await pb.collection("denuncias_ley_karin").create(formData);

    const fechaEnvio = new Date().toLocaleDateString("es-CL", { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Enviar correo de acuse de recibo si hay clave de Resend y proporcionó correo
    if (resend && validatedData.correoDenunciante) {
      await resend.emails.send({
        from: "Convivencia Escolar <noreply@updates.daemlu.cl>", // Usando el subdominio verificado en Resend
        to: [validatedData.correoDenunciante],
        subject: "Confirmación de Recepción - Ley Karin",
        react: React.createElement(DenunciaRecibidaEmail, {
          nombresDenunciante: validatedData.nombresDenunciante,
          materia: validatedData.materia,
          fecha: fechaEnvio,
          anonima: validatedData.firmaAnonima,
        }),
      });
    }

    // Enviar correo de notificación a los encargados de Ley Karin
    if (resend) {
      try {
        const adminPb = getAdminPb();
        const adminEmail = process.env.PB_ADMIN_EMAIL;
        const adminPassword = process.env.PB_ADMIN_PASSWORD;

        if (adminEmail && adminPassword) {
          await adminPb.admins.authWithPassword(adminEmail, adminPassword);
          
          // Buscar usuarios que tengan el rol Ley Karin
          const users = await adminPb.collection("users").getFullList({
            filter: "role ?~ 'Ley Karin'",
          });

          const emails = users.map((u) => u.email).filter(Boolean);

          if (emails.length > 0) {
            await resend.emails.send({
              from: "Convivencia Escolar <noreply@updates.daemlu.cl>",
              to: emails,
              subject: "Nueva Denuncia recibida - Ley Karin",
              react: React.createElement(AlertaLeyKarinEmail, {}),
            });
          }
        }
      } catch (err) {
        console.error("Error enviando alerta a encargados Ley Karin:", err);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error validando/enviando denuncia:", error);
    return { error: "Los datos de la denuncia son inválidos." };
  }
}

export async function submitDenunciaKarinDashboard(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());

    const dataToValidate = {
      ...rawData,
      firmaAnonima: rawData.firmaAnonima === "true",
    };

    denunciaKarinSchema.parse(dataToValidate);

    // Set default state for new complaints
    formData.append("estado", "Ingresada");
    formData.append("createdAt", new Date().toISOString());

    await pb.collection("denuncias_ley_karin").create(formData);

    return { success: true };
  } catch (error) {
    console.error("Error enviando denuncia desde dashboard:", error);
    return { error: "Los datos de la denuncia son inválidos o hubo un error al guardar." };
  }
}

export async function updateEstadoDenunciaKarin(id: string, nuevoEstado: string) {
  try {
    await pb.collection("denuncias_ley_karin").update(id, {
      estado: nuevoEstado
    });
    return { success: true };
  } catch (error) {
    console.error("Error actualizando el estado de la denuncia:", error);
    return { error: "Error al actualizar la denuncia en la base de datos." };
  }
}
