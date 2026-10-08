const TOKEN_STORAGE_KEY = 'lavanta_jwt_token';

export function getAuthToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Prepend /api if not already included and is a relative endpoint
  const targetUrl = endpoint.startsWith('http') || endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(targetUrl, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      // Only redirect to login if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

apiClient.get = async function<T = any>(
  endpoint: string,
  config?: { params?: Record<string, any>; headers?: Record<string, string>; responseType?: string }
): Promise<{ data: T }> {
  let url = endpoint;
  if (config?.params) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null) sp.append(k, String(v));
    }
    const qs = sp.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }
  const data = await apiClient<T>(url, { method: 'GET', headers: config?.headers });
  return { data };
};

apiClient.post = async function<T = any>(
  endpoint: string,
  body?: any,
  config?: { headers?: Record<string, string> }
): Promise<{ data: T }> {
  const data = await apiClient<T>(endpoint, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: config?.headers
  });
  return { data };
};

apiClient.put = async function<T = any>(
  endpoint: string,
  body?: any,
  config?: { headers?: Record<string, string> }
): Promise<{ data: T }> {
  const data = await apiClient<T>(endpoint, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: config?.headers
  });
  return { data };
};

apiClient.delete = async function<T = any>(
  endpoint: string,
  config?: { headers?: Record<string, string> }
): Promise<{ data: T }> {
  const data = await apiClient<T>(endpoint, { method: 'DELETE', headers: config?.headers });
  return { data };
};
