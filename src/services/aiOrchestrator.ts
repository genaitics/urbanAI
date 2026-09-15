import GeminiService from './gemini';
import { ChatMessage } from '../types';

interface AIProvider {
  name: string;
  service: GeminiService;
  priority: number;
  isAvailable: boolean;
  lastError?: string;
}

class AIOrchestrator {
  private geminiService: GeminiService | undefined;
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize Gemini
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      this.geminiService = new GeminiService({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
        model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-lite',
      });

      this.providers.push({
        name: 'gemini',
        service: this.geminiService,
        priority: 1,
        isAvailable: true,
      });
    }
  }

  private getSystemPrompt(type: string): string {
    const systemPrompts = {
      chat: `You are an expert urban gardening assistant. Provide helpful, accurate advice about plant care, urban farming, container gardening, and sustainable growing practices. Keep responses practical, actionable, and encouraging. Focus on solutions that work in urban environments with limited space.`,
      
      planning: `You are a garden planning specialist. Help users design optimal urban gardens based on their space, climate, and preferences. Provide specific plant recommendations with spacing, care requirements, growing tips, and seasonal considerations. Consider factors like sunlight, water access, and container limitations.`,
      
      identification: `You are a plant identification expert. Analyze plant images and provide accurate species identification, detailed care instructions, common problems, and growing tips. Be specific about plant characteristics you observe and provide actionable advice for urban gardening contexts.`
    };

    return systemPrompts[type as keyof typeof systemPrompts] || systemPrompts.chat;
  }

  private buildPrompt(
    message: string,
    type: 'chat' | 'planning' | 'identification' = 'chat',
    context?: ChatMessage[]
  ): string {
    const systemPrompt = this.getSystemPrompt(type);
    let prompt = `${systemPrompt}\n\n`;

    if (context && context.length > 0) {
      const history = context
        .filter(m => m.content && (m.role === 'user' || m.role === 'assistant'))
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');
      if (history) {
        prompt += `Previous conversation history:\n${history}\n\n`;
      }
    }

    prompt += `User: ${message}`;
    return prompt;
  }

  async generateResponse(
    message: string,
    type: 'chat' | 'planning' | 'identification' = 'chat',
    context?: ChatMessage[]
  ): Promise<any> {
    if (!this.geminiService) {
      throw new Error('Gemini API is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }
    const geminiPrompt = this.buildPrompt(message, type, context);
    return this.geminiService.generateContent(geminiPrompt);
  }

  async generateStreamResponse(
    message: string,
    type: 'chat' | 'planning' | 'identification' = 'chat',
    context?: ChatMessage[]
  ): Promise<AsyncGenerator<string, void, unknown>> {
    if (!this.geminiService) {
      throw new Error('Gemini API is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }
    const geminiPrompt = this.buildPrompt(message, type, context);
    return this.geminiService.generateStreamContent(geminiPrompt);
  }

  async analyzeImage(imageData: string, prompt: string): Promise<any> {
    if (!this.geminiService) {
      throw new Error('Gemini API is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }
    return this.geminiService.analyzeImage(imageData, prompt);
  }

  getCurrentProvider(): string | null {
    return this.providers.length > 0 ? this.providers[0].name : null;
  }

  getCurrentModel(): string | null {
    return import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-lite';
  }

  getProviderStatus(): Array<{ 
    name: string; 
    available: boolean; 
    error?: string;
  }> {
    return this.providers.map(p => ({
      name: p.name,
      available: p.isAvailable,
      error: p.lastError,
    }));
  }
}

export default AIOrchestrator;