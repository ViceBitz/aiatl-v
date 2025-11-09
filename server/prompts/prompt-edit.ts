import { Type } from '@google/genai';

export default [
    {
        name: 'update_file',
        description: 'Function that allows an AI Agent to modify the contents of a specific file in a GitHub repository.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                filename: { type: Type.STRING, description: 'The filename of the file that is being updated.' },
                content: { type: Type.STRING, description: 'The content of the file that is being updated.' },
            },
            required: ['content', 'filename'],
        }
    },
    {
        name: 'add_file',
        description: 'Function that allows an AI Agent to create a file and insert content into the new file in a GitHub repository.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                filename: { type: Type.STRING, description: 'The filename of the new file being created.' },
                content: { type: Type.STRING, description: 'The content of the new file that is being added.' },
            },
            required: ['content', 'filename'],
        },
    }
];