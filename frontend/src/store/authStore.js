import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setAuth: (user, accessToken) => set({ user, accessToken }),
      setUser: (user) => set({ user }),
      setToken: (accessToken) => set({ accessToken }),

      /** Refresh profile from API so localStorage never stays without id/username */
      hydrateUser: async () => {
        const token = get().accessToken;
        if (!token) return null;
        try {
          const { data } = await api.get('/auth/me');
          if (data?.user) {
            set({ user: data.user });
            return data.user;
          }
        } catch {
          /* keep existing session; 401 handled by api interceptor */
        }
        return get().user;
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        set({ user: null, accessToken: null });
      },

      refreshToken: async () => {
        try {
          const { data } = await api.post('/auth/refresh');
          set({ accessToken: data.accessToken });
          return data.accessToken;
        } catch {
          set({ user: null, accessToken: null });
          return null;
        }
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);

export default useAuthStore;
