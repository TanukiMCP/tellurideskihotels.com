import { HotelGrid } from './HotelGrid';

interface HotelShowcaseProps {
  hotelId: string;
}

/**
 * HotelShowcase component - displays a single hotel in showcase format
 * Wraps HotelGrid with a single hotel ID to reuse the SingleHotelShowcase rendering
 */
export function HotelShowcase({ hotelId }: HotelShowcaseProps) {
  return <HotelGrid hotelIds={[hotelId]} />;
}

