import Link from "next/link";

import { Command } from "lucide-react";

import { LoginForm } from "../_components/login-form";
import { GoogleButton } from "../_components/social-auth/google-button";

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <img src="/img/logo-daem.svg" alt="Logo DAEM" className="mx-auto h-84 w-auto" />
            <div className="space-y-2 text-white">
              <p className="text-white text-2xl font-bold tracking-tight">CONVIVENCIA ESCOLAR</p>
              <p className="text-white text-lg font-bold">DAEM LA UNION</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="mx-auto max-w-xl text-muted-foreground">
              <h1 className="text-2xl font-bold">Bienvenido al Sistema de Convivencia Escolar DAEM La Union.</h1>
            </div>
          </div>
          <div className="space-y-4">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
