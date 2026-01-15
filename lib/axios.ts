import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://192.168.18.14:8080/Api_TokoDus/',
  withCredentials: false,
});

export default axiosInstance;