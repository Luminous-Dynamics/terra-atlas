/**
 * Terra Atlas Application Constants
 *
 * Centralized constants used throughout the application
 */

// ============================================================================
// Project Constants
// ============================================================================

export const PROJECT_TYPES = {
  SOLAR: 'solar',
  WIND: 'wind',
  HYDRO: 'hydro',
  GEOTHERMAL: 'geothermal',
  BIOMASS: 'biomass',
  TIDAL: 'tidal',
  HYDROGEN: 'hydrogen',
  STORAGE: 'storage'
} as const

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  [PROJECT_TYPES.SOLAR]: 'Solar',
  [PROJECT_TYPES.WIND]: 'Wind',
  [PROJECT_TYPES.HYDRO]: 'Hydroelectric',
  [PROJECT_TYPES.GEOTHERMAL]: 'Geothermal',
  [PROJECT_TYPES.BIOMASS]: 'Biomass',
  [PROJECT_TYPES.TIDAL]: 'Tidal',
  [PROJECT_TYPES.HYDROGEN]: 'Hydrogen',
  [PROJECT_TYPES.STORAGE]: 'Energy Storage'
}

export const PROJECT_STATUSES = {
  PLANNING: 'planning',
  FUNDING: 'funding',
  CONSTRUCTION: 'construction',
  OPERATIONAL: 'operational',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold'
} as const

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  [PROJECT_STATUSES.PLANNING]: 'Planning',
  [PROJECT_STATUSES.FUNDING]: 'Seeking Funding',
  [PROJECT_STATUSES.CONSTRUCTION]: 'Under Construction',
  [PROJECT_STATUSES.OPERATIONAL]: 'Operational',
  [PROJECT_STATUSES.COMPLETED]: 'Completed',
  [PROJECT_STATUSES.CANCELLED]: 'Cancelled',
  [PROJECT_STATUSES.ON_HOLD]: 'On Hold'
}

export const PROJECT_RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
} as const

export const PROJECT_RISK_LABELS: Record<string, string> = {
  [PROJECT_RISK_LEVELS.LOW]: 'Low Risk',
  [PROJECT_RISK_LEVELS.MEDIUM]: 'Medium Risk',
  [PROJECT_RISK_LEVELS.HIGH]: 'High Risk',
  [PROJECT_RISK_LEVELS.VERY_HIGH]: 'Very High Risk'
}

// ============================================================================
// Investment Constants
// ============================================================================

export const INVESTMENT_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const

export const INVESTMENT_STATUS_LABELS: Record<string, string> = {
  [INVESTMENT_STATUSES.PENDING]: 'Pending',
  [INVESTMENT_STATUSES.CONFIRMED]: 'Confirmed',
  [INVESTMENT_STATUSES.ACTIVE]: 'Active',
  [INVESTMENT_STATUSES.COMPLETED]: 'Completed',
  [INVESTMENT_STATUSES.CANCELLED]: 'Cancelled',
  [INVESTMENT_STATUSES.REFUNDED]: 'Refunded'
}

export const INVESTMENT_TYPES = {
  EQUITY: 'equity',
  DEBT: 'debt',
  HYBRID: 'hybrid',
  GRANT: 'grant'
} as const

export const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  [INVESTMENT_TYPES.EQUITY]: 'Equity Investment',
  [INVESTMENT_TYPES.DEBT]: 'Debt Financing',
  [INVESTMENT_TYPES.HYBRID]: 'Hybrid',
  [INVESTMENT_TYPES.GRANT]: 'Grant Funding'
}

// Minimum and maximum investment amounts (in USD)
export const INVESTMENT_LIMITS = {
  MIN_AMOUNT: 1000,
  MAX_AMOUNT: 100_000_000,
  DEFAULT_AMOUNT: 10_000
} as const

// ============================================================================
// User & Authentication Constants
// ============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  INVESTOR: 'investor',
  PROJECT_DEVELOPER: 'project_developer',
  ANALYST: 'analyst',
  VIEWER: 'viewer'
} as const

export const USER_ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.INVESTOR]: 'Investor',
  [USER_ROLES.PROJECT_DEVELOPER]: 'Project Developer',
  [USER_ROLES.ANALYST]: 'Analyst',
  [USER_ROLES.VIEWER]: 'Viewer'
}

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification'
} as const

export const PERMISSIONS = {
  // Project permissions
  VIEW_PROJECTS: 'view_projects',
  CREATE_PROJECT: 'create_project',
  EDIT_PROJECT: 'edit_project',
  DELETE_PROJECT: 'delete_project',

  // Investment permissions
  VIEW_INVESTMENTS: 'view_investments',
  CREATE_INVESTMENT: 'create_investment',
  EDIT_INVESTMENT: 'edit_investment',
  DELETE_INVESTMENT: 'delete_investment',

  // User permissions
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',

  // Admin permissions
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_PAYMENTS: 'manage_payments'
} as const

// ============================================================================
// Financial Constants
// ============================================================================

export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  JPY: 'JPY',
  CNY: 'CNY'
} as const

export const CURRENCY_SYMBOLS: Record<string, string> = {
  [CURRENCIES.USD]: '$',
  [CURRENCIES.EUR]: '€',
  [CURRENCIES.GBP]: '£',
  [CURRENCIES.JPY]: '¥',
  [CURRENCIES.CNY]: '¥'
}

// Financial metric ranges
export const FINANCIAL_METRICS = {
  IRR: {
    EXCELLENT: 15,  // >= 15%
    GOOD: 12,       // >= 12%
    FAIR: 10,       // >= 10%
    POOR: 8         // >= 8%
  },
  PAYBACK_PERIOD: {
    EXCELLENT: 3,   // <= 3 years
    GOOD: 5,        // <= 5 years
    FAIR: 7,        // <= 7 years
    POOR: 10        // <= 10 years
  },
  ROI: {
    EXCELLENT: 20,  // >= 20%
    GOOD: 15,       // >= 15%
    FAIR: 10,       // >= 10%
    POOR: 5         // >= 5%
  }
} as const

// ============================================================================
// Geographic Constants
// ============================================================================

export const CONTINENTS = {
  AFRICA: 'Africa',
  ANTARCTICA: 'Antarctica',
  ASIA: 'Asia',
  EUROPE: 'Europe',
  NORTH_AMERICA: 'North America',
  OCEANIA: 'Oceania',
  SOUTH_AMERICA: 'South America'
} as const

export const REGIONS = {
  NORTH_AMERICA: 'North America',
  SOUTH_AMERICA: 'South America',
  EUROPE: 'Europe',
  AFRICA: 'Africa',
  MIDDLE_EAST: 'Middle East',
  ASIA_PACIFIC: 'Asia Pacific',
  OCEANIA: 'Oceania'
} as const

// ============================================================================
// Time Constants
// ============================================================================

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
} as const

// ============================================================================
// API Constants
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  PROFILE: '/api/auth/profile',

  // Projects
  PROJECTS: '/api/projects',
  PROJECT_BY_ID: (id: string) => `/api/projects/${id}`,

  // Investments
  INVESTMENTS: '/api/investments',
  INVESTMENT_BY_ID: (id: string) => `/api/investments/${id}`,

  // Statistics
  STATS: '/api/stats',
  HEALTH: '/api/health',

  // Admin
  ADMIN_USERS: '/api/admin/users',
  ADMIN_SETTINGS: '/api/admin/settings'
} as const

export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
} as const

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email/username or password',
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized access',
  SESSION_EXPIRED: 'Your session has expired. Please login again',

  // Validation
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PASSWORD: 'Password does not meet requirements',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_AMOUNT: 'Invalid amount',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',

  // Projects
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_CREATE_FAILED: 'Failed to create project',
  PROJECT_UPDATE_FAILED: 'Failed to update project',
  PROJECT_DELETE_FAILED: 'Failed to delete project',

  // Investments
  INVESTMENT_NOT_FOUND: 'Investment not found',
  INVESTMENT_CREATE_FAILED: 'Failed to create investment',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  INVESTMENT_LIMIT_EXCEEDED: 'Investment exceeds maximum allowed amount',

  // Server
  INTERNAL_ERROR: 'An internal error occurred. Please try again later',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  DATABASE_ERROR: 'Database connection error',

  // Generic
  UNKNOWN_ERROR: 'An unknown error occurred',
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Resource not found'
} as const

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  PASSWORD_RESET_SUCCESS: 'Password reset email sent',

  // Projects
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',

  // Investments
  INVESTMENT_CREATED: 'Investment created successfully',
  INVESTMENT_UPDATED: 'Investment updated successfully',
  INVESTMENT_CANCELLED: 'Investment cancelled successfully',

  // Generic
  SUCCESS: 'Operation completed successfully'
} as const

// ============================================================================
// UI Constants
// ============================================================================

export const THEME = {
  COLORS: {
    PRIMARY: 'blue',
    SUCCESS: 'green',
    WARNING: 'yellow',
    ERROR: 'red',
    INFO: 'blue'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  }
} as const

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const

// ============================================================================
// Regex Patterns
// ============================================================================

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
} as const

// ============================================================================
// Type Exports
// ============================================================================

export type ProjectType = typeof PROJECT_TYPES[keyof typeof PROJECT_TYPES]
export type ProjectStatus = typeof PROJECT_STATUSES[keyof typeof PROJECT_STATUSES]
export type ProjectRiskLevel = typeof PROJECT_RISK_LEVELS[keyof typeof PROJECT_RISK_LEVELS]
export type InvestmentStatus = typeof INVESTMENT_STATUSES[keyof typeof INVESTMENT_STATUSES]
export type InvestmentType = typeof INVESTMENT_TYPES[keyof typeof INVESTMENT_TYPES]
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type UserStatus = typeof USER_STATUSES[keyof typeof USER_STATUSES]
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES]
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS]
export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS]
