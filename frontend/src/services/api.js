import axios from "axios";

const DEFAULT_API_URL = "https://skill-swap-backend-1bz4.onrender.com/api";
const API_BASE_URL = process.env.REACT_APP_API_URL || DEFAULT_API_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
});

export const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");
export default API;