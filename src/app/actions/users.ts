"use server";
// biome-ignore assist/source/organizeImports: <by happy>
import PocketBase from "pocketbase";

import { revalidatePath } from "next/cache";

import { getFriendlyErrorMessage } from "@/lib/pb-error-handler";

// Initialize a server-side PocketBase instance using environment variables
function getAdminPb() {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "https://apiconvivencia.daemlu.cl";
  const pb = new PocketBase(url);
  pb.beforeSend = (url, options) => {
    options.cache = "no-store";
    return { url, options };
  };
  return pb;
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

export interface UserRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  email: string;
  username: string;
  avatar: string;
  role: string;
  verified: boolean;
  created: string;
  establecimiento: string[];
  expand?: {
    establecimiento?: Array<{ id: string; nombre: string }>;
  };
}

export interface GetUsersResult {
  success: boolean;
  data?: UserRecord[];
  error?: string;
}

/**
 * Fetches all users with their establecimiento expanded.
 * Requires PocketBase admin credentials in environment variables.
 */
export async function getUsersAction(): Promise<GetUsersResult> {
  const pb = getAdminPb();

  const adminEmail = process.env.PB_ADMIN_EMAIL;
  const adminPassword = process.env.PB_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return { success: false, error: "Missing required environment variables for admin authentication." };
  }

  try {
    await pb.admins.authWithPassword(adminEmail, adminPassword);

    const records = await pb.collection("users").getFullList({
      sort: "-created",
      expand: "establecimiento",
    });

    return { success: true, data: records as unknown as UserRecord[] };
  } catch (error) {
    return { success: false, error: getFriendlyErrorMessage(error) };
  }
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

    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    return { success: false, error: getFriendlyErrorMessage(error) };
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

    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    return { success: false, error: getFriendlyErrorMessage(error) };
  }
}

/**
 * Deletes a user by ID.
 * Requires PocketBase admin credentials in environment variables.
 */
export async function deleteUserAction(id: string): Promise<ActionResult> {
  const pb = getAdminPb();

  const adminEmail = process.env.PB_ADMIN_EMAIL;
  const adminPassword = process.env.PB_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return { success: false, error: "Missing required environment variables for admin authentication." };
  }

  try {
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    await pb.collection("users").delete(id);

    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    return { success: false, error: getFriendlyErrorMessage(error) };
  }
}
