import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Add user ID header (temporary until JWT is implemented)
    if (user.id) {
      config.headers['X-User-Id'] = user.id;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Return the data directly from the response
    return response.data;
  },
  (error) => {
    // Handle error responses
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default apiClient;
