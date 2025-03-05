const { default: axios } = require("axios");

export const BASE_URL = "https://connectx-3was.onrender.com";
export const clientServer = axios.create({
  baseURL: BASE_URL,
});
