import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getCart, updateCart, clearCart as clearCartDb, getProductById } from "@/lib/firebase";
import type { CartItem, Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CartItemWithProduct extends CartItem {
  product?: Product;
}

interface CartContextType {
  items: CartItemWithProduct[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity: number, attributes?: CartItem["attributes"], selectedColorVariantId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProductDetails = async (cartItems: CartItem[]): Promise<CartItemWithProduct[]> => {
    const itemsWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const product = await getProductById(item.productId);
        return { ...item, product: product || undefined };
      })
    );
    return itemsWithProducts;
  };

  const refreshCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const cart = await getCart(user.id).catch(err => {
        console.warn("Cart load error:", err);
        return null;
      });
      if (cart && cart.items.length > 0) {
        const itemsWithProducts = await loadProductDetails(cart.items);
        setItems(itemsWithProducts);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.warn("Cart error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (productId: string, quantity: number, attributes?: CartItem["attributes"], selectedColorVariantId?: string) => {
    if (!user) {
      toast({
        title: "Giriş yapın",
        description: "Sepete eklemek için lütfen giriş yapın.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const product = await getProductById(productId);
      if (!product) {
        toast({
          title: "Hata",
          description: "Ürün bulunamadı.",
          variant: "destructive",
        });
        return;
      }

      const existingItem = items.find(item => item.productId === productId);
      const totalQuantity = (existingItem?.quantity || 0) + quantity;

      if (totalQuantity > product.stock) {
        toast({
          title: "Stok Yetersiz",
          description: `Bu ürünün sadece ${product.stock} adet stoğu var. Sepetinizde zaten ${existingItem?.quantity || 0} adet var.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const existingIndex = items.findIndex(item => item.productId === productId);
      let newItems: CartItem[];

      if (existingIndex > -1) {
        newItems = items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity, selectedColorVariantId: selectedColorVariantId || item.selectedColorVariantId }
            : { productId: item.productId, quantity: item.quantity, attributes: item.attributes, selectedColorVariantId: item.selectedColorVariantId }
        );
      } else {
        const newItem: CartItem = { productId, quantity, attributes: attributes || {}, selectedColorVariantId };
        newItems = [...items.map(i => ({ productId: i.productId, quantity: i.quantity, attributes: i.attributes, selectedColorVariantId: i.selectedColorVariantId })), newItem];
      }

      await updateCart(user.id, newItems);
      await refreshCart();
      toast({
        title: "Sepete eklendi",
        description: "Ürün sepetinize eklendi.",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Hata",
        description: "Ürün sepete eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    setLoading(true);
    try {
      const product = await getProductById(productId);
      if (product && quantity > product.stock) {
        toast({
          title: "Stok Yetersiz",
          description: `Bu ürünün sadece ${product.stock} adet stoğu var.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const newItems = items
        .map(item =>
          item.productId === productId
            ? { productId: item.productId, quantity, attributes: item.attributes }
            : { productId: item.productId, quantity: item.quantity, attributes: item.attributes }
        )
        .filter(item => item.quantity > 0);

      await updateCart(user.id, newItems);
      await refreshCart();
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const newItems = items
        .filter(item => item.productId !== productId)
        .map(item => ({ productId: item.productId, quantity: item.quantity, attributes: item.attributes }));

      await updateCart(user.id, newItems);
      await refreshCart();
      toast({
        title: "Ürün kaldırıldı",
        description: "Ürün sepetinizden kaldırıldı.",
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearCartItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await clearCartDb(user.id);
      setItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.discountPrice || item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart: clearCartItems,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
