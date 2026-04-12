/**
 * Theme constants for use in TypeScript/React components
 * These values should match the CSS variables in css/variables.css
 */
export const theme = {
  colors: {
    primary: '#00AFF5',
    primaryHover: '#0095D6',
    primaryDark: '#007CB5',
    secondary: '#666',
    secondaryLight: '#999',
    success: '#2ecc71',
    warning: '#f39c12',
    info: '#3498db',
    error: '#e74c3c',
    textPrimary: '#333',
    textSecondary: '#555',
    textMuted: '#666',
    border: '#ddd',
    borderLight: '#e0e0e0',
    background: '#f5f5f5',
    backgroundLight: '#f8f9fa',
    white: '#ffffff',
    sidebarBg: '#2c3e50',
    sidebarHover: '#34495e',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '30px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
  },
} as const;

export default theme;

