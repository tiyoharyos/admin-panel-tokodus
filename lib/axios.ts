import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://jealously-tribunicial-emmett.ngrok-free.dev/Api_TokoDus',
  withCredentials: false,
});

export default axiosInstance;