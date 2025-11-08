/**
 * SnoCountry API Type Definitions
 * For Telluride Ski Resort conditions
 */

export interface SkiConditions {
  resortName: string;
  timestamp: Date;
  conditions: {
    newSnow24hr: number; // inches
    newSnow48hr: number; // inches
    newSnow72hr: number; // inches
    baseDepthMin: number; // inches (base area)
    baseDepthMax: number; // inches (summit)
    surfaceCondition: string;
    temperatureHigh: number;
    temperatureLow: number;
  };
  trails: {
    total: number;
    open: number;
    percentOpen: number;
  };
  lifts: {
    total: number;
    open: number;
    percentOpen: number;
  };
  terrainParks: {
    total: number;
    open: number;
  };
}

export interface SnoCountryApiResponse {
  items: {
    resortName: string;
    reportDateTime: string;
    weatherCondition: string;
    weatherIcon: string;
    surfaceCondition: string;
    trailsOpen: number;
    trailsTotal: number;
    liftsOpen: number;
    liftsTotal: number;
    acresOpen: number;
    terrainParksOpen: number;
    terrainParksTotal: number;
    baseAreaDepth: number;
    topMountainDepth: number;
    newSnowOvernight: number;
    newSnow24Hours: number;
    newSnow48Hours: number;
    newSnow72Hours: number;
    tempHigh: number;
    tempLow: number;
  }[];
}

