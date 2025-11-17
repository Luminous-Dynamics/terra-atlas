/**
 * Data Layer API Endpoint
 *
 * Provides GeoJSON data for various map visualization layers
 * Supports: fires, earthquakes, weather, emissions, alerts, air quality, volcanoes, solar flares
 * Migrated to Phase 4 patterns with file caching and structured logging
 */

import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { RATE_LIMITS } from '@/lib/config'
import {
  withCache,
  createCacheKey,
  CACHE_DURATIONS,
} from '@/lib/cache'

/**
 * Available data layers
 */
const dataLayers = [
  'fires',
  'earthquakes',
  'weather',
  'emissions',
  'noaa-alerts',
  'nasa-eonet',
  'air-quality',
  'volcanoes',
  'solar-flares',
] as const

/**
 * Layer parameter schema
 */
const layerParamSchema = z.object({
  layer: z.enum(dataLayers).describe('Data layer to fetch'),
})

/**
 * Check if we have real API keys configured for data sources
 */
const hasRealData: Record<string, boolean> = {
  fires: !!process.env.FIRMS_API_KEY,
  weather: !!process.env.OPENWEATHER_API_KEY,
  earthquakes: true, // USGS doesn't need API key
  emissions: !!process.env.CARBON_API_KEY,
  'noaa-alerts': true, // NOAA doesn't need API key
  'nasa-eonet': true, // NASA EONET doesn't need API key
  'air-quality': true, // OpenAQ basic access doesn't need API key
  volcanoes: true, // Demo/synthetic data
  'solar-flares': true, // NOAA SWPC doesn't need API key
}

/**
 * Map layer names to data files
 */
const dataFiles: Record<string, string> = {
  fires: 'nasa-firms.json',
  earthquakes: 'usgs-earthquakes.json',
  weather: 'openweather.json',
  emissions: 'carbon-monitor.json',
  'noaa-alerts': 'noaa-alerts.json',
  'nasa-eonet': 'nasa-eonet.json',
  'air-quality': 'air-quality.json',
  volcanoes: 'volcanoes.json',
  'solar-flares': 'solar-flares.json',
}

/**
 * GET /api/data/:layer
 *
 * Fetch GeoJSON data for a specific visualization layer
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing layer name
 * @returns GeoJSON FeatureCollection with metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layer: string }> }
) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_data_layer')

      // Await and validate params
      const resolvedParams = await params
      const validated = layerParamSchema.parse(resolvedParams)
      const { layer } = validated

      structuredLogger.info('Data layer requested', {
        operation: 'get_data_layer',
        layer,
      })

      timer.mark('validation_complete')

      const fileName = dataFiles[layer]
      if (!fileName) {
        throw new ValidationError(`Invalid layer: ${layer}`)
      }

      // Generate cache key
      const cacheKey = createCacheKey('data', 'layer', layer)
      timer.mark('cache_key_generated')

      try {
        // Use cache-aside pattern with long TTL (data files change infrequently)
        const layerData = await withCache(
          cacheKey,
          async () => {
            timer.mark('cache_miss_reading_file')

            // Build file path
            const filePath = path.join(process.cwd(), 'public', 'data', fileName)

            try {
              // Read and parse file
              timer.mark('file_read_start')
              await fs.access(filePath) // Check file exists
              const fileContent = await fs.readFile(filePath, 'utf-8')
              timer.mark('file_read_complete')

              const jsonData = JSON.parse(fileContent)
              timer.mark('json_parse_complete')

              // Enrich with metadata about data source
              const enrichedData = {
                ...jsonData,
                metadata: {
                  ...jsonData.metadata,
                  isRealData: hasRealData[layer] || false,
                  dataMode: hasRealData[layer] ? 'live' : 'demo',
                  apiKeyPresent:
                    layer === 'earthquakes' || layer === 'noaa-alerts' || layer === 'nasa-eonet'
                      ? 'not_required'
                      : hasRealData[layer]
                        ? 'yes'
                        : 'no',
                  cached: true,
                  layer,
                },
              }

              structuredLogger.info('Data layer file loaded', {
                operation: 'get_data_layer',
                layer,
                featureCount: enrichedData.features?.length || 0,
                fileSize: fileContent.length,
              })

              return enrichedData
            } catch (fileError) {
              // File doesn't exist - return empty GeoJSON
              structuredLogger.warn('Data layer file not found, returning empty', {
                operation: 'get_data_layer',
                layer,
                filePath,
              })

              return {
                type: 'FeatureCollection',
                metadata: {
                  source: layer,
                  last_updated: new Date().toISOString(),
                  total_features: 0,
                  quality_score: 0,
                  isRealData: false,
                  dataMode: 'empty',
                  layer,
                },
                features: [],
              }
            }
          },
          {
            ttl: CACHE_DURATIONS.LONG, // 1 hour cache (data files change rarely)
            tags: ['data', 'layer', layer]
          }
        )

        timer.mark('data_fetched')

        const duration = timer.endAndLog({
          operation: 'get_data_layer',
          layer,
          featureCount: layerData.features?.length || 0,
          success: true,
        })

        return successResponse(layerData, {
          requestId: context.requestId,
          headers: {
            'Cache-Control': `public, max-age=${CACHE_DURATIONS.LONG}`,
            'X-Cache-Key': cacheKey,
          },
          metadata: {
            performance: {
              validation: timer.getMark('validation_complete'),
              file_read: timer.getMark('file_read_complete')
                ? timer.getMark('file_read_complete')! - timer.getMark('file_read_start')!
                : 0,
              json_parse: timer.getMark('json_parse_complete')
                ? timer.getMark('json_parse_complete')! - timer.getMark('file_read_complete')!
                : 0,
              total: duration,
            },
          },
        })
      } catch (error) {
        const duration = timer.end()

        // Handle validation errors
        if (error instanceof ValidationError) {
          structuredLogger.info('Data layer validation error', {
            operation: 'get_data_layer',
            layer,
            error: error.message,
            duration,
          })
          throw error
        }

        // Handle unexpected errors
        structuredLogger.error('Error loading data layer', error, {
          operation: 'get_data_layer',
          layer,
          duration,
        })

        throw new Error(`Failed to load data layer: ${layer}`)
      }
    },
    {
      rateLimit: RATE_LIMITS.api?.projects || { maxRequests: 100, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}
