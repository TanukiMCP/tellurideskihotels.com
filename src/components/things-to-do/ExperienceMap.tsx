import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { ViatorProduct } from '@/lib/viator/types';
import { MAPBOX_TOKEN, TELLURIDE_CENTER } from '@/lib/mapbox-utils';
import { formatPrice } from '@/lib/viator/client';
import { getAllAddresses, type ExperienceAddress } from '@/lib/experience-addresses';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ExperienceMapProps {
  experiences: (ViatorProduct & { categories?: string[] })[];
  onSelectExperience?: (productCode: string) => void;
}

// Telluride center coordinates
const DEFAULT_CENTER = TELLURIDE_CENTER || [-107.8125, 37.9375];

export default function ExperienceMap({ experiences, onSelectExperience }: ExperienceMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [popupInfo, setPopupInfo] = useState<{ productCode: string; lng: number; lat: number } | null>(null);
  const [addressMap, setAddressMap] = useState<Map<string, ExperienceAddress>>(() => new Map());
  const [addressesLoaded, setAddressesLoaded] = useState(false);

  // Load address data on mount
  useEffect(() => {
    getAllAddresses().then((map) => {
      setAddressMap(map);
      setAddressesLoaded(true);
    });
  }, []);

  // Get experience location from address data, fallback to Telluride center
  const getExperienceLocation = (productCode: string): [number, number] => {
    const address = addressMap.get(productCode);
    if (address) {
      return [address.longitude, address.latitude];
    }
    // Fallback: distribute markers around Telluride center with slight offsets
    const index = experiences.findIndex(exp => exp.productCode === productCode);
    const offset = (index % 10) * 0.01; // Spread markers slightly
    return [DEFAULT_CENTER[0] + offset, DEFAULT_CENTER[1] + offset];
  };

  const handleMarkerClick = (experience: ViatorProduct) => {
    const [lng, lat] = getExperienceLocation(experience.productCode);
    setSelectedExperience(experience.productCode);
    setPopupInfo({ productCode: experience.productCode, lng, lat });
    
    if (onSelectExperience) {
      onSelectExperience(experience.productCode);
    }
  };

  const handleClosePopup = () => {
    setPopupInfo(null);
    setSelectedExperience(null);
  };

  const selectedExp = experiences.find(exp => exp.productCode === selectedExperience);

  return (
    <div className="relative w-full h-full min-h-[600px]">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: 12,
          pitch: 0,
          bearing: 0,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        style={{ width: '100%', height: '100%' }}
        scrollZoom={true}
        dragPan={true}
        dragRotate={false}
        doubleClickZoom={true}
      >
        <NavigationControl position="top-right" showCompass={true} />

        {/* Experience Markers */}
        {experiences.map((experience) => {
          const [lng, lat] = getExperienceLocation(experience.productCode);
          const isSelected = experience.productCode === selectedExperience;

          return (
            <Marker
              key={experience.productCode}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <div
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMarkerClick(experience)}
                style={{
                  backgroundColor: isSelected ? '#4A7C59' : '#3d6548',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: isSelected ? 1000 : 500,
                }}
              >
                <svg
                  style={{ width: '12px', height: '12px', color: 'white' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </Marker>
          );
        })}

        {/* Popup */}
        {popupInfo && selectedExp && (() => {
          const address = addressMap.get(selectedExp.productCode);
          return (
            <Popup
              longitude={popupInfo.lng}
              latitude={popupInfo.lat}
              anchor="bottom"
              onClose={handleClosePopup}
              closeButton={true}
              closeOnClick={false}
              className="experience-popup"
            >
              <div className="w-64 p-2">
                <h3 className="font-bold text-sm mb-1 line-clamp-2">{selectedExp.title}</h3>
                {address && (
                  <div className="text-xs text-gray-600 mb-2">
                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {address.city}, {address.state}
                  </div>
                )}
                {selectedExp.reviews && selectedExp.reviews.totalReviews > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs text-gray-600">
                      ⭐ {selectedExp.reviews.combinedAverageRating.toFixed(1)} ({selectedExp.reviews.totalReviews})
                    </span>
                  </div>
                )}
                <div className="text-lg font-bold text-primary-600 mb-2">
                  {formatPrice(selectedExp.pricing)}
                </div>
                <a
                  href={`/things-to-do/${selectedExp.productCode}`}
                  className="inline-block w-full text-center bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  View Details
                </a>
              </div>
            </Popup>
          );
        })()}
      </Map>
    </div>
  );
}

