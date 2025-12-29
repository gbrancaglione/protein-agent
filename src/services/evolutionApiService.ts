import config from '../config/index.js';
import { ValidationError, ApiError, ConfigurationError } from '../errors/index.js';
import { logger, logWarning } from '../lib/logger.js';

/**
 * EvolutionAPI Service
 * Handles sending WhatsApp messages via EvolutionAPI
 */
class EvolutionApiService {
  private baseUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor() {
    this.baseUrl = config.EVOLUTION_API_BASE_URL;
    this.apiKey = config.AUTHENTICATION_API_KEY || '';
    this.instanceName = config.EVOLUTION_API_INSTANCE_NAME;
    
    if (!this.apiKey) {
      logWarning('AUTHENTICATION_API_KEY is not set. Message sending will fail.', {
        service: 'EvolutionApiService',
      });
    }
    
    logger.info({
      service: 'EvolutionApiService',
      baseUrl: this.baseUrl,
      instanceName: this.instanceName,
    }, 'EvolutionAPI Service initialized');
  }

  /**
   * Send a text message via EvolutionAPI
   * @param phoneNumber - Phone number (with country code, e.g., "5511998338955")
   * @param text - Message text to send
   * @throws ValidationError if phone number or text is invalid
   * @throws ConfigurationError if API key is not configured
   * @throws ApiError if API request fails
   */
  async sendTextMessage(phoneNumber: string, text: string): Promise<void> {
    // Validate inputs
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new ValidationError('Phone number is required', 'phoneNumber', phoneNumber);
    }

    // Remove any @s.whatsapp.net suffix if present
    const cleanPhoneNumber = phoneNumber.includes('@') 
      ? phoneNumber.split('@')[0] 
      : phoneNumber.trim();

    // Basic phone number validation (should be numeric)
    if (!/^\d+$/.test(cleanPhoneNumber)) {
      throw new ValidationError(
        `Invalid phone number format: ${cleanPhoneNumber}`,
        'phoneNumber',
        cleanPhoneNumber
      );
    }

    if (!text || text.trim().length === 0) {
      throw new ValidationError('Message text cannot be empty', 'text', text);
    }

    if (!this.apiKey) {
      throw new ConfigurationError(
        'AUTHENTICATION_API_KEY is not configured',
        'AUTHENTICATION_API_KEY'
      );
    }

    const url = `${this.baseUrl}/message/sendText/${this.instanceName}`;
    
    logger.debug({
      phoneNumber: cleanPhoneNumber,
      url,
      service: 'EvolutionApiService',
    }, 'Attempting to send message');
    
    try {
      // Add timeout to fetch request (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify({
          number: cleanPhoneNumber,
          text: text.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({
          status: response.status,
          statusText: response.statusText,
          errorText,
          phoneNumber: cleanPhoneNumber,
          url,
        }, 'EvolutionAPI request failed');
        
        throw new ApiError(
          `EvolutionAPI request failed: ${response.status} ${response.statusText}`,
          'EvolutionAPI',
          response.status,
          errorText,
          { phoneNumber: cleanPhoneNumber, url }
        );
      }

      const responseData = await response.json();
      logger.info({
        phoneNumber: cleanPhoneNumber,
        responseData,
      }, 'Message sent successfully');
    } catch (error) {
      // Re-throw if it's already our custom error
      if (error instanceof ApiError || error instanceof ValidationError || error instanceof ConfigurationError) {
        throw error;
      }
      
      if (error instanceof Error) {
        let errorMessage = error.message;
        let statusCode: number | undefined;
        
        // Check for specific error types
        if (error.name === 'AbortError') {
          errorMessage = `Request timeout after 30 seconds to ${url}`;
          statusCode = 504;
        } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          errorMessage = `Connection failed to ${url}. Is EvolutionAPI running and accessible?`;
          statusCode = 503;
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          errorMessage = `DNS resolution failed for EvolutionAPI. Check if the service name 'evolution-api' is correct.`;
          statusCode = 503;
        }
        
        logger.error({
          error: error.message,
          errorName: error.name,
          phoneNumber: cleanPhoneNumber,
          url,
        }, 'Failed to send message via EvolutionAPI');
        
        throw new ApiError(
          errorMessage,
          'EvolutionAPI',
          statusCode,
          undefined,
          { phoneNumber: cleanPhoneNumber, url, originalError: error.message }
        );
      }
      throw error;
    }
  }
}

// Export singleton instance
export default new EvolutionApiService();

