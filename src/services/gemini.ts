import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

interface GeminiConfig {
  apiKey: string;
  model?: string;
  generationConfig?: GenerationConfig;
}

interface GeminiResponse {
  text: string;
  finishReason: string;
  safetyRatings?: any[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private readonly MAX_RETRIES = 3;

  constructor(config: GeminiConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.model || 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        ...config.generationConfig,
      },
    });
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        const delay = Math.pow(2, this.MAX_RETRIES - retries) * 1000;
        console.warn(`Retrying Gemini request in ${delay}ms. Retries left: ${retries - 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableMessages = [
      'quota exceeded',
      'rate limit',
      'timeout',
      'service unavailable',
      'internal error'
    ];
    
    return retryableMessages.some(msg => 
      error.message?.toLowerCase().includes(msg)
    );
  }

  async generateContent(prompt: string): Promise<GeminiResponse> {
    await this.enforceRateLimit();

    return this.retryWithBackoff(async () => {
      try {
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        
        if (!response.candidates || response.candidates.length === 0) {
          throw new Error('Empty response from Gemini API');
        }

        const candidate = response.candidates[0];
        
        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Content was blocked by safety filters');
        }

        let text = '';
        try {
          text = response.text();
        } catch {
          text = candidate.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
        }

        return {
          text,
          finishReason: candidate.finishReason || 'STOP',
          safetyRatings: candidate.safetyRatings,
          usageMetadata: response.usageMetadata,
        };
      } catch (error: any) {
        console.error('Gemini API Error:', error);
        throw new Error(`Gemini API failed: ${error.message}`);
      }
    });
  }

  async generateStreamContent(prompt: string): Promise<AsyncGenerator<string, void, unknown>> {
    await this.enforceRateLimit();

    async function* streamGenerator(model: GenerativeModel) {
      try {
        const result = await model.generateContentStream(prompt);
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            yield chunkText;
          }
        }
      } catch (error: any) {
        console.error('Gemini Stream Error:', error);
        throw new Error(`Gemini stream failed: ${error.message}`);
      }
    }

    return streamGenerator(this.model);
  }

  async analyzeImage(imageData: string, prompt: string): Promise<GeminiResponse> {
    await this.enforceRateLimit();

    return this.retryWithBackoff(async () => {
      try {
        let base64Data = imageData;
        let mimeType = 'image/jpeg';

        if (imageData.includes(',')) {
          const [header, data] = imageData.split(',');
          base64Data = data;
          mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        }

        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        };

        const result = await this.model.generateContent([prompt, imagePart]);
        const response = result.response;
        
        if (!response.candidates || response.candidates.length === 0) {
          throw new Error('Empty response from Gemini API');
        }

        const candidate = response.candidates[0];
        
        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Image content was blocked by safety filters');
        }

        let text = '';
        try {
          text = response.text();
        } catch {
          text = candidate.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
        }

        return {
          text,
          finishReason: candidate.finishReason || 'STOP',
          safetyRatings: candidate.safetyRatings,
          usageMetadata: response.usageMetadata,
        };
      } catch (error: any) {
        console.error('Gemini Image Analysis Error:', error);
        throw new Error(`Gemini image analysis failed: ${error.message}`);
      }
    });
  }

  async countTokens(text: string): Promise<number> {
    try {
      const result = await this.model.countTokens(text);
      return result.totalTokens;
    } catch (error) {
      console.warn('Token counting failed, using estimation:', error);
      // Fallback estimation: roughly 4 characters per token
      return Math.ceil(text.length / 4);
    }
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

export default GeminiService;
export type { GeminiConfig, GeminiResponse };