import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { authApi } from '../api/auth.api';
import { setAuthFailureHandler } from '../api/client';
import { connectSocket, disconnectSocket } from '../socket/useSocket';
import { tokenStorage } from '../storage/tokenStorage';
import type { LoginRequest, SignupRequest, User } from '../types/auth';

type AuthState = {
  user: User | null;
  isLoading: boolean;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
};

type AuthAction =
  | { type: 'BOOTSTRAP_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'BOOTSTRAP_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        user: action.payload,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        isLoading: false,
      };
    default:
      return state;
  }
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const handleForceLogout = useCallback(async () => {
    await tokenStorage.clear();
    disconnectSocket();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const bootstrap = useCallback(async () => {
    dispatch({ type: 'BOOTSTRAP_START' });

    const accessToken = await tokenStorage.getAccessToken();
    if (!accessToken) {
      dispatch({ type: 'LOGOUT' });
      return;
    }

    try {
      const user = await authApi.me();
      await connectSocket(accessToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch {
      await handleForceLogout();
    }
  }, [handleForceLogout]);

  useEffect(() => {
    setAuthFailureHandler(handleForceLogout);
    bootstrap();

    return () => {
      setAuthFailureHandler(null);
    };
  }, [bootstrap, handleForceLogout]);

  const login = useCallback(async (email: string, password: string) => {
    const payload: LoginRequest = { email, password };
    const response = await authApi.login(payload);
    await tokenStorage.saveTokens(response.access_token, response.refresh_token);
    await connectSocket(response.access_token);
    dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
  }, []);

  const signup = useCallback(async (payload: SignupRequest) => {
    const response = await authApi.signup(payload);
    await tokenStorage.saveTokens(response.access_token, response.refresh_token);
    await connectSocket(response.access_token);
    dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Intentionally ignored: local cleanup still needs to happen.
    }

    await handleForceLogout();
  }, [handleForceLogout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      isLoading: state.isLoading,
      isAuthenticated: !!state.user,
      login,
      signup,
      logout,
    }),
    [login, logout, signup, state.isLoading, state.user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
