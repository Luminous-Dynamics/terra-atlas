/**
 * Terra Atlas API Type Definitions
 *
 * Centralized type definitions for all API requests and responses
 * Ensures type safety across frontend and backend
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface ApiError {
  error: true
  message: string
  details?: any
  code?: string
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginRequest {
  emailOrUsername: string
  password: string
}

export interface LoginResponse {
  user: UserProfile
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  fullName?: string
}

export interface RegisterResponse {
  user: UserProfile
  token: string
  refreshToken: string
}

export interface UserProfile {
  id: string
  email: string
  username: string
  fullName?: string
  avatarUrl?: string
  bio?: string
  trustLevel: number
  reputationScore: number
  validationsCount: number
  validationAccuracy: number
  isAdmin: boolean
  isModerator: boolean
  emailVerified: boolean
  createdAt: string | Date
}

// ============================================================================
// Project Types
// ============================================================================

export type ProjectType = 'solar' | 'wind' | 'hydro' | 'nuclear' | 'storage'

export type ProjectStatus = 'planning' | 'funding' | 'construction' | 'operational'

export interface Project {
  id: string
  name: string
  type: ProjectType
  location: string
  latitude: number
  longitude: number
  capacity_mw: number
  total_cost: number
  raised_amount: number
  status: ProjectStatus
  irr: number
  description?: string
  created_at: string | Date
  updated_at: string | Date
}

export interface ProjectsQueryParams {
  type?: ProjectType
  status?: ProjectStatus
  minCapacity?: number
  maxCapacity?: number
  minIrr?: number
  location?: string
  limit?: number
  offset?: number
}

export interface ProjectsResponse extends PaginatedResponse<Project> {}

export interface ProjectCreateRequest {
  name: string
  type: ProjectType
  location: string
  latitude: number
  longitude: number
  capacity_mw: number
  total_cost: number
  irr: number
  description?: string
}

// ============================================================================
// Investment Types
// ============================================================================

export type InvestmentType =
  | 'equity'
  | 'debt'
  | 'revenue_share'
  | 'crowdfunding'
  | 'green_bond'
  | 'ppa'

export type InvestmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Investment {
  id: string
  user_id: string
  project_id: string
  amount: number
  status: InvestmentStatus
  transaction_hash?: string
  created_at: string | Date
  updated_at: string | Date
  returns_paid: number
  estimated_returns: number
}

export interface InvestmentPledgeRequest {
  projectId: string
  amountUsd: number
  investmentType: InvestmentType
  expectedReturn?: number
  investmentPeriodYears?: number
  notes?: string
}

export interface InvestmentPledgeResponse {
  investment: Investment
  message: string
}

// ============================================================================
// Portfolio Types
// ============================================================================

export interface PortfolioMetrics {
  totalInvested: number
  totalReturns: number
  totalPledged: number
  activeInvestments: number
  portfolioIrr: number
  totalCo2Avoided: number
  totalMwhGenerated: number
}

export interface PortfolioInvestment {
  investment: Investment
  project: Project
  currentValue: number
  performancePercent: number
}

export interface PortfolioResponse {
  metrics: PortfolioMetrics
  investments: PortfolioInvestment[]
}

// ============================================================================
// Validation Types
// ============================================================================

export type ValidationConfidence = 'low' | 'medium' | 'high'

export interface DataPoint {
  id: string
  source: string
  data_type: string
  value: any
  latitude?: number
  longitude?: number
  timestamp: string | Date
  validation_status: 'pending' | 'validated' | 'rejected'
  validation_count: number
  confidence_score: number
  created_by: string
  created_at: string | Date
}

export interface ValidationRequest {
  dataPointId: string
  isValid: boolean
  confidence: ValidationConfidence
  notes?: string
}

export interface ValidationResponse {
  validation: {
    id: string
    data_point_id: string
    validator_id: string
    is_valid: boolean
    confidence: ValidationConfidence
    notes?: string
    created_at: string | Date
  }
  reputation_change: number
  new_reputation: number
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface PlatformStats {
  totalProjects: number
  totalInvestments: number
  totalInvested: number
  totalCapacityMw: number
  totalCo2Avoided: number
  activeInvestors: number
  projectsByType: Record<ProjectType, number>
  averageIrr: number
}

export interface StatsResponse extends ApiResponse<PlatformStats> {}

// ============================================================================
// Stripe/Payment Types
// ============================================================================

export interface CheckoutSessionRequest {
  projectId: string
  amount: number
  investmentType: InvestmentType
}

export interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret: string
}

// ============================================================================
// Discovery/ML Types
// ============================================================================

export interface ProjectRecommendation {
  project: Project
  score: number
  reasons: string[]
  matchPercentage: number
}

export interface DiscoveryRequest {
  preferences?: {
    types?: ProjectType[]
    minIrr?: number
    maxRisk?: number
    location?: string
  }
  limit?: number
}

export interface DiscoveryResponse extends ApiResponse<ProjectRecommendation[]> {}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookEvent<T = any> {
  id: string
  type: string
  created: number
  data: T
}

export interface StripeWebhookEvent extends WebhookEvent {
  type:
    | 'payment_intent.succeeded'
    | 'payment_intent.failed'
    | 'checkout.session.completed'
    | 'customer.subscription.updated'
}

// ============================================================================
// Error Codes
// ============================================================================

export enum ApiErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Payments
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

// ============================================================================
// Type Guards
// ============================================================================

export function isApiError(response: any): response is ApiError {
  return response && response.error === true
}

export function isSuccessResponse<T>(response: any): response is ApiResponse<T> {
  return response && response.success === true
}
