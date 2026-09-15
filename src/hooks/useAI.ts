import { useState, useCallback, useRef, useEffect } from 'react';
import AIOrchestrator from '../services/aiOrchestrator';
import { ChatMessage } from '../types';

interface UseAIOptions {
  type?: 'chat' | 'planning' | 'identification';
  streaming?: boolean;
}

export function useAI(options: UseAIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orchestratorRef = useRef<AIOrchestrator | null>(null);

  useEffect(() => {
    orchestratorRef.current = new AIOrchestrator();
  }, []);

  const generateResponse = useCallback(async (
    message: string,
    context?: ChatMessage[]
  ): Promise<string> => {
    if (!orchestratorRef.current) {
      throw new Error('AI Orchestrator not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await orchestratorRef.current.generateResponse(
        message,
        options.type,
        context
      );
      return response.text || response;
    } catch (err: any) {
      const errorMessage = err.message || 'AI service unavailable';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options.type]);

  const generateStreamResponse = useCallback(async (
    message: string,
    context?: ChatMessage[]
  ): Promise<AsyncGenerator<string, void, unknown>> => {
    if (!orchestratorRef.current) {
      throw new Error('AI Orchestrator not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const stream = await orchestratorRef.current.generateStreamResponse(
        message,
        options.type,
        context
      );
      return stream;
    } catch (err: any) {
      const errorMessage = err.message || 'AI streaming service unavailable';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options.type]);

  const analyzeImage = useCallback(async (
    imageData: string,
    prompt: string = 'Identify this plant and provide detailed care instructions for urban gardening'
  ): Promise<string> => {
    if (!orchestratorRef.current) {
      throw new Error('AI Orchestrator not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await orchestratorRef.current.analyzeImage(imageData, prompt);
      return response.text || response;
    } catch (err: any) {
      const errorMessage = err.message || 'Image analysis service unavailable';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentProvider = useCallback(() => {
    return orchestratorRef.current?.getCurrentProvider() || null;
  }, []);

  const getCurrentModel = useCallback(() => {
    return orchestratorRef.current?.getCurrentModel() || null;
  }, []);

  return {
    generateResponse,
    generateStreamResponse,
    analyzeImage,
    getCurrentProvider,
    getCurrentModel,
    isLoading,
    error,
  };
}