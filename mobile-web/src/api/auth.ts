import { apiClient } from './client';
import type { User } from '../types/models';

export interface LoginResult {
  two_factor_required?: boolean;
  challenge?: string;
  user?: User;
  token?: string;
}

export async function login(loginValue: string, password: string): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>('/auth/login', { login: loginValue, password });
  return data;
}

export interface RegisterInput {
  company_name: string;
  currency_symbol?: string;
  name: string;
  email?: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export async function register(payload: RegisterInput): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>('/auth/register', payload);
  return data;
}

export async function verifyTwoFactor(challenge: string, code: string): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>('/auth/2fa/verify', { challenge, code });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
