const API = {
  async request(path, options = {}) {
    const res = await fetch(`/api${path}`, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  },
  get: (path) => API.request(path),
  post: (path, body) => API.request(path, { method: "POST", body }),
  put: (path, body) => API.request(path, { method: "PUT", body }),
  patch: (path, body) => API.request(path, { method: "PATCH", body }),
};

window.API = API;
