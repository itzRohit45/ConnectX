import axios from "axios";
import { BASE_URL } from "./index";

// Create an instance of axios with a base URL
const clientServer = axios.create({
  baseURL: BASE_URL,
});

// Add request interceptor for debugging
clientServer.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log(
      `🔽 API Request: ${config.method.toUpperCase()} ${config.url}`,
      config.params || config.data
    );
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
clientServer.interceptors.response.use(
  (response) => {
    console.log(
      `🔼 API Response: ${response.status} ${response.statusText}`,
      response.data
    );
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        `❌ API Error ${error.response.status}:`,
        error.response.data,
        `URL: ${error.config.baseURL}${error.config.url}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error("❌ No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("❌ Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default clientServer;
