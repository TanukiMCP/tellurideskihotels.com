/**
 * Experience Address Utilities
 * Loads and provides access to experience address data
 */

export interface ExperienceAddress {
  productCode: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  location: string;
  latitude: number;
  longitude: number;
  meetingPoint: string;
}

let addressMap: Map<string, ExperienceAddress> | null = null;
let addressMapPromise: Promise<Map<string, ExperienceAddress>> | null = null;

async function loadAddressMap(): Promise<Map<string, ExperienceAddress>> {
  if (addressMap) {
    return addressMap;
  }

  if (addressMapPromise) {
    return addressMapPromise;
  }

  addressMapPromise = (async () => {
    addressMap = new Map();

    try {
      const response = await fetch('/data/telluride-experience-addresses.json');
      if (response.ok) {
        const addresses: ExperienceAddress[] = await response.json();
        addresses.forEach((addr) => {
          addressMap!.set(addr.productCode, addr);
        });
      }
    } catch (error) {
      console.warn('[Experience Addresses] Could not load address mappings:', error);
    }

    return addressMap;
  })();

  return addressMapPromise;
}

export async function getExperienceAddress(productCode: string): Promise<ExperienceAddress | null> {
  const map = await loadAddressMap();
  return map.get(productCode) || null;
}

export function getExperienceAddressSync(productCode: string): ExperienceAddress | null {
  if (!addressMap) {
    // Trigger async load
    loadAddressMap();
    return null;
  }
  return addressMap.get(productCode) || null;
}

export async function getAllAddresses(): Promise<Map<string, ExperienceAddress>> {
  return await loadAddressMap();
}

