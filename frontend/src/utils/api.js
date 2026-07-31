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

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
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
        // Update store
        const stored = JSON.parse(localStorage.getItem('auth') || '{}');
        if (stored?.state) {
          stored.state.accessToken = token;
          localStorage.setItem('auth', JSON.stringify(stored));
        }
        queue.forEach((p) => p.resolve(token));
        queue = [];
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshErr) {
        queue.forEach((p) => p.reject(refreshErr));
        queue = [];
        localStorage.removeItem('auth');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
