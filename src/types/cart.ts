// Types para el carrito
export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl: string;
  weight?: number;
  sliced: boolean;
  maxStock: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateSliced: (productId: string, sliced: boolean) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
}
