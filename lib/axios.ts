import axios from 'axios';
import { getToken } from './auth'

const instance = axios.create({
  baseURL: 'http://192.168.18.14:8080/Api_TokoDus/',
  withCredentials: false,
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