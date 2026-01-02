import { create } from "zustand";

interface AccessTokenType {
  accessToken: string;
  setAccessToken: (state: string) => void;
}

interface SidebarType {
  sidebar: boolean;
  setSidebar: (state: boolean) => void;
}

interface User {
  index: number;
  usr_name: string;
  usr_id: string;
  usr_role: string;
  center_id: number;
  center_name: string;
}

interface UserType {
  user: User;
  setUser: (state: User) => void;
}

export const useTokenStore = create<AccessTokenType>((set) => ({
  accessToken: "",
  setAccessToken: (state) => set({ accessToken: state }),
}));

export const useSidebarStore = create<SidebarType>((set) => ({
  sidebar: true,
  setSidebar: (state) => set({ sidebar: state }),
}));

export const useUserStore = create<UserType>((set) => ({
  user: {
    index: 0,
    usr_name: "",
    usr_id: "",
    usr_role: "",
    center_id: 0,
    center_name: "",
  },
  setUser: (state) => set({ user: state }),
}));
