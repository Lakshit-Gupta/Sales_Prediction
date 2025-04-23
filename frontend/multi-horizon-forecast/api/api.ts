import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth and Forecast API (single base URL for consistency)
const api: AxiosInstance = axios.create({
  baseURL: 'https://multi-horizon-forecast.onrender.com',
});

// Add JWT token to API requests
const addTokenInterceptor = async (config: any) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(addTokenInterceptor);

export const authApi = api;
export const forecastApi = api;

interface RegisterResponse {
  message: string;
}

interface LoginResponse {
  access_token: string;
}

interface RegisterError {
  error: string;
}

interface LoginError {
  error: string;
}

export const register = async (
  email: string,
  password: string,
  storeName: string
): Promise<RegisterResponse> => {
  try {
    const response = await authApi.post<RegisterResponse>('/register', {
      email,
      password,
      store_name: storeName,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Registration failed' };
  }
};

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await authApi.post<LoginResponse>('/login', { email, password });
    const { access_token } = response.data;
    await AsyncStorage.setItem('access_token', access_token);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Login failed' };
  }
};