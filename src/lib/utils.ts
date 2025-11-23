import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getExcerpt(content: string, maxLength: number = 200): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/#{1,6}\s/g, '') // Remove headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
    .replace(/`(.+?)`/g, '$1') // Remove code
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();

  return truncate(plainText, maxLength);
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // Round up to nearest dollar for cleaner display
  const roundedAmount = Math.ceil(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedAmount);
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Rewrite room title to be more guest-friendly
 * Converts technical names like "Room, 1 King Bed, Accessible (Mobility/Hearing, w/RI Shower)"
 * to friendly names like "Accessible King Room with Roll-In Shower"
 */
export function formatRoomTitle(roomName: string): string {
  if (!roomName) return 'Standard Room';
  
  // Extract key information
  const hasAccessible = /accessible|mobility|hearing|roll-in|ri shower/i.test(roomName);
  const hasKing = /king/i.test(roomName);
  const hasQueen = /queen/i.test(roomName);
  const hasDouble = /double/i.test(roomName);
  const hasTwin = /twin/i.test(roomName);
  const hasRollInShower = /roll-in|ri shower/i.test(roomName);
  
  // Build friendly title
  let title = '';
  
  // Start with accessibility if present (but make it secondary)
  if (hasAccessible) {
    if (hasKing) {
      title = 'Accessible King Room';
    } else if (hasQueen) {
      title = 'Accessible Queen Room';
    } else if (hasDouble) {
      title = 'Accessible Double Room';
    } else if (hasTwin) {
      title = 'Accessible Twin Room';
    } else {
      title = 'Accessible Room';
    }
    
    // Add roll-in shower detail if mentioned
    if (hasRollInShower) {
      title += ' with Roll-In Shower';
    }
  } else {
    // Non-accessible rooms
    if (hasKing) {
      title = 'King Room';
    } else if (hasQueen) {
      title = 'Queen Room';
    } else if (hasDouble) {
      title = 'Double Room';
    } else if (hasTwin) {
      title = 'Twin Room';
    } else {
      // Fallback: clean up the original name
      title = roomName
        .replace(/^Room,\s*/i, '')
        .replace(/\s*\([^)]*\)/g, '')
        .trim();
      
      // If still too technical, use generic
      if (title.length < 5 || title === roomName) {
        title = 'Standard Room';
      }
    }
  }
  
  return title || 'Standard Room';
}

// Removed Stripe fee calculation - now using liteAPI payment SDK (no additional fees!)