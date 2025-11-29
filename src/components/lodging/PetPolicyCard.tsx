import { Card, CardContent } from '@/components/ui/Card';
import { Dog, Check, AlertCircle, DollarSign, Scale, Info, Heart } from 'lucide-react';

interface PetPolicyCardProps {
  amenities: Array<{ name?: string; code?: string }>;
  importantInformation?: string;
  hotelName?: string;
}

/**
 * PetPolicyCard - Displays pet-friendly status and policies for a hotel
 * Shows prominently when a property allows pets, with policy details
 */
export function PetPolicyCard({ amenities, importantInformation, hotelName }: PetPolicyCardProps) {
  // Check if property is pet-friendly
  const petAmenities = amenities.filter(a => {
    const name = (a.name || a.code || '').toLowerCase();
    return name.includes('pet') || name.includes('dog');
  });
  
  const isPetFriendly = petAmenities.length > 0;
  
  // If not pet-friendly, don't render anything
  if (!isPetFriendly) {
    return null;
  }
  
  // Extract pet policy from important information
  const extractPetPolicy = (info: string | undefined) => {
    if (!info) return null;
    
    const sentences = info.split(/[.!?]+/);
    const petSentences = sentences.filter(s => 
      s.toLowerCase().includes('pet') || 
      s.toLowerCase().includes('dog') ||
      s.toLowerCase().includes('animal')
    );
    
    return petSentences.length > 0 ? petSentences.map(s => s.trim()).filter(Boolean) : null;
  };
  
  const petPolicySentences = extractPetPolicy(importantInformation);
  
  // Try to parse specific policy details
  const parsePolicyDetails = (policies: string[] | null) => {
    if (!policies) return { hasFee: false, feeAmount: null, weightLimit: null, restrictions: [] };
    
    const fullText = policies.join(' ').toLowerCase();
    
    // Check for fees
    const hasFee = fullText.includes('fee') || fullText.includes('charge') || fullText.includes('deposit');
    const feeMatch = policies.join(' ').match(/\$(\d+(?:\.\d{2})?)/);
    const feeAmount = feeMatch ? `$${feeMatch[1]}` : null;
    
    // Check for weight limits
    const weightMatch = policies.join(' ').match(/(\d+)\s*(?:lbs?|pounds?)/i);
    const weightLimit = weightMatch ? `${weightMatch[1]} lbs` : null;
    
    // Extract restrictions
    const restrictions: string[] = [];
    if (fullText.includes('contact')) restrictions.push('Contact property for details');
    if (fullText.includes('advance') || fullText.includes('prior')) restrictions.push('Advance notice required');
    if (fullText.includes('breed')) restrictions.push('Breed restrictions may apply');
    if (fullText.includes('refundable')) restrictions.push('Deposit may be refundable');
    
    return { hasFee, feeAmount, weightLimit, restrictions };
  };
  
  const policyDetails = parsePolicyDetails(petPolicySentences);
  
  return (
    <Card className="border-amber-200 shadow-lg bg-gradient-to-br from-amber-50 to-white overflow-hidden">
      <CardContent className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
            <Dog className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-amber-900">Pet-Friendly Property</h2>
            <p className="text-amber-700 text-sm font-medium">Furry friends welcome!</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              <Check className="w-4 h-4" />
              Pets Allowed
            </span>
          </div>
        </div>
        
        {/* Pet Amenities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {petAmenities.map((amenity, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-3 bg-white rounded-xl p-4 border border-amber-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-amber-600" />
              </div>
              <span className="font-medium text-neutral-800">{amenity.name || amenity.code}</span>
            </div>
          ))}
        </div>
        
        {/* Policy Details */}
        {(policyDetails.hasFee || policyDetails.weightLimit || petPolicySentences) && (
          <div className="bg-white rounded-xl border border-amber-200 p-5">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-600" />
              Pet Policy Details
            </h3>
            
            {/* Quick Facts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Fee Status */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${policyDetails.hasFee ? 'bg-amber-100' : 'bg-green-100'}`}>
                  <DollarSign className={`w-4 h-4 ${policyDetails.hasFee ? 'text-amber-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase font-semibold">Pet Fee</p>
                  <p className="font-semibold text-neutral-900">
                    {policyDetails.feeAmount || (policyDetails.hasFee ? 'Fees Apply' : 'Contact Property')}
                  </p>
                </div>
              </div>
              
              {/* Weight Limit */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase font-semibold">Weight Limit</p>
                  <p className="font-semibold text-neutral-900">
                    {policyDetails.weightLimit || 'Contact Property'}
                  </p>
                </div>
              </div>
              
              {/* Notice Required */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase font-semibold">Booking</p>
                  <p className="font-semibold text-neutral-900">
                    {policyDetails.restrictions.some(r => r.includes('notice')) ? 'Advance Notice' : 'Standard'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Policy Text */}
            {petPolicySentences && petPolicySentences.length > 0 && (
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {petPolicySentences.join('. ')}.
                </p>
              </div>
            )}
            
            {/* Contact Reminder */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Tip:</strong> We recommend contacting the property directly before booking to confirm their current pet policy, fees, and any breed or size restrictions.
                </span>
              </p>
            </div>
          </div>
        )}
        
        {/* No Specific Policy - Generic Message */}
        {!petPolicySentences && !policyDetails.hasFee && (
          <div className="bg-white rounded-xl border border-amber-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Pet Policy</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  This property welcomes pets! Specific policies, fees, and restrictions may apply. 
                  We recommend contacting the property directly before booking to confirm their 
                  pet-friendly accommodations and any associated charges.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


