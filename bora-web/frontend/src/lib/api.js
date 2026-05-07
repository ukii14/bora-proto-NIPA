import axios from "axios";

const SESSION_KEY = "sessionId";
const REDIRECT_ON_401 = "/auth/login";

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const getStoredSessionId = () => localStorage.getItem(SESSION_KEY);

export const setStoredSessionId = (sessionId) => {
  if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
  else localStorage.removeItem(SESSION_KEY);
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      setStoredSessionId(null);
      delete axios.defaults.headers.common.sessionid;
      if (onUnauthorized) onUnauthorized();
      else if (window.location.pathname !== REDIRECT_ON_401) {
        window.location.replace(REDIRECT_ON_401);
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
