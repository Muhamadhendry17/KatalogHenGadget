import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'hengadget_cart';

const cartKeyOf = (item) =>
  item.cartKey || `${item.id}::${String(item.varian || '').trim()}`;

function readStoredCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && item.id && Number.isFinite(Number(item.price)))
      .map((item) => ({
        ...item,
        cartKey: cartKeyOf(item),
        price: Number(item.price),
        qty: Math.max(1, Math.min(99, Math.round(Number(item.qty) || 1))),
      }));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Abaikan bila penyimpanan browser penuh atau diblokir.
    }
  }, [items]);

  const addItem = (product) => {
    const cartKey = cartKeyOf(product);
    setItems((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey ? { ...i, qty: Math.min(99, i.qty + 1) } : i
        );
      }
      return [...prev, { ...product, cartKey, qty: 1 }];
    });
  };

  const removeItem = (cartKey) => {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  };

  const updateQty = (cartKey, qty) => {
    if (qty <= 0) {
      removeItem(cartKey);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.cartKey === cartKey ? { ...i, qty: Math.min(99, qty) } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, total, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
