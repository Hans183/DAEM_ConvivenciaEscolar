"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { FileText, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUser } from "@/hooks/use-user";
import { pb } from "@/lib/pocketbase";

interface SearchResult {
  id: string;
  nombre_estudiante: string;
  nombre_apoderado: string;
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  
  const router = useRouter();
  const user = useUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const estFilter = !isAdmin && user?.establecimiento ? `establecimiento = "${user.establecimiento}"` : "";
        const searchFilter = `(nombre_estudiante ~ "${query}" || nombre_apoderado ~ "${query}")`;
        const filter = estFilter ? `(${estFilter}) && ${searchFilter}` : searchFilter;

        const records = await pb.collection("DEC").getList(1, 5, {
          filter,
          sort: "-created",
        });
        setResults(records.items as unknown as SearchResult[]);
      } catch (err: unknown) {
        const error = err as { isAbort?: boolean };
        if (!error.isAbort) {
          console.error("Search error:", error);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, open, isAdmin, user]);

  const handleSelect = (id: string) => {
    setOpen(false);
    router.push(`/dashboard/dec?decId=${id}`);
  };

  return (
    <>
      <Button
        variant="link"
        className="!px-0 font-normal text-muted-foreground hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Buscar
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Buscar estudiante o apoderado en DEC..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center p-6 text-muted-foreground text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          )}
          {!loading && results.length > 0 && (
            <CommandGroup heading="Documentos DEC">
              {results.map((item) => (
                <CommandItem 
                  key={item.id} 
                  value={`${item.id} ${item.nombre_estudiante} ${item.nombre_apoderado}`}
                  onSelect={() => handleSelect(item.id)}
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.nombre_estudiante}</span>
                  <span className="ml-2 text-muted-foreground text-xs">
                    Apoderado: {item.nombre_apoderado}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
