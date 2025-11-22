/**
 * Blog Component Processor
 * Processes component tags in markdown and replaces them with actual components
 */

import type { ComponentInstance } from 'astro/runtime/server/index.js';

export interface ComponentTag {
  name: string;
  props: Record<string, any>;
  raw: string;
}

/**
 * Parse component tags from markdown content
 * Supports both JSX-like syntax and Astro component syntax
 */
export function parseComponentTags(content: string): ComponentTag[] {
  const tags: ComponentTag[] = [];
  
  // Match component tags like <ComponentName prop="value" />
  const componentRegex = /<(\w+)([^>]*?)\/?>/g;
  let match;
  
  while ((match = componentRegex.exec(content)) !== null) {
    const componentName = match[1];
    const propsString = match[2];
    const raw = match[0];
    
    // Skip HTML tags (like <details>, <summary>, etc.)
    const htmlTags = ['details', 'summary', 'p', 'div', 'span', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote'];
    if (htmlTags.includes(componentName.toLowerCase())) {
      continue;
    }
    
    // Parse props
    const props: Record<string, any> = {};
    const propRegex = /(\w+)=["']([^"']+)["']/g;
    let propMatch;
    
    while ((propMatch = propRegex.exec(propsString)) !== null) {
      const key = propMatch[1];
      let value = propMatch[2];
      
      // Try to parse as boolean, number, or keep as string
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(Number(value)) && value !== '') value = Number(value);
      
      props[key] = value;
    }
    
    tags.push({
      name: componentName,
      props,
      raw,
    });
  }
  
  return tags;
}

/**
 * Get component import path based on component name
 */
export function getComponentPath(componentName: string): string | null {
  const componentMap: Record<string, string> = {
    'BlogBookingWidget': '@/components/blog/BlogBookingWidget.astro',
    'BlogHotelCard': '@/components/blog/BlogHotelCard.astro',
    'BlogActivityCard': '@/components/blog/BlogActivityCard.astro',
    'BlogHotelGrid': '@/components/blog/BlogHotelGrid.astro',
    'BlogActivityGrid': '@/components/blog/BlogActivityGrid.astro',
    'BlogHotelShowcase': '@/components/blog/BlogHotelShowcase.astro',
    'BlogImageGallery': '@/components/blog/BlogImageGallery.astro',
    // Legacy component name support
    'ArticleBookingWidget': '@/components/blog/BlogBookingWidget.astro',
  };
  
  return componentMap[componentName] || null;
}

