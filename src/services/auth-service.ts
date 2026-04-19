const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'editor' | 'viewer' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  // Login user
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const authData: AuthResponse = await response.json();

    // Store token and user data
    this.setToken(authData.token);
    this.setUser(authData.user);

    return authData;
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Set token
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Set user
  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user ? user.role === role : false;
  }

  // Check if user has admin role
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user has editor or admin role
  isEditor(): boolean {
    const user = this.getUser();
    return user ? ['admin', 'editor'].includes(user.role) : false;
  }

  // Check if user has user role
  isUser(): boolean {
    return this.hasRole('user');
  }

  // Get current user profile from API
  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout(); // Token expired
        throw new Error('Session expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user profile');
    }

    const user: User = await response.json();
    this.setUser(user); // Update stored user data
    return user;
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get users');
    }

    return response.json();
  }

  // Create new user (admin only)
  async createUser(username: string, password: string, role: 'admin' | 'editor' | 'viewer'): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    return response.json();
  }

  // Update user (admin only)
  async updateUser(id: number, username?: string, password?: string, role?: 'admin' | 'editor' | 'viewer'): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (role) updateData.role = role;

    const response = await fetch(`${API_BASE_URL}/auth/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }

    return response.json();
  }

  // Delete user (admin only)
  async deleteUser(id: number): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  }
}

export const authService = new AuthService();