import { useAuthStore } from './store/authStore';

export const logout = () => {
  // 🔥 PAKE STORE, BUKAN LOCALSTORAGE
  useAuthStore.getState().logout();
};

export const getToken = () => {
  // 🔥 TOKEN DI COOKIE, GA BISA DIAKSES JAVASCRIPT
  // Kembalikan null (middleware/backend yang handle)
  return null;
};

export const getUser = () => {
  // 🔥 PAKE STORE
  return useAuthStore.getState().user;
};

export const isAuthenticated = () => {
  // 🔥 PAKE STORE
  return useAuthStore.getState().isAuthenticated;
};