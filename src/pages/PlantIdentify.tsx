import React, { useState, useRef } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAI } from '../hooks/useAI';
import { PlantLoadingAnimation } from '../components/ui/PlantLoadingAnimation';

interface IdentificationResult {
  name: string;
  scientificName: string;
  disease: string;
  diseaseDescription: string;
  cureDo: string[];
  cureDont: string[];
}

export function PlantIdentify() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { analyzeImage } = useAI({ type: 'identification' });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentify = async () => {
    if (!selectedImage) return;
    setIsIdentifying(true);
    try {
      const geminiResponse: string = await analyzeImage(
        selectedImage,
        `You are a plant pathology and identification expert. Analyze the provided plant image and return a JSON object with:
        - plant_name
        - scientific_name
        - disease_name
        - disease_description
        - treatment: { advice: [], avoid: [] }`
      );

      let parsed: any = {};
      try {
        const cleaned = geminiResponse.replace(/```json\s*|```\s*/gi, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        const extractedJsonString = geminiResponse.match(/\{[\s\S]*\}/)?.[0];
        if (extractedJsonString) {
          try {
            parsed = JSON.parse(extractedJsonString);
          } catch {
            fallbackRaw();
            return;
          }
        } else {
          fallbackRaw();
          return;
        }
      }

      setResult({
        name: parsed.plant_name || 'Unknown',
        scientificName: parsed.scientific_name || '',
        disease: parsed.disease_name || '',
        diseaseDescription: parsed.disease_description || '',
        cureDo: Array.isArray(parsed.treatment?.advice) ? parsed.treatment.advice : [],
        cureDont: Array.isArray(parsed.treatment?.avoid) ? parsed.treatment.avoid : [],
      });
    } catch (error) {
      console.error('Error identifying plant:', error);
    } finally {
      setIsIdentifying(false);
    }
  };

  const fallbackRaw = () => {
    setResult({
      name: 'Unknown',
      scientificName: '',
      disease: '',
      diseaseDescription: 'The AI response was not properly formatted. Please try again with a clearer image.',
      cureDo: [],
      cureDont: [],
    });
  };

  const clearImage = () => {
    setSelectedImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Plant Identification</h1>
        <p className="text-gray-600">Upload a plant image to identify it and diagnose possible diseases using AI.</p>
      </div>

      <Card variant="elevated">
        <CardContent className="p-6">
          {!selectedImage ? (
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <h2 className="text-xl font-semibold mb-2">Upload Plant Photo</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Choose Image
              </Button>
              <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG, WebP formats</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Uploaded plant"
                  className="w-32 h-32 object-cover rounded border shadow"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <Button onClick={handleIdentify} disabled={isIdentifying} isLoading={isIdentifying}>
                  Identify
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {isIdentifying && (
        <div className="flex justify-center items-center py-8">
          <PlantLoadingAnimation />
        </div>
      )}

      {result && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-40">
                <img src={selectedImage!} alt="Identified plant" className="rounded shadow object-cover w-full h-40" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">🌿 {result.name}</h2>
                <p className="italic text-gray-600 mb-2">{result.scientificName}</p>
                {result.disease && <p className="text-lg font-semibold text-red-600 mb-2">🦠 Disease: {result.disease}</p>}
                <p className="mb-4 text-gray-800">
                  <strong>Why it occurred:</strong> {result.diseaseDescription}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded border">
                    <h3 className="text-lg font-semibold mb-2">✅ What to do</h3>
                    <ul className="list-disc pl-5">
                      {result.cureDo.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded border">
                    <h3 className="text-lg font-semibold mb-2">🚫 What not to do</h3>
                    <ul className="list-disc pl-5">
                      {result.cureDont.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
