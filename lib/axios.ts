import axios from 'axios'
import { getToken } from './auth'

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

instance.interceptors.request.use(
  (config) => {
    const token = getToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

export default instance
