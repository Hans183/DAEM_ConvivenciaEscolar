"use client";

import { useEffect, useState } from "react";
import type { AuthModel } from "pocketbase";

import { pb } from "@/lib/pocketbase";

export function useUser() {
    const [user, setUser] = useState<AuthModel | null>(null);

    useEffect(() => {
        // Initialize state on client side only
        setUser(pb.authStore.model);

        /* 
           Keep the local state in sync with the PocketBase auth store.
           This will trigger a re-render whenever the auth state changes (login/logout).
        */
        return pb.authStore.onChange((token: string, model: AuthModel | null) => {
            setUser(model || pb.authStore.model);
        });
    }, []);

    return user;
}
