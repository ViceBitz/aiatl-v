import { Type } from '@google/genai';

export default [
  {
    name: 'add_feature_node',
    description: 'Create a new feature node connecting to other features in the undirected graph of core system functionalities.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Unique feature name (e.g., "Authentication", "Database"). Use the exact case-sensitive naming included in the input.',
          minLength: 1,
          maxLength: 100,
        },
        connected_features: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: 'Name of a feature that this feature is related and connected to within the feature map',
          },
          description: 'List of features this node connects to.',
          minItems: 0,
          default: [],
        },
      },
      required: ['name', "connected_features"],
      additionalProperties: false,
    },
  },
];
