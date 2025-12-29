import config from '../config/index.js';

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
      console.warn('Warning: AUTHENTICATION_API_KEY is not set. Message sending will fail.');
    }
    
    console.log(`EvolutionAPI Service initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Send a text message via EvolutionAPI
   * @param phoneNumber - Phone number (with country code, e.g., "5511998338955")
   * @param text - Message text to send
   * @throws Error if phone number is invalid, text is empty, or API request fails
   */
  async sendTextMessage(phoneNumber: string, text: string): Promise<void> {
    // Validate inputs
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new Error('Phone number is required');
    }

    // Remove any @s.whatsapp.net suffix if present
    const cleanPhoneNumber = phoneNumber.includes('@') 
      ? phoneNumber.split('@')[0] 
      : phoneNumber.trim();

    // Basic phone number validation (should be numeric)
    if (!/^\d+$/.test(cleanPhoneNumber)) {
      throw new Error(`Invalid phone number format: ${cleanPhoneNumber}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Message text cannot be empty');
    }

    if (!this.apiKey) {
      throw new Error('AUTHENTICATION_API_KEY is not configured');
    }

    const url = `${this.baseUrl}/message/sendText/${this.instanceName}`;
    
    console.log(`Attempting to send message to ${cleanPhoneNumber} via ${url}`);
    
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
        throw new Error(
          `EvolutionAPI request failed: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      const responseData = await response.json();
      console.log(`✅ Message sent successfully to ${cleanPhoneNumber}`);
      
      // Log response if it contains useful information
      if (responseData && typeof responseData === 'object') {
        console.log(`Response:`, JSON.stringify(responseData, null, 2));
      }
    } catch (error) {
      if (error instanceof Error) {
        // Provide more detailed error information
        let errorDetails = error.message;
        
        // Check for specific error types
        if (error.name === 'AbortError') {
          errorDetails = `Request timeout after 30 seconds to ${url}`;
        } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          errorDetails = `Connection failed to ${url}. Is EvolutionAPI running and accessible? Error: ${error.message}`;
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          errorDetails = `DNS resolution failed for EvolutionAPI. Check if the service name 'evolution-api' is correct. Error: ${error.message}`;
        }
        
        throw new Error(`Failed to send message via EvolutionAPI: ${errorDetails}`);
      }
      throw error;
    }
  }
}

// Export singleton instance
export default new EvolutionApiService();

