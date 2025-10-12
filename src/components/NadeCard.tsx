// snippet: NadeCard.tsx (o dentro MapCard si muestras nades)
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/hooks/useFavorites";
import { NadeDoc } from "@/lib/types";

export default function NadeCard({ nade }: { nade: NadeDoc }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { isFavorite, toggleFavorite } = useFavorites(uid);

  return (
    <div className="relative p-2 bg-neutral-800 rounded">
      

      <h4 className="font-semibold">{nade.title}</h4>
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!user) {
              alert("Inicia sesión");
              return;
            }
            toggleFavorite(nade.id);
          }}
          className="p-1 rounded-full"
          title={isFavorite(nade.id) ? "Quitar favorito" : "Añadir favorito"}
        >
          <span>{isFavorite(nade.id) ? "💖" : "🤍"}</span>
        </button>
      </div>
    </div>
  );
}
