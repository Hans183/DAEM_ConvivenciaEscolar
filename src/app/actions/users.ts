"use server";

import PocketBase, { ClientResponseError } from "pocketbase";

// Initialize a server-side PocketBase instance using environment variables
function getAdminPb() {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "https://apiconvivencia.daemlu.cl";
  return new PocketBase(url);
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: string;
  establecimiento: string[] | null;
  emailVisibility: boolean;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  password?: string;
  passwordConfirm?: string;
  role: string;
  establecimiento: string[] | null;
  emailVisibility: boolean;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Creates a new user and immediately marks them as verified.
 * Requires PocketBase admin credentials in environment variables.
 */
export async function createUserAction(payload: CreateUserPayload): Promise<ActionResult> {
  const pb = getAdminPb();
  
  const adminEmail = process.env.PB_ADMIN_EMAIL;
  const adminPassword = process.env.PB_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return { success: false, error: "Missing required environment variables for admin authentication." };
  }

  try {
    // Authenticate as admin to bypass verified restrictions
    await pb.admins.authWithPassword(adminEmail, adminPassword);

    await pb.collection("users").create({
      ...payload,
      verified: true,
    });

    return { success: true };
  } catch (error) {
    let detail = "An unknown error occurred";
    if (error instanceof ClientResponseError) {
      detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    } else if (error instanceof Error) {
      detail = error.message;
    } else {
      detail = String(error);
    }
    return { success: false, error: detail };
  }
}

/**
 * Updates an existing user.
 */
export async function updateUserAction(id: string, payload: UpdateUserPayload): Promise<ActionResult> {
  const pb = getAdminPb();

  const adminEmail = process.env.PB_ADMIN_EMAIL;
  const adminPassword = process.env.PB_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return { success: false, error: "Missing required environment variables for admin authentication." };
  }

  try {
    // Authenticate as admin to allow updating protected fields
    await pb.admins.authWithPassword(adminEmail, adminPassword);

    await pb.collection("users").update(id, payload);

    return { success: true };
  } catch (error) {
    let detail = "An unknown error occurred";
    if (error instanceof ClientResponseError) {
      detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    } else if (error instanceof Error) {
      detail = error.message;
    } else {
      detail = String(error);
    }
    return { success: false, error: detail };
  }
}
