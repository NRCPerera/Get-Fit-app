import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

/**
 * Helper to upload FormData using fetch (better for React Native than axios)
 * @param {string} endpoint - API endpoint (e.g., '/users/me/profile-picture')
 * @param {FormData} formData - FormData object with file
 * @param {number} timeout - Timeout in milliseconds (default: 120000 = 2 minutes)
 * @returns {Promise<Object>} Response data
 */
export const uploadWithFetch = async (endpoint, formData, timeout = 120000) => {
  // Get auth token
  let token = null;
  try {
    token = await SecureStore.getItemAsync('accessToken');
  } catch (error) {
    // Error getting token
  }

  // Get base URL from apiClient
  const baseURL = apiClient.defaults.baseURL;
  const url = `${baseURL}${endpoint}`;

  // Test server connectivity first (optional health check)
  try {
    const healthCheckUrl = baseURL.replace(/\/api\/v1$/, '') + '/health';
    const healthResponse = await fetch(healthCheckUrl, { 
      method: 'GET',
      timeout: 5000,
    }).catch(() => null);
  } catch (e) {
    // Server health check error (non-critical)
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Build headers - DO NOT set Content-Type for FormData, fetch will set it with boundary
    const headers = {
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Use XMLHttpRequest instead of fetch for better file upload support in React Native
    const response = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set up timeout
      xhr.timeout = timeout;
      
      // Handle successful response
      xhr.onload = () => {
        clearTimeout(timeoutId);
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          json: async () => {
            try {
              return JSON.parse(xhr.responseText);
            } catch (e) {
              throw new Error('Invalid JSON response');
            }
          },
          text: async () => xhr.responseText,
        });
      };
      
      // Handle errors with more details
      xhr.onerror = (event) => {
        clearTimeout(timeoutId);
        
        // Provide more specific error message
        let errorMessage = 'Network request failed';
        if (xhr.status === 0) {
          errorMessage = 'Network request failed - server may be unreachable or CORS issue';
        } else if (xhr.status >= 400) {
          errorMessage = `Server error: ${xhr.status} ${xhr.statusText}`;
        }
        
        reject(new Error(errorMessage));
      };
      
      // Handle timeout
      xhr.ontimeout = () => {
        clearTimeout(timeoutId);
        reject(new Error('Upload timeout - the file might be too large or the connection is too slow'));
      };
      
      // Handle abort
      xhr.onabort = () => {
        clearTimeout(timeoutId);
        reject(new Error('Upload aborted'));
      };
      
      // Open connection
      xhr.open('POST', url);
      
      // Set headers
      Object.keys(headers).forEach(key => {
        try {
          xhr.setRequestHeader(key, headers[key]);
        } catch (e) {
          // Failed to set header
        }
      });
      
      // Handle abort signal
      if (controller.signal.aborted) {
        xhr.abort();
      } else {
        controller.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }
      
      // Send FormData
      xhr.send(formData);
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, try to get text
        await response.text().catch(() => '');
      }
      const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle different error types
    const errorName = error?.name || 'UnknownError';
    let errorMessage = error?.message || String(error || '') || 'Unknown error occurred';
    
    // Ensure errorMessage is always a string
    if (!errorMessage || typeof errorMessage !== 'string') {
      errorMessage = 'Unknown error occurred';
    }
    
    if (errorName === 'AbortError') {
      const timeoutError = new Error('Upload timeout - the file might be too large or the connection is too slow');
      throw timeoutError;
    }
    
    // Provide more helpful error messages
    if (errorMessage && typeof errorMessage === 'string' && (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch'))) {
      const networkError = new Error(
        'Network request failed. This might be due to:\n' +
        '- File is too large\n' +
        '- Network connection issue\n' +
        '- Server cannot be reached\n' +
        '- File URI is not accessible'
      );
      throw networkError;
    }
    
    // Re-throw with better message if it's a generic error
    if (errorMessage === 'Unknown error occurred' || !errorMessage) {
      throw new Error(`Upload failed: ${errorName || 'Unknown error'}`);
    }
    
    throw error;
  }
};

