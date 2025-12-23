import { auth } from './auth';

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const authHeaders = auth.getAuthHeaders();
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Blog endpoints
  async getBlogs() {
    return this.request('/blogs');
  }

  async getBlog(id: string) {
    return this.request(`/blogs/${id}`);
  }

  async saveDraft(title: string, content: string, tags: string[]) {
    return this.request('/blogs/save-draft', {
      method: 'POST',
      body: JSON.stringify({ title, content, tags }),
    });
  }

  async publishBlog(title: string, content: string, tags: string[]) {
    return this.request('/blogs/publish', {
      method: 'POST',
      body: JSON.stringify({ title, content, tags }),
    });
  }

  async updateBlog(id: string, updates: { title?: string; content?: string; tags?: string[]; status?: string }) {
    return this.request(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBlog(id: string) {
    return this.request(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }

  async searchBlogs(query: string) {
    return this.request(`/blogs/search?query=${encodeURIComponent(query)}`);
  }
}

export const api = new ApiClient();
