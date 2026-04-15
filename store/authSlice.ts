import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserType = 'owner' | 'customer' | 'guest' | null;

interface AuthState {
  user: any | null;
  token: string | null;
  userType: UserType;
  isAuthenticated: boolean;
  language: 'ar' | 'en';
  selectedChalet: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  userType: null,
  isAuthenticated: false,
  language: 'ar',
  selectedChalet: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: any; token: string; userType: UserType }>
    ) => {
      const { user, token, userType } = action.payload;
      state.user = user;
      state.token = token;
      state.userType = userType;
      state.isAuthenticated = true;
    },
    setUserType: (state, action: PayloadAction<UserType>) => {
      state.userType = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'ar' | 'en'>) => {
      state.language = action.payload;
    },
    setSelectedChalet: (state, action: PayloadAction<AuthState['selectedChalet']>) => {
      state.selectedChalet = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userType = null;
      state.isAuthenticated = false;
      state.selectedChalet = null;
    },
  },
});

export const { setCredentials, setUserType, setLanguage, setSelectedChalet, logout } = authSlice.actions;

export default authSlice.reducer;
