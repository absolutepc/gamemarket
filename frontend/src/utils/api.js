import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const token = auth?.state?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

function isAuthRefreshSkipped(url = '') {
  // Do not try session refresh on credential / oauth / refresh endpoints
  return /\/auth\/(login|register|refresh|logout|vk|apple|google)/.test(url);
}

function getAuthStore() {
  // Lazy require avoids circular import with authStore → api
  // eslint-disable-next-line global-require
  return require('../store/authStore').default;
}

function persistAccessToken(token) {
  const stored = JSON.parse(localStorage.getItem('auth') || '{}');
  if (stored?.state) {
    stored.state.accessToken = token;
    localStorage.setItem('auth', JSON.stringify(stored));
  }
  try {
    getAuthStore().getState().setToken(token);
  } catch {
    /* store may be unavailable during early boot */
  }
}

function clearSessionAndRedirect() {
  try {
    getAuthStore().setState({ user: null, accessToken: null });
  } catch {
    /* ignore */
  }
  localStorage.removeItem('auth');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (!original || err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }
    if (isAuthRefreshSkipped(original.url || '')) {
      return Promise.reject(err);
    }

    // No access token → guest or already logged out; don't wipe / hard-redirect
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (!auth?.state?.accessToken) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      const token = data.accessToken;
      persistAccessToken(token);
      queue.forEach((p) => p.resolve(token));
      queue = [];
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshErr) {
      queue.forEach((p) => p.reject(refreshErr));
      queue = [];
      clearSessionAndRedirect();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
