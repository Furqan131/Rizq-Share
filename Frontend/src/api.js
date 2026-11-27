// Address of the backend. Set VITE_API_URL in a .env file when you deploy.
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getToken = () => localStorage.getItem('token');

export async function api(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // An expired or invalid token means the person must log in again
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    if (data && data.error) throw new Error(data.error);
    if (res.status === 404) {
      throw new Error('The server does not have this feature yet. Restart the backend and check the routes in server.js.');
    }
    throw new Error('Something went wrong');
  }
  return data;
}
