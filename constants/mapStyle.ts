// constants/mapStyle.ts
// Shared MapLibre style using free CARTO Voyager tiles (OSM-based, street-level detail)
// No API key required. Free for all usage.
// Alternative options if needed:
//   - CARTO Dark: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
//   - CARTO Light: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
//   - Stamen Terrain: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png'

export const MAP_STYLE = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO',
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};
