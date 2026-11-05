// Dynamic API & Socket URL configuration for seamless localhost and production operation

export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.hostname === '::1';
    if (isLocalhost) {
      if (window.location.port !== '5000') {
        const envUrl = import.meta.env.VITE_API_URL;
        return (envUrl && !envUrl.includes('render.com')) ? envUrl : 'http://localhost:5000';
      }
      return window.location.origin;
    }
    // In production on Render or live domain, use the current origin
    return window.location.origin;
  }
  return 'https://clinic-queue-system-complete-major.onrender.com';
};

export const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.hostname === '::1';
    if (isLocalhost) {
      if (window.location.port !== '5000') {
        const envUrl = import.meta.env.VITE_SOCKET_URL;
        return (envUrl && !envUrl.includes('render.com')) ? envUrl : 'http://localhost:5000';
      }
      return window.location.origin;
    }
    // In production on Render or live domain, use the current origin
    return window.location.origin;
  }
  return 'https://clinic-queue-system-complete-major.onrender.com';
};

