import OpenAI from 'openai';
import type { AIGenerateLayoutRequest, AIRewriteRequest, AISectionRewriteRequest, LayoutSection } from '../types';

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
      model: 'gpt-4.1-nano',
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

    // Professional document limits for one-page layout
    const maxSections = projectType === 'resume' ? 8 : 6;
    
    const systemPrompt = `You are an expert resume/CV builder AI. Generate a structured layout for a ${projectType} based on the user's prompt. 
    
    CRITICAL: Professional ${projectType}s must fit on ONE PAGE. Generate MAXIMUM ${maxSections} sections.
    ${projectType === 'resume' 
      ? 'For resumes: typically header, contact, summary, experience, skills, education + max 2 optional sections'
      : 'For cover letters: typically header, contact, introduction, 2-3 body paragraphs, closing'
    }
    
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
    
    SECTION LIMIT ENFORCEMENT:
    - NEVER exceed ${maxSections} sections total
    - Prioritize essential sections for professional impact
    - Combine related content into single sections if needed
    - Focus on quality over quantity for one-page layout
    
    CRITICAL CONTENT FORMATTING RULES:
    - content MUST be either a STRING or an ARRAY OF STRINGS
    - NEVER use objects like {Name: "John", Phone: "123"} 
    - For contact info, use a single string with line breaks: "john@email.com\n(555) 123-4567\nLinkedIn: linkedin.com/in/john"
    - For skills, use an array: ["JavaScript", "React", "Node.js"]
    - For other sections, use plain text strings with \n for line breaks
    
    Available types:
    - header: Main name/title section (content should be professional title as string)
    - contact: Contact information (content should be formatted string with \n separators)
    - photo: Profile photo placeholder (content should be descriptive string)
    - section: General text section (content should be plain text string)
    - skills: List of skills (content should be array of skill strings)
    - experience: Work experience (content should be formatted text string)
    - education: Educational background (content should be formatted text string)
    - text: Free text area (content should be plain text string)
    
    Generate a professional, well-structured layout that matches the user's request while staying within the ${maxSections} section limit.`;

    const userPrompt = `Generate a ${projectType} layout for: ${prompt}
    
    ${currentLayout ? `Current layout to modify: ${JSON.stringify(currentLayout)}` : ''}
    
    Please provide only the JSON array, no additional text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
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
    
    // Validate and sanitize content to ensure proper format
    const sanitizedLayout = layout.map((section, index) => {
      let sanitizedContent: string | string[];
      
      // Handle different content types and ensure proper format
      if (typeof section.content === 'object' && section.content !== null && !Array.isArray(section.content)) {
        // Convert object to string format
        const obj = section.content as Record<string, any>;
        if (section.type === 'contact') {
          // Convert contact object to formatted string
          sanitizedContent = Object.entries(obj)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        } else {
          // For other types, convert to simple string
          sanitizedContent = Object.values(obj).join(', ');
        }
      } else if (Array.isArray(section.content)) {
        // Ensure array contains only strings
        sanitizedContent = section.content.map(item => 
          typeof item === 'string' ? item : String(item)
        );
      } else if (typeof section.content === 'string') {
        sanitizedContent = section.content;
      } else {
        // Fallback for any other type
        sanitizedContent = String(section.content || '');
      }
      
      return {
        ...section,
        id: section.id || `section-${Date.now()}-${index}`,
        order: section.order || index,
        content: sanitizedContent
      };
    });
    
    // Ensure each section has a unique ID and proper order
    const finalLayout = sanitizedLayout.map((section, index) => ({
      ...section,
      order: index
    }));
    
    // Enforce section limits (safety check)
    if (finalLayout.length > maxSections) {
      console.warn(`AI generated ${finalLayout.length} sections, limiting to ${maxSections} for professional one-page layout`);
      return finalLayout.slice(0, maxSections);
    }
    
    return finalLayout;

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
      model: 'gpt-4.1-nano',
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

export const rewriteSection = async ({ 
  title, 
  content, 
  sectionType, 
  context, 
  tone = 'professional' 
}: AISectionRewriteRequest): Promise<{ title?: string; content: string }> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'sk-your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }

    const contextInfo = `This is a ${sectionType} section for a ${context} (resume/CV/cover letter)`;
    
    const systemPrompt = `You are a professional writing assistant specializing in resumes, CVs, and cover letters. 
    Your task is to rewrite and improve both the section title and content to be more engaging, professional, and impactful.
    
    Tone: ${tone}
    Context: ${contextInfo}
    
    RESPONSE FORMAT: You must respond with valid JSON in exactly this format:
    {
      "title": "improved title here (or null if no title provided or no change needed)",
      "content": "improved content here"
    }
    
    TITLE REWRITING RULES:
    - Only rewrite the title if the content changes significantly require a new title
    - Keep titles concise and professional (2-4 words typically)
    - For standard sections like "Experience", "Education", "Skills" - usually don't change these
    - For custom sections, improve clarity and impact
    - If the original title is already good, return it unchanged
    - If no title was provided or title is generic (like "Section Title"), suggest an appropriate one
    
    CONTENT GENERATION/REWRITING RULES:
    - If content is empty: Generate compelling, professional content appropriate for the section type
    - If content exists: Make it more compelling and action-oriented
    - Use strong action verbs and quantifiable achievements when possible
    - Be concise but impactful
    - Maintain professional language appropriate for ${context}
    - Keep the same general structure and key information (when rewriting existing content)
    - Enhance readability and flow
    - For empty content, create 2-3 sentences of professional, relevant sample content
    
    Return ONLY the JSON response, no additional text or formatting.`;

    const userPrompt = !content.trim() 
      ? `Generate content for a ${sectionType} section${title ? ` with title "${title}"` : ''} for a professional ${context}.`
      : (title 
        ? `Rewrite this section:\nTitle: "${title}"\nContent: "${content}"`
        : `Rewrite this section content: "${content}"`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', responseText);
      // Fallback: treat the entire response as content
      return {
        title: title, // Keep original title
        content: responseText.trim()
      };
    }

    // Validate and sanitize the response
    const sanitizedResult = {
      title: result.title === null || result.title === title ? title : (result.title || title),
      content: result.content || content
    };

    return sanitizedResult;

  } catch (error: any) {
    console.error('Error rewriting section:', error);
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your key in the .env file.');
    } else if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI quota exceeded. Please check your OpenAI account billing.');
    } else {
      throw new Error(`AI section rewrite failed: ${error.message || 'Unknown error'}`);
    }
  }
};

// Helper function to check if OpenAI API key is configured
export const isOpenAIConfigured = (): boolean => {
  return !!import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'sk-your_openai_api_key_here';
};

// Mock functions for development/testing when OpenAI is not configured
export const mockGenerateLayout = (projectType: 'resume' | 'cover-letter'): LayoutSection[] => {
  // Professional one-page document limits
  const maxSections = projectType === 'resume' ? 8 : 6;
  
  if (projectType === 'resume') {
    // Resume layout (8 sections max) - Essential + 2 optional
    const resumeSections: LayoutSection[] = [
      {
        id: 'header-1',
        type: 'header' as const,
        title: 'John Doe',
        content: 'Software Developer',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact' as const,
        title: 'Contact',
        content: 'john.doe@email.com | (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe',
        order: 1
      },
      {
        id: 'summary-1',
        type: 'section' as const,
        title: 'Professional Summary',
        content: 'Results-driven software developer with 3+ years of experience building scalable web applications. Proven track record of delivering high-quality solutions using modern technologies.',
        order: 2
      },
      {
        id: 'experience-1',
        type: 'experience' as const,
        title: 'Professional Experience',
        content: 'Software Developer | Tech Company (2020-Present)\n• Developed web applications using React and Node.js\n• Collaborated with cross-functional teams to deliver projects on time\n• Improved application performance by 40% through code optimization',
        order: 3
      },
      {
        id: 'skills-1',
        type: 'skills' as const,
        title: 'Technical Skills',
        content: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'SQL', 'Git', 'AWS'],
        order: 4
      },
      {
        id: 'education-1',
        type: 'education' as const,
        title: 'Education',
        content: 'Bachelor of Computer Science\nUniversity Name (2016-2020)\nRelevant Coursework: Data Structures, Algorithms, Software Engineering',
        order: 5
      },
      {
        id: 'projects-1',
        type: 'section' as const,
        title: 'Projects',
        content: 'E-commerce Platform | Personal Project\n• Built full-stack application with React and Express\n• Implemented secure payment processing and user authentication',
        order: 6
      },
      {
        id: 'certifications-1',
        type: 'section' as const,
        title: 'Certifications',
        content: 'AWS Certified Developer Associate (2023)\nReact Developer Certification (2022)',
        order: 7
      }
    ];
    
    // Ensure we don't exceed limits
    return resumeSections.slice(0, maxSections);
    
  } else {
    // Cover Letter layout (6 sections max) - Concise professional format
    const coverLetterSections: LayoutSection[] = [
      {
        id: 'header-1',
        type: 'header' as const,
        title: 'John Doe',
        content: 'Software Developer',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact' as const,
        title: 'Contact Information',
        content: 'john.doe@email.com | (555) 123-4567\n[Date]\n\n[Hiring Manager Name]\n[Company Name]',
        order: 1
      },
      {
        id: 'intro-1',
        type: 'text' as const,
        title: 'Introduction',
        content: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Software Developer position at your company. With my background in full-stack development and passion for creating innovative solutions, I am confident I would be a valuable addition to your team.',
        order: 2
      },
      {
        id: 'body-1',
        type: 'text' as const,
        title: 'Experience & Qualifications',
        content: 'In my current role as Software Developer at Tech Company, I have successfully delivered multiple web applications using React and Node.js. My experience includes collaborating with cross-functional teams, optimizing application performance, and implementing modern development practices that align with your company\'s technical requirements.',
        order: 3
      },
      {
        id: 'body-2',
        type: 'text' as const,
        title: 'Value Proposition',
        content: 'I am particularly drawn to your company\'s commitment to innovation and would be excited to contribute to your ongoing projects. My technical skills in JavaScript, TypeScript, and cloud technologies, combined with my ability to work effectively in agile environments, make me well-suited for this role.',
        order: 4
      },
      {
        id: 'closing-1',
        type: 'text' as const,
        title: 'Closing',
        content: 'Thank you for considering my application. I would welcome the opportunity to discuss how my skills and experience can contribute to your team\'s success. I look forward to hearing from you.\n\nSincerely,\nJohn Doe',
        order: 5
      }
    ];
    
    // Ensure we don't exceed limits
    return coverLetterSections.slice(0, maxSections);
  }
};

export const mockRewriteText = (text: string): string => {
  return `[AI Enhanced] ${text}`;
};

export const mockRewriteSection = (content: string, title?: string): { title?: string; content: string } => {
  const shouldRewriteTitle = Math.random() > 0.7; // 30% chance to rewrite title
  
  // Generate content when empty
  if (!content.trim()) {
    const sampleContent = [
      "Professional summary highlighting key achievements and expertise in relevant field",
      "Comprehensive experience overview with quantifiable results and impact metrics",
      "Strategic skills demonstration with real-world application examples",
      "Detailed accomplishments showcasing leadership and problem-solving abilities",
      "Results-driven professional with proven track record of excellence"
    ];
    const randomContent = sampleContent[Math.floor(Math.random() * sampleContent.length)];
    
    const sampleTitles = [
      "Professional Summary",
      "Key Experience", 
      "Core Competencies",
      "Career Highlights",
      "Professional Background"
    ];
    const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
    
    return {
      title: !title || title === 'Section Title' ? randomTitle : (shouldRewriteTitle ? `Enhanced ${title}` : title),
      content: randomContent
    };
  }
  
  return {
    title: shouldRewriteTitle && title ? `Enhanced ${title}` : title,
    content: `[AI Enhanced] ${content}`
  };
}; 