// services/auth.service.ts unutk login/logout dan manajemen token
import axios from '@/lib/axios'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
}

export const loginService = async (
  data: LoginPayload
): Promise<LoginResponse> => {
  const response = await axios.post('/Auth/login', data)
  return response.data
}
