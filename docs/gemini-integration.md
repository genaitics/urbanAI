# Gemini 2.5 Flash-Lite Integration Documentation

## Overview

This document provides comprehensive guidance for integrating Google's Gemini 2.5 Flash-Lite AI model into the Urban Harvest AI application.

## System Requirements

### Memory Requirements
- **Minimum**: 512MB RAM for basic operations
- **Recommended**: 1GB+ RAM for optimal performance
- **Browser**: Modern browsers with ES2020+ support

### Processing Requirements
- **CPU**: Modern multi-core processor
- **Network**: Stable internet connection (minimum 1 Mbps)
- **Storage**: 50MB for caching and temporary files

### Supported Platforms
- **Web Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Node.js**: Version 18+ (for server-side operations)
- **Mobile**: iOS 14+, Android 10+

## API Configuration

### Environment Variables
```bash
# Required
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional Configuration
VITE_GEMINI_MODEL=gemini-2.5-flash-lite
VITE_GEMINI_TEMPERATURE=0.7
VITE_GEMINI_MAX_TOKENS=2048
```

### Rate Limits
- **Requests per minute**: 60
- **Tokens per minute**: 32,000
- **Concurrent requests**: 5
- **Image uploads**: 20 per minute

## Implementation Examples

### Basic Text Generation
```typescript
import { useAI } from '../hooks/useAI';

function ChatComponent() {
  const { generateResponse, isLoading, error } = useAI({ type: 'chat' });

  const handleSendMessage = async (message: string) => {
    try {
      const response = await generateResponse(message);
      console.log('AI Response:', response);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  return (
    <div>
      {isLoading && <div>Generating response...</div>}
      {error && <div>Error: {error}</div>}
      {/* Chat UI components */}
    </div>
  );
}
```

### Streaming Responses
```typescript
function StreamingChat() {
  const { generateStreamResponse } = useAI({ streaming: true });
  const [streamedContent, setStreamedContent] = useState('');

  const handleStreamMessage = async (message: string) => {
    setStreamedContent('');
    
    try {
      const stream = await generateStreamResponse(message);
      
      for await (const chunk of stream) {
        setStreamedContent(prev => prev + chunk);
      }
    } catch (err) {
      console.error('Streaming failed:', err);
    }
  };

  return (
    <div>
      <div>{streamedContent}</div>
    </div>
  );
}
```

### Image Analysis
```typescript
function PlantIdentifier() {
  const { analyzeImage, isLoading } = useAI();

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      
      try {
        const analysis = await analyzeImage(
          imageData,
          'Identify this plant and provide care instructions'
        );
        console.log('Plant Analysis:', analysis);
      } catch (err) {
        console.error('Image analysis failed:', err);
      }
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
      />
      {isLoading && <div>Analyzing image...</div>}
    </div>
  );
}
```

## Security Best Practices

### API Key Management
```typescript
// ✅ Good: Environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ❌ Bad: Hardcoded keys
const apiKey = 'AIzaSyC...'; // Never do this!
```

### Input Validation
```typescript
function validateInput(input: string): boolean {
  // Check for malicious content
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim()
    .slice(0, 4000); // Limit length
}
```

### Content Filtering
```typescript
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];
```

## Performance Optimization

### Caching Strategy
```typescript
class ResponseCache {
  private cache = new Map<string, { response: string; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): string | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.response;
  }

  set(key: string, response: string): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }
}
```

### Request Batching
```typescript
class RequestBatcher {
  private queue: Array<{ prompt: string; resolve: Function; reject: Function }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  async addRequest(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, resolve, reject });
      
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatch(), 100);
      }
    });
  }

  private async processBatch(): Promise<void> {
    const batch = this.queue.splice(0, 5); // Process up to 5 requests
    this.batchTimeout = null;

    // Process batch requests concurrently
    const promises = batch.map(async ({ prompt, resolve, reject }) => {
      try {
        const response = await geminiService.generateContent(prompt);
        resolve(response.text);
      } catch (error) {
        reject(error);
      }
    });

    await Promise.allSettled(promises);
  }
}
```

## Monitoring and Analytics

### Performance Metrics
```typescript
class PerformanceMonitor {
  private metrics = {
    requestCount: 0,
    averageResponseTime: 0,
    errorRate: 0,
    tokenUsage: 0,
  };

  recordRequest(duration: number, tokens: number, success: boolean): void {
    this.metrics.requestCount++;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + duration) / 2;
    this.metrics.tokenUsage += tokens;
    
    if (!success) {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.requestCount - 1) + 1) / 
        this.metrics.requestCount;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }
}
```

### Error Tracking
```typescript
class ErrorTracker {
  private errors: Array<{
    timestamp: Date;
    error: string;
    context: any;
  }> = [];

  logError(error: Error, context: any = {}): void {
    this.errors.push({
      timestamp: new Date(),
      error: error.message,
      context,
    });

    // Send to monitoring service
    if (import.meta.env.PROD) {
      this.sendToMonitoring(error, context);
    }
  }

  private sendToMonitoring(error: Error, context: any): void {
    // Implementation for error reporting service
    console.error('Production Error:', error, context);
  }
}
```

## Testing Protocol

### Unit Tests
```typescript
describe('Gemini Integration', () => {
  test('should generate valid responses', async () => {
    const service = new GeminiService({ apiKey: 'test-key', model: 'test-model' });
    const response = await service.generateContent('Test prompt');
    
    expect(response.text).toBeDefined();
    expect(response.text.length).toBeGreaterThan(0);
  });

  test('should handle rate limiting', async () => {
    // Test rate limiting implementation
  });

  test('should retry on failures', async () => {
    // Test retry mechanism
  });
});
```

### Integration Tests
```typescript
describe('AI Orchestrator', () => {
  test('should fallback to alternative providers', async () => {
    const orchestrator = new AIOrchestrator();
    // Mock Gemini failure
    // Verify fallback to OpenAI/DeepSeek
  });

  test('should handle image analysis', async () => {
    const orchestrator = new AIOrchestrator();
    const result = await orchestrator.analyzeImage(mockImageData, 'Identify plant');
    
    expect(result).toContain('plant');
  });
});
```

### Load Testing
```typescript
describe('Performance Tests', () => {
  test('should handle concurrent requests', async () => {
    const promises = Array(10).fill(null).map(() => 
      geminiService.generateContent('Test prompt')
    );
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled');
    
    expect(successful.length).toBeGreaterThan(7); // 70% success rate minimum
  });
});
```

## Known Limitations

### API Limitations
- **Context Window**: 32,768 tokens maximum
- **Image Size**: 20MB maximum per image
- **Request Timeout**: 60 seconds maximum
- **Concurrent Requests**: 5 maximum

### Model Limitations
- **Language Support**: Primarily English, limited multilingual support
- **Real-time Data**: No access to current events or real-time information
- **File Processing**: Limited to images, no document processing

### Browser Limitations
- **CORS**: API calls must be made from allowed origins
- **Storage**: Limited local storage for caching
- **Memory**: Large responses may cause memory issues on low-end devices

## Troubleshooting

### Common Issues

#### API Key Issues
```typescript
// Check API key validity
if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error('Gemini API key not configured');
}

if (import.meta.env.VITE_GEMINI_API_KEY.length < 30) {
  console.warn('API key appears to be invalid');
}
```

#### Rate Limit Handling
```typescript
// Implement exponential backoff
async function handleRateLimit(error: any): Promise<void> {
  if (error.status === 429) {
    const retryAfter = error.headers?.['retry-after'] || 60;
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }
}
```

#### Network Issues
```typescript
// Implement network retry logic
async function retryOnNetworkError<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === maxRetries - 1 || !isNetworkError(error)) {
        throw error;
      }
      
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Migration Guide

### From Mock Implementation
1. Replace mock responses with actual Gemini API calls
2. Update error handling for real API errors
3. Implement proper rate limiting
4. Add authentication and security measures

### From Other AI Providers
1. Update API endpoints and authentication
2. Modify request/response formats
3. Adjust rate limiting parameters
4. Update error handling logic

This integration guide provides a comprehensive foundation for implementing Gemini 2.0 Flash AI in the Urban Harvest AI application with proper error handling, security, and performance optimization.