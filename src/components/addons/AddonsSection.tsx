import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import type { LiteAPIAddon } from '@/lib/liteapi/types';
import type { SelectedAddon } from '@/lib/types';

export interface AddonsSectionProps {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children?: number;
  onAddonSelect: (addons: SelectedAddon[]) => void;
}

export function AddonsSection({
  hotelId,
  nights,
  adults,
  children = 0,
  onAddonSelect,
}: AddonsSectionProps) {
  const [addons, setAddons] = useState<LiteAPIAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchAddons() {
      setLoading(true);
      try {
        const response = await fetch(`/api/hotels/addons?hotelId=${hotelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch add-ons');
        }
        const data = await response.json();
        setAddons(data.data || []);
      } catch (err) {
        console.error('Error fetching add-ons:', err);
      } finally {
        setLoading(false);
      }
    }

    if (hotelId) {
      fetchAddons();
    }
  }, [hotelId]);

  const handleQuantityChange = (addonId: string, quantity: number) => {
    setSelected((prev) => ({
      ...prev,
      [addonId]: quantity,
    }));
  };

  const calculateAddonPrice = (addon: LiteAPIAddon, quantity: number): number => {
    if (!addon.price?.amount || quantity === 0) return 0;

    const basePrice = addon.price.amount;
    const priceType = addon.price.type || 'per_stay';

    switch (priceType) {
      case 'per_stay':
        return basePrice * quantity;
      case 'per_night':
        return basePrice * nights * quantity;
      case 'per_person':
        return basePrice * (adults + children) * quantity;
      case 'per_person_per_night':
        return basePrice * (adults + children) * nights * quantity;
      default:
        return basePrice * quantity;
    }
  };

  const handleConfirm = () => {
    const selectedAddons: SelectedAddon[] = Object.entries(selected)
      .filter(([_, quantity]) => quantity > 0)
      .map(([addonId, quantity]) => {
        const addon = addons.find((a) => a.addon_id === addonId);
        if (!addon) return null;

        return {
          addonId,
          name: addon.name || '',
          quantity,
          price: calculateAddonPrice(addon, quantity),
          currency: addon.price?.currency || 'USD',
          priceType: (addon.price?.type as any) || 'per_stay',
        };
      })
      .filter((a): a is SelectedAddon => a !== null);

    onAddonSelect(selectedAddons);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (addons.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Add-ons & Extras</h3>
      {addons.map((addon) => {
        const quantity = selected[addon.addon_id] || 0;
        const totalPrice = calculateAddonPrice(addon, quantity);
        const currency = addon.price?.currency || 'USD';

        return (
          <Card key={addon.addon_id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  {addon.description && (
                    <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                  )}
                </div>
                {addon.price?.amount && (
                  <div className="text-right ml-4">
                    <p className="font-semibold">
                      {formatCurrency(addon.price.amount, currency)}
                      {addon.price.type === 'per_night' && ' / night'}
                      {addon.price.type === 'per_person' && ' / person'}
                      {addon.price.type === 'per_person_per_night' && ' / person / night'}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Input
                  type="number"
                  min="0"
                  value={quantity.toString()}
                  onChange={(e) =>
                    handleQuantityChange(addon.addon_id, parseInt(e.target.value) || 0)
                  }
                  className="w-24"
                  label="Quantity"
                />
                {quantity > 0 && (
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total: {formatCurrency(totalPrice, currency)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Button onClick={handleConfirm} className="w-full" size="lg">
        Confirm Add-ons
      </Button>
    </div>
  );
}

