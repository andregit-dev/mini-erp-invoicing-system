import { useAuthStore } from './store/authStore';

export const logout = () => {
  useAuthStore.getState().logout();
};

export const getUser = () => {
  return useAuthStore.getState().user;
};

export const isAuthenticated = () => {
  return useAuthStore.getState().isAuthenticated;
};
