import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  weight: string;
  image: string;
  category?: string;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  totalQuantity: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItemToCart(state, action: PayloadAction<Omit<CartItem, 'quantity'>>) {
      const newItem = action.payload;
      const existingItem = state.items.find((item) => item.id === newItem.id);
      state.totalQuantity++;
      if (!existingItem) {
        state.items.push({
          ...newItem,
          quantity: 1,
        });
      } else {
        existingItem.quantity++;
      }
      state.totalAmount += newItem.price;
    },
    removeItemFromCart(state, action: PayloadAction<number | string>) {
      const id = action.payload;
      const existingItem = state.items.find((item) => item.id === id);
      state.totalQuantity--;
      if (existingItem) {
        state.totalAmount -= existingItem.price;
        if (existingItem.quantity === 1) {
          state.items = state.items.filter((item) => item.id !== id);
        } else {
          existingItem.quantity--;
        }
      }
    },
    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
    },
    hydrateCart(state, action: PayloadAction<CartState>) {
      state.items = action.payload.items;
      state.totalAmount = action.payload.totalAmount;
      state.totalQuantity = action.payload.totalQuantity;
    },
  },
});

export const { addItemToCart, removeItemFromCart, clearCart, hydrateCart } = cartSlice.actions;
export default cartSlice.reducer;
