const API_BASE = '/api';
const AUTH_TOKEN_KEY = 'sekar_admin_token';
const USER_AUTH_TOKEN_KEY = 'sekar_user_token';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? 'Respons server tidak dapat dibaca.'
        : `API tidak tersedia (HTTP ${response.status}).`,
    );
  }

  if (!response.ok || payload?.success === false) {
    const error = new Error(
      payload?.message || `Permintaan gagal (${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function fetchProducts() {
  return request('/products');
}

export function fetchCategories() {
  return request('/categories');
}

export function fetchStoreSettings() {
  return request('/store');
}

export async function loginAdmin(email, password) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (response.role && response.role !== 'admin') {
    throw new Error('Akun ini tidak memiliki akses administrator.');
  }
  localStorage.setItem(AUTH_TOKEN_KEY, response.token);
  return response.user;
}

export async function loginAccount(email, password) {
  let response;
  let role;

  try {
    response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    role = response.role ?? 'admin';
  } catch (error) {
    if (error.status !== 401) throw error;

    response = await request('/auth/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    role = 'user';
  }

  if (role !== 'admin' && role !== 'user') {
    throw new Error('Peran akun tidak dikenali. Silakan hubungi administrator.');
  }

  clearAuthToken();
  clearUserAuthToken();
  localStorage.setItem(
    role === 'admin' ? AUTH_TOKEN_KEY : USER_AUTH_TOKEN_KEY,
    response.token,
  );
  return { role, user: response.user };
}

export async function registerUser(name, email, password) {
  const response = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  localStorage.setItem(USER_AUTH_TOKEN_KEY, response.token);
  return response.user;
}

export async function loginUser(email, password) {
  const response = await request('/auth/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(USER_AUTH_TOKEN_KEY, response.token);
  return response.user;
}

export async function fetchUserProfile() {
  const token = getUserAuthToken();
  if (!token) return null;

  try {
    const response = await request('/auth/user/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.status === 401 || error.status === 403 || error.status === 404) {
      clearUserAuthToken();
      return null;
    }
    throw error;
  }
}

export function clearUserAuthToken() {
  localStorage.removeItem(USER_AUTH_TOKEN_KEY);
}

export function getUserAuthToken() {
  return localStorage.getItem(USER_AUTH_TOKEN_KEY);
}

export async function fetchAdminProfile() {
  const token = getAuthToken();
  if (!token) return null;

  const response = await request('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new Error('Silakan masuk sebagai admin terlebih dahulu.');
  return { Authorization: `Bearer ${token}` };
}

export function saveProduct(product, id) {
  const body = new FormData();
  body.set('name', product.name);
  body.set('categoryId', product.categoryId);
  body.set('price', String(product.price));
  body.set('stock', String(product.stock));
  body.set('description', product.description || '');
  if (product.badge !== undefined) body.set('badge', product.badge);
  if (product.image instanceof File) {
    body.set('image', product.image);
  } else if (product.image) {
    body.set('imageurl', product.image);
  }

  return request(id ? `/products/${encodeURIComponent(id)}` : '/products', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body,
  });
}

export function deleteProduct(id) {
  return request(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export function toggleProductStock(id) {
  return request(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
}

export function saveCategory(category, id) {
  return request(id ? `/categories/${encodeURIComponent(id)}` : '/categories', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(category),
  });
}

export function deleteCategory(id) {
  return request(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
