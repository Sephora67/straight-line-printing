import type { DesignSnapshot } from "@/lib/production-spec";

export type CartLine = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  colorName: string;
  colorHex: string | null;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
  image: string | null;
  designNote?: string;
  /** frozen production configuration captured in the Design Studio */
  snapshot?: DesignSnapshot;
};

const KEY = "slp-cart-v1";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("slp-cart-change"));
}

export function addToCart(line: Omit<CartLine, "id">) {
  const lines = readCart();
  const match = lines.find(
    (l) =>
      l.productId === line.productId &&
      l.colorName === line.colorName &&
      l.sizeLabel === line.sizeLabel &&
      l.designNote === line.designNote,
  );
  if (match) match.quantity += line.quantity;
  else lines.push({ ...line, id: crypto.randomUUID() });
  write(lines);
}

export function updateQuantity(id: string, quantity: number) {
  const lines = readCart()
    .map((l) => (l.id === id ? { ...l, quantity } : l))
    .filter((l) => l.quantity > 0);
  write(lines);
}

export function removeLine(id: string) {
  write(readCart().filter((l) => l.id !== id));
}

export function clearCart() {
  write([]);
}
