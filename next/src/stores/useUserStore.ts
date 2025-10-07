import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserDataType } from '@/types/index';


const storageName = 'user-storage';

interface UserStore {
  user: UserDataType | null;
  isAuthorized: boolean;
  login: (res: UserDataType) => void;
  updateUser: (value: UserDataType) => void;
  logout: () => void;
}

export const userStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthorized: false,
      login: (res) => set({user: res, isAuthorized: true}),
      updateUser: (res)=> set({user: res}),
      logout: () => set({user: null, isAuthorized: false}),
    }),
    {name: storageName},
  )
)