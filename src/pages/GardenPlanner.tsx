import React, { useState } from 'react';
import { MapPin, Sun, Lightbulb } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AIResponseSelector } from '../components/ui/AIResponseSelector';
import { useAI } from '../hooks/useAI';
import { GARDEN_TYPES, SUNLIGHT_REQUIREMENTS } from '../utils/constants';
import { PlantLoadingAnimation } from '../components/ui/PlantLoadingAnimation';

interface GardenPlanForm {
  gardenType: string;
  dimensions: {
    length: number;
    width: number;
    unit: 'ft' | 'm';
  };
  sunlightHours: number;
  location: string;
  experience: string;
  goals: string[];
}

interface PlantRecommendation {
  name: string;
  scientificName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  spacing: string;
  harvestTime: string;
  benefits: string[];
  imageUrl: string;
}

export function GardenPlanner() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<GardenPlanForm>({
    gardenType: '',
    dimensions: { length: 0, width: 0, unit: 'ft' },
    sunlightHours: 6,
    location: '',
    experience: '',
    goals: [],
  });
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<{ text: string; model: string; provider: 'gemini'; error?: string } | null>(null); // Gemini response
  const { generateResponse, getCurrentModel } = useAI({ type: 'planning' });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    
    try {
      const planningPrompt = `Create a detailed garden plan for the following specifications:\n\nGarden Type: ${formData.gardenType}\nDimensions: ${formData.dimensions.length} x ${formData.dimensions.width} ${formData.dimensions.unit}\nSunlight: ${formData.sunlightHours} hours daily\nLocation: ${formData.location}\nExperience Level: ${formData.experience}\nGoals: ${formData.goals.join(', ')}\n\nPlease provide:\n1. Specific plant recommendations with scientific names\n2. Spacing requirements for each plant\n3. Expected harvest times\n4. Care difficulty levels\n5. Benefits of each plant for urban gardening\n6. Layout suggestions for optimal space usage\n7. Seasonal planting schedule\n8. Companion planting recommendations\n\nFormat the response with clear sections and practical advice for urban gardening success.`;

      const geminiResponse: string = await generateResponse(planningPrompt);
      setResponse({
        text: geminiResponse,
        model: getCurrentModel() || 'gemini-2.5-flash-lite',
        provider: 'gemini',
      });
    } catch (error: any) {
      console.error('Error generating garden plan:', error);
      // Handle error appropriately
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPlan = () => {
    // Parse the AI response and create mock recommendations
    // In a real implementation, you would parse the actual AI response
    const mockRecommendations: PlantRecommendation[] = [
      {
        name: 'Cherry Tomatoes',
        scientificName: 'Solanum lycopersicum',
        difficulty: 'easy',
        spacing: '18-24 inches',
        harvestTime: '60-80 days',
        benefits: ['High yield', 'Continuous harvest', 'Great for beginners'],
        imageUrl: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
      },
      {
        name: 'Basil',
        scientificName: 'Ocimum basilicum',
        difficulty: 'easy',
        spacing: '6-12 inches',
        harvestTime: '30-45 days',
        benefits: ['Pest deterrent', 'Culinary herb', 'Fast growing'],
        imageUrl: 'https://images.pexels.com/photos/4750270/pexels-photo-4750270.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
      },
      {
        name: 'Lettuce',
        scientificName: 'Lactuca sativa',
        difficulty: 'easy',
        spacing: '4-6 inches',
        harvestTime: '30-60 days',
        benefits: ['Quick harvest', 'Cool weather crop', 'Space efficient'],
        imageUrl: 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
      },
      {
        name: 'Peppers',
        scientificName: 'Capsicum annuum',
        difficulty: 'medium',
        spacing: '12-18 inches',
        harvestTime: '70-90 days',
        benefits: ['Colorful harvest', 'Heat tolerant', 'Long season'],
        imageUrl: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
      }
    ];

    setRecommendations(mockRecommendations);
    setResponse(null);
    setCurrentStep(5);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                <span>Garden Space</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of garden space do you have?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {GARDEN_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData(prev => ({ ...prev, gardenType: type.value }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        formData.gardenType === type.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Length"
                  type="number"
                  value={formData.dimensions.length || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, length: Number(e.target.value) }
                  }))}
                  placeholder="0"
                />
                <Input
                  label="Width"
                  type="number"
                  value={formData.dimensions.width || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, width: Number(e.target.value) }
                  }))}
                  placeholder="0"
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    value={formData.dimensions.unit}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, unit: e.target.value as 'ft' | 'm' }
                    }))}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="ft">Feet</option>
                    <option value="m">Meters</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sun className="h-5 w-5 text-yellow-600" />
                <span>Growing Conditions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How many hours of direct sunlight does your space get daily?
                </label>
                <div className="space-y-3">
                  {SUNLIGHT_REQUIREMENTS.map((req) => (
                    <button
                      key={req.value}
                      onClick={() => setFormData(prev => ({ ...prev, sunlightHours: req.value === 'low' ? 3 : req.value === 'medium' ? 5 : 7 }))}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        (req.value === 'low' && formData.sunlightHours <= 4) ||
                        (req.value === 'medium' && formData.sunlightHours >= 4 && formData.sunlightHours <= 6) ||
                        (req.value === 'high' && formData.sunlightHours > 6)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{req.label}</div>
                      <div className="text-sm text-gray-600">{req.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Location (City, State)"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., San Francisco, CA"
                helperText="This helps us provide climate-specific recommendations"
              />
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                <span>Experience & Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What's your gardening experience level?
                </label>
                <div className="space-y-3">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData(prev => ({ ...prev, experience: level }))}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        formData.experience === level
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 capitalize">{level}</div>
                      <div className="text-sm text-gray-600">
                        {level === 'beginner' && 'New to gardening, looking for easy-to-grow plants'}
                        {level === 'intermediate' && 'Some experience, ready for moderate challenges'}
                        {level === 'advanced' && 'Experienced gardener, open to complex projects'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What are your gardening goals? (Select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Fresh vegetables',
                    'Herbs for cooking',
                    'Beautiful flowers',
                    'Attract pollinators',
                    'Year-round harvest',
                    'Low maintenance',
                    'Maximum yield',
                    'Unique varieties'
                  ].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => handleGoalToggle(goal)}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                        formData.goals.includes(goal)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{goal}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-primary-600" />
                <span>Get Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                size="lg"
                onClick={generatePlan}
                disabled={isGenerating}
                isLoading={isGenerating}
              >
                Generate Plan
              </Button>
            </CardContent>
          </Card>
        );

      case 5:
        // Show response selector before final recommendations
        if (response) {
          return (
            <div className="space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-center text-2xl text-primary-600">
                    Review Gemini's Garden Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-600 mb-6">
                    Gemini AI has analyzed your requirements. Review the plan below:
                  </p>
                  <AIResponseSelector
                    response={response}
                    onSelect={handleSelectPlan}
                  />
                </CardContent>
              </Card>
            </div>
          );
        }

        // Show final recommendations
        return (
          <div className="space-y-8">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-center text-2xl text-primary-600">
                  🎉 Your Personalized Garden Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  Based on your space and preferences, here are our AI-recommended plants:
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((plant, index) => (
                <Card key={index} variant="elevated" className="overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={plant.imageUrl}
                      alt={plant.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{plant.name}</h3>
                        <p className="text-gray-600 italic">{plant.scientificName}</p>
                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                          plant.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          plant.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {plant.difficulty} difficulty
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">Spacing:</span>
                          <p className="text-gray-600">{plant.spacing}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Harvest:</span>
                          <p className="text-gray-600">{plant.harvestTime}</p>
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-gray-900">Benefits:</span>
                        <ul className="mt-1 space-y-1">
                          {plant.benefits.map((benefit, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={() => {
                  setCurrentStep(1);
                  setRecommendations([]);
                  setResponse(null);
                  setFormData({
                    gardenType: '',
                    dimensions: { length: 0, width: 0, unit: 'ft' },
                    sunlightHours: 6,
                    location: '',
                    experience: '',
                    goals: [],
                  });
                }}
                variant="outline"
              >
                Plan Another Garden
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Garden Planner</h1>
          <p className="text-lg text-gray-600">
            Get personalized plant recommendations from Gemini AI
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep <= 4 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {renderStep()}

        {isGenerating && (
          <div className="flex justify-center items-center py-8">
            <PlantLoadingAnimation />
          </div>
        )}

        {/* Navigation */}
        {currentStep <= 4 && !response && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            {currentStep < 4 && (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !formData.gardenType) ||
                  (currentStep === 2 && !formData.location) ||
                  (currentStep === 3 && (!formData.experience || formData.goals.length === 0))
                }
              >
                Next
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}