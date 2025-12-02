import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getFavorites, toggleFavorite as toggleFavoriteDb, getProductById } from "@/lib/firebase";
import type { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FavoritesContextType {
  favoriteIds: string[];
  favorites: Product[];
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshFavorites = async () => {
    if (!user) {
      setFavoriteIds([]);
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const favData = await getFavorites(user.id);
      const ids = favData?.productIds || [];
      setFavoriteIds(ids);

      if (ids.length > 0) {
        const products = await Promise.all(
          ids.map(id => getProductById(id))
        );
        setFavorites(products.filter((p): p is Product => p !== null));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, [user]);

  const isFavorite = (productId: string) => favoriteIds.includes(productId);

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast({
        title: "Giriş yapın",
        description: "Favorilere eklemek için lütfen giriş yapın.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newIds = await toggleFavoriteDb(user.id, productId);
      setFavoriteIds(newIds);

      if (newIds.includes(productId)) {
        const product = await getProductById(productId);
        if (product) {
          setFavorites(prev => [...prev, product]);
        }
        toast({
          title: "Favorilere eklendi",
          description: "Ürün favorilerinize eklendi.",
        });
      } else {
        setFavorites(prev => prev.filter(p => p.id !== productId));
        toast({
          title: "Favorilerden kaldırıldı",
          description: "Ürün favorilerinizden kaldırıldı.",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favorites,
        loading,
        isFavorite,
        toggleFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
