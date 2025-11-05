# Simplified Ski Trail Visualization - Using Mapbox Native Data

## The Smart Approach ✅

Instead of loading custom GeoJSON files and trying to replicate Mapbox's existing ski trail data, we're now using **Mapbox's built-in ski trail layers** that are already in their Outdoors/Terrain styles.

## What Changed

### Before (Overcomplicated ❌)
- Loading custom GeoJSON files
- Trying to fetch from ArcGIS APIs
- Manually creating trail layers
- Managing complex filter logic
- Storing trail data for proximity calculations
- 500+ lines of complex code

### After (Simple ✅)
- Use Mapbox's existing piste (ski trail) layers
- Just enhance their visibility and styling
- Auto-switches to Terrain map style when trails are shown
- Simple toggle + opacity slider
- ~100 lines of clean code

## How It Works

### 1. **Simple Toggle**
- Button: "Show Ski Trails" / "Ski Trails ON"
- When ON: Automatically switches to Terrain map style (best for ski trails)
- When OFF: Returns to Streets map style

### 2. **Trail Enhancement**
When trails are enabled, the code:
- Finds all `piste` layers in the Mapbox style
- Increases their line width for better visibility (2-6px based on zoom)
- Increases opacity to make them stand out
- Color-codes by difficulty:
  - 🟢 Green: `#22c55e` (easy/novice)
  - 🔵 Blue: `#3b82f6` (intermediate)  
  - ⚫ Black: `#000000` (advanced)
  - 🔴 Red: `#dc2626` (expert/freeride)
- Enhances `aerialway` (lift) layers in amber/orange

### 3. **Opacity Control**
- Slider from 30% to 100%
- Lets users adjust how visible trails are
- Doesn't interfere with hotel markers

## Code Structure

```typescript
// When trails are enabled
if (showSkiTrails) {
  // Find Mapbox's piste layers
  const pisteLayerIds = style.layers
    .filter(layer => layer.id.includes('piste') || layer.id.includes('aerialway'))
  
  // Enhance each layer
  pisteLayerIds.forEach(layerId => {
    map.setPaintProperty(layerId, 'line-width', [2, 6])
    map.setPaintProperty(layerId, 'line-opacity', trailOpacity)
    map.setPaintProperty(layerId, 'line-color', colorByDifficulty)
  })
}
```

## Benefits

### 1. **Accurate Data**
- Mapbox's data is professional-grade and updated regularly
- Covers all ski resorts worldwide, not just Telluride
- Includes actual trail names, difficulties, and classifications

### 2. **Better Performance**
- No external API calls
- No GeoJSON parsing
- Uses data already in the map style
- Instant rendering

### 3. **Maintainability**
- Much simpler code (100 lines vs 500+)
- No custom data files to maintain
- No complex filtering logic
- Easy to understand and modify

### 4. **User Experience**
- Faster load times
- Smoother interactions
- Automatic map style switching
- Clean, minimal UI

## UI Components

### Main Toggle Button
```
┌─────────────────────────┐
│ 📊 Show Ski Trails      │  ← Default state
└─────────────────────────┘

┌─────────────────────────┐
│ 📊 Ski Trails ON        │  ← Active state (green tint)
└─────────────────────────┘
```

### Opacity Slider (when trails ON)
```
┌─────────────────────────┐
│ TRAIL VISIBILITY    80% │
│ ──────●─────────────    │
└─────────────────────────┘
```

## Testing

1. Navigate to the map
2. Click "Show Ski Trails"
3. Watch the map switch to Terrain style
4. See ski trails highlighted in color
5. Adjust opacity slider
6. Click toggle again to hide trails

## What Mapbox Includes

Mapbox's Outdoors/Terrain styles include:
- ✅ Ski pistes (trails) with difficulty ratings
- ✅ Ski lifts (aerialways)
- ✅ Trail names and labels
- ✅ Terrain contours and elevation
- ✅ Mountain features
- ✅ Worldwide coverage

## Removed Features (Not Needed)

- ❌ Custom GeoJSON files
- ❌ ArcGIS API integration
- ❌ Trail detail popups (Mapbox handles this)
- ❌ Complex filtering by difficulty
- ❌ Proximity calculations
- ❌ Map style selector (auto-switches now)

## Files Modified

1. **`src/components/map/LodgingMap.tsx`**
   - Simplified trail enhancement logic
   - Auto map style switching
   - Clean UI with just toggle + opacity

2. **`src/components/map/HotelMapPopup.tsx`**
   - Removed proximity badge (no longer needed)

## Future Enhancements (If Needed)

If you want to add back some features later:
- Add difficulty filter toggles (easy to filter Mapbox's data)
- Add trail status overlay (open/closed)
- Integrate with resort APIs for real-time conditions
- Add 3D terrain view toggle

But for now, this simple approach gives you **professional ski trail visualization with minimal code and maximum reliability**.

## The Bottom Line

**We're letting Mapbox do what Mapbox does best** - provide accurate, worldwide ski trail data. We just make it more visible and user-friendly. This is how it should be done! 🎿

