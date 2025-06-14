const { default: axios } = require("axios");

// Use local server for development
export const BASE_URL = "https://connectx-3was.onrender.com";

export const clientServer = axios.create({
  baseURL: BASE_URL,
});
