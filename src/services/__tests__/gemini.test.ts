import GeminiService from '../gemini';

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      countTokens: jest.fn(),
      startChat: jest.fn(),
    }),
  })),
}));

describe('GeminiService', () => {
  let geminiService: GeminiService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    geminiService = new GeminiService({
      apiKey: mockApiKey,
      model: 'gemini-2.5-flash-lite',
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting between requests', async () => {
      const startTime = Date.now();
      
      // Mock successful responses
      const mockModel = (geminiService as any).model;
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Test response',
          candidates: [{ finishReason: 'STOP' }],
        },
      });

      // Make two consecutive requests
      await geminiService.generateContent('Test prompt 1');
      await geminiService.generateContent('Test prompt 2');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take at least 1 second due to rate limiting
      expect(duration).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Error Handling', () => {
    it('should retry on retryable errors', async () => {
      const mockModel = (geminiService as any).model;
      
      // First call fails with retryable error, second succeeds
      mockModel.generateContent
        .mockRejectedValueOnce(new Error('quota exceeded'))
        .mockResolvedValueOnce({
          response: {
            text: () => 'Success after retry',
            candidates: [{ finishReason: 'STOP' }],
          },
        });

      const result = await geminiService.generateContent('Test prompt');
      
      expect(result.text).toBe('Success after retry');
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const mockModel = (geminiService as any).model;
      
      // All calls fail
      mockModel.generateContent.mockRejectedValue(new Error('persistent error'));

      await expect(geminiService.generateContent('Test prompt'))
        .rejects.toThrow('Gemini API failed: persistent error');
    });
  });

  describe('Content Generation', () => {
    it('should generate content successfully', async () => {
      const mockModel = (geminiService as any).model;
      const expectedResponse = 'Generated content';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => expectedResponse,
          candidates: [{ 
            finishReason: 'STOP',
            safetyRatings: []
          }],
        },
      });

      const result = await geminiService.generateContent('Test prompt');
      
      expect(result.text).toBe(expectedResponse);
      expect(result.finishReason).toBe('STOP');
    });

    it('should handle empty responses', async () => {
      const mockModel = (geminiService as any).model;
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => '',
          candidates: [],
        },
      });

      await expect(geminiService.generateContent('Test prompt'))
        .rejects.toThrow('Empty response from Gemini API');
    });
  });

  describe('Image Analysis', () => {
    it('should analyze images successfully', async () => {
      const mockModel = (geminiService as any).model;
      const expectedResponse = 'This is a plant image analysis';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => expectedResponse,
          candidates: [{ finishReason: 'STOP' }],
        },
      });

      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';
      const result = await geminiService.analyzeImage(imageData, 'Identify this plant');
      
      expect(result.text).toBe(expectedResponse);
      expect(mockModel.generateContent).toHaveBeenCalledWith([
        'Identify this plant',
        {
          inlineData: {
            data: '/9j/4AAQSkZJRgABAQAAAQ...',
            mimeType: 'image/jpeg',
          },
        },
      ]);
    });
  });

  describe('Token Counting', () => {
    it('should count tokens successfully', async () => {
      const mockModel = (geminiService as any).model;
      
      mockModel.countTokens.mockResolvedValue({
        totalTokens: 10,
      });

      const tokenCount = await geminiService.countTokens('Test text');
      
      expect(tokenCount).toBe(10);
    });

    it('should fallback to estimation on error', async () => {
      const mockModel = (geminiService as any).model;
      
      mockModel.countTokens.mockRejectedValue(new Error('Token counting failed'));

      const tokenCount = await geminiService.countTokens('Test text with 20 chars');
      
      // Should estimate roughly 5 tokens (20 chars / 4)
      expect(tokenCount).toBe(5);
    });
  });
});