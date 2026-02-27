"use server";

import PocketBase from "pocketbase";

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
    establecimiento: string | null;
    emailVisibility: boolean;
}

export interface UpdateUserPayload {
    name: string;
    email: string;
    password?: string;
    passwordConfirm?: string;
    role: string;
    establecimiento: string | null;
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
    try {
        // Authenticate as admin to bypass verified restrictions
        await pb.admins.authWithPassword(
            process.env.PB_ADMIN_EMAIL!,
            process.env.PB_ADMIN_PASSWORD!,
        );

        await pb.collection("users").create({
            ...payload,
            verified: true,
        });

        return { success: true };
    } catch (error: any) {
        const detail = error.response?.data
            ? JSON.stringify(error.response.data)
            : error.message;
        return { success: false, error: detail };
    }
}

/**
 * Updates an existing user.
 */
export async function updateUserAction(id: string, payload: UpdateUserPayload): Promise<ActionResult> {
    const pb = getAdminPb();
    try {
        // Authenticate as admin to allow updating protected fields
        await pb.admins.authWithPassword(
            process.env.PB_ADMIN_EMAIL!,
            process.env.PB_ADMIN_PASSWORD!,
        );

        await pb.collection("users").update(id, payload);

        return { success: true };
    } catch (error: any) {
        const detail = error.response?.data
            ? JSON.stringify(error.response.data)
            : error.message;
        return { success: false, error: detail };
    }
}
