import { Type } from '@google/genai';

export default [
  {
    name: 'add_feature',
    description: 'Add a new feature to the feature map. Call this when you identify a new feature in the codebase.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Feature name' },
        user_description: { type: Type.STRING, description: 'Non-technical description (should be 3-4 sentences and be written so someone who knows very little code can understand it' },
        technical_description: { type: Type.STRING, description: 'Technical description (should a 5 sentence, in depth, technical description so an AI that reads it later will understand perfectly how it works' },
        file_references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of file paths that are relevant to this feature',
        },
      },
      required: ['name', 'user_description', 'technical_description', 'file_references'],
    },
  },
  {
    name: 'update_feature',
    description: 'Update an existing feature in the feature map. Call this when the feature alreayd exists and you need to update the feature.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Feature name' },
        user_description: { type: Type.STRING, description: 'Non-technical description (should be 3-4 sentences and be written so someone who knows very little code can understand it' },
        technical_description: { type: Type.STRING, description: 'Technical description (should a 5 sentence, in depth, technical description so an AI that reads it later will understand perfectly how it works' },
        file_references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of file paths that are relevant to this features',
        },
      },
      required: ['name', 'user_description', 'technical_description', 'file_references'],
    },
  },
];
