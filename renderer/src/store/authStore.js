import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: async () => {
        const { token } = useAuthStore.getState()
        if (token) {
          await window.api.logout(token)
        }
        set({ token: null, user: null })
      },
    }),
    {
      name: 'school-ai-auth',
    }
  )
)
