// src/config.js
const API_URL = import.meta.env.MODE === "production" 
  ? import.meta.env.VITE_API_URL_PROD 
  : import.meta.env.VITE_API_URL;

const SOCKET_URL = import.meta.env.MODE === "production" 
  ? import.meta.env.VITE_SOCKET_URL_PROD 
  : import.meta.env.VITE_SOCKET_URL;

const FRONTEND_URL = import.meta.env.MODE === "production" 
  ? import.meta.env.VITE_FRONTEND_URL_PROD 
  : import.meta.env.VITE_FRONTEND_URL;

const WEB_NAME = "MenuDigital";

console.log("Environment:", import.meta.env.MODE);
console.log("API_URL:", API_URL);

export { API_URL, SOCKET_URL, FRONTEND_URL, WEB_NAME };