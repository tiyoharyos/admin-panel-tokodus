// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "https://apitokodus.multigraharadhika.co.id",
  withCredentials: true, // kalau pakai cookie / auth
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;