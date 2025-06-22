import OpenAI from 'openai';
import type { AIGenerateLayoutRequest, AIRewriteRequest, LayoutSection } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

// Test OpenAI connection
export const testOpenAIConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    if (import.meta.env.VITE_OPENAI_API_KEY === 'sk-your_openai_api_key_here') {
      return { success: false, error: 'Please replace the placeholder OpenAI API key with your actual key' };
    }

    // Make a simple test request
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "Hello"' }],
      max_tokens: 5
    });

    if (response.choices[0]?.message?.content) {
      return { success: true };
    } else {
      return { success: false, error: 'No response from OpenAI' };
    }
  } catch (error: any) {
    console.error('OpenAI connection test failed:', error);
    
    if (error.code === 'invalid_api_key') {
      return { success: false, error: 'Invalid OpenAI API key. Please check your key in the .env file.' };
    } else if (error.code === 'insufficient_quota') {
      return { success: false, error: 'OpenAI quota exceeded. Please check your OpenAI account billing.' };
    } else if (error.message?.includes('network')) {
      return { success: false, error: 'Network error. Please check your internet connection.' };
    } else {
      return { success: false, error: `OpenAI API error: ${error.message || 'Unknown error'}` };
    }
  }
};

export const generateLayout = async ({ prompt, currentLayout, projectType }: AIGenerateLayoutRequest): Promise<LayoutSection[]> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'sk-your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }

    const systemPrompt = `You are an expert resume/CV builder AI. Generate a structured layout for a ${projectType} based on the user's prompt. 
    
    Return a JSON array of layout sections with this exact structure:
    [
      {
        "id": "unique-id",
        "type": "header|photo|section|text|skills|experience|education|contact",
        "title": "Section Title (optional)",
        "content": "text content or array of items",
        "order": number
      }
    ]
    
    Available types:
    - header: Main name/title section
    - contact: Contact information
    - photo: Profile photo placeholder
    - section: General text section
    - skills: List of skills
    - experience: Work experience
    - education: Educational background
    - text: Free text area
    
    Generate a professional, well-structured layout that matches the user's request.`;

    const userPrompt = `Generate a ${projectType} layout for: ${prompt}
    
    ${currentLayout ? `Current layout to modify: ${JSON.stringify(currentLayout)}` : ''}
    
    Please provide only the JSON array, no additional text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const layout = JSON.parse(content.trim()) as LayoutSection[];
    
    // Ensure each section has a unique ID and proper order
    return layout.map((section, index) => ({
      ...section,
      id: section.id || `section-${Date.now()}-${index}`,
      order: section.order || index
    }));

  } catch (error: any) {
    console.error('Error generating layout:', error);
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your key in the .env file.');
    } else if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI quota exceeded. Please check your OpenAI account billing.');
    } else if (error.message?.includes('JSON')) {
      throw new Error('Failed to parse AI response. Please try again.');
    } else {
      throw new Error(`AI generation failed: ${error.message || 'Unknown error'}`);
    }
  }
};

export const rewriteText = async ({ text, context, tone = 'professional' }: AIRewriteRequest): Promise<string> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'sk-your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }

    const systemPrompt = `You are a professional writing assistant specializing in resumes and cover letters. 
    Rewrite the provided text to be more engaging, professional, and impactful while maintaining the original meaning.
    
    Tone: ${tone}
    Context: This text is for a ${context}
    
    Rules:
    - Keep the same general structure and key information
    - Make it more compelling and action-oriented
    - Use strong action verbs
    - Be concise but impactful
    - Maintain professional language
    - Return only the rewritten text, no additional commentary`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Rewrite this text: "${text}"` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const rewrittenText = response.choices[0]?.message?.content;
    if (!rewrittenText) {
      throw new Error('No response from OpenAI');
    }

    return rewrittenText.trim();

  } catch (error: any) {
    console.error('Error rewriting text:', error);
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your key in the .env file.');
    } else if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI quota exceeded. Please check your OpenAI account billing.');
    } else {
      throw new Error(`AI rewrite failed: ${error.message || 'Unknown error'}`);
    }
  }
};

// Helper function to check if OpenAI API key is configured
export const isOpenAIConfigured = (): boolean => {
  return !!import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'sk-your_openai_api_key_here';
};

// Mock functions for development/testing when OpenAI is not configured
export const mockGenerateLayout = (projectType: 'resume' | 'cover-letter'): LayoutSection[] => {
  if (projectType === 'resume') {
    return [
      {
        id: 'header-1',
        type: 'header',
        title: 'John Doe',
        content: 'Software Developer',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact',
        title: 'Contact',
        content: 'john.doe@email.com | (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe',
        order: 1
      },
      {
        id: 'skills-1',
        type: 'skills',
        title: 'Skills',
        content: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
        order: 2
      },
      {
        id: 'experience-1',
        type: 'experience',
        title: 'Experience',
        content: 'Software Developer at Tech Company (2020-Present)\n• Developed web applications using React and Node.js\n• Collaborated with cross-functional teams',
        order: 3
      },
      {
        id: 'education-1',
        type: 'education',
        title: 'Education',
        content: 'Bachelor of Computer Science\nUniversity Name (2016-2020)',
        order: 4
      }
    ];
  } else {
    return [
      {
        id: 'header-1',
        type: 'header',
        title: 'Cover Letter',
        content: 'John Doe',
        order: 0
      },
      {
        id: 'text-1',
        type: 'text',
        title: 'Introduction',
        content: 'Dear Hiring Manager,\n\nI am writing to express my interest in the position...',
        order: 1
      },
      {
        id: 'text-2',
        type: 'text',
        title: 'Body',
        content: 'In my previous role, I have demonstrated...',
        order: 2
      },
      {
        id: 'text-3',
        type: 'text',
        title: 'Closing',
        content: 'Thank you for your consideration.\n\nSincerely,\nJohn Doe',
        order: 3
      }
    ];
  }
};

export const mockRewriteText = (text: string): string => {
  return `[AI Enhanced] ${text}`;
}; 