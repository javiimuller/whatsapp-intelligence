"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteBrand } from "@/lib/actions";

export function DeleteBrandButton({ brandId, brandName }: { brandId: string; brandName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const confirmed = window.confirm(
          `¿Eliminar la marca "${brandName}"? Esta acción borra sus diagnósticos, conversaciones, reportes y conexión WhatsApp.`
        );
        if (confirmed) {
          startTransition(() => {
            void deleteBrand(brandId);
          });
        }
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-400/20 disabled:opacity-50"
    >
      <Trash2 size={15} />
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
