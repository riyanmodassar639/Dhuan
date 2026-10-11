// Punjab MassTransit Authority (PMA) Lahore Data & Route Solver

export interface TransitStop {
  name: string;
  lat: number;
  lng: number;
}

export interface TransitLine {
  id: string;
  name: string;
  type: 'metro' | 'orange_line' | 'speedo' | 'green_bus';
  color: string; // Hex color
  bgClass: string;
  textClass: string;
  borderClass: string;
  badge: string;
  fare: number; // in PKR
  intervalMin: number; // departure every X mins
  stops: TransitStop[];
}

// 1. Orange Line Metro Train (OLMT) - Color: Orange (#ea580c)
export const ORANGE_LINE: TransitLine = {
  id: 'olmt',
  name: 'Orange Line Metro Train',
  type: 'orange_line',
  color: '#ea580c',
  bgClass: 'bg-orange-500',
  textClass: 'text-orange-600',
  borderClass: 'border-orange-500',
  badge: 'Orange Line (OLMT)',
  fare: 40,
  intervalMin: 4,
  stops: [
    { name: 'Ali Town', lat: 31.4721, lng: 74.2415 },
    { name: 'Thokar Niaz Baig', lat: 31.4704, lng: 74.2483 },
    { name: 'Canal View', lat: 31.4795, lng: 74.2625 },
    { name: 'Hanjarwal', lat: 31.4883, lng: 74.2741 },
    { name: 'Wahdat Road', lat: 31.4988, lng: 74.2833 },
    { name: 'Awan Town', lat: 31.5034, lng: 74.2882 },
    { name: 'Sabzazar', lat: 31.5098, lng: 74.2934 },
    { name: 'Shahnoor', lat: 31.5165, lng: 74.2989 },
    { name: 'Bund Road', lat: 31.5232, lng: 74.3032 },
    { name: 'Samanabad', lat: 31.5295, lng: 74.3072 },
    { name: 'Gulshan-e-Ravi', lat: 31.5361, lng: 74.3094 },
    { name: 'Chauburji', lat: 31.5435, lng: 74.3087 },
    { name: 'Anarkali (Interchange)', lat: 31.5592, lng: 74.3148 },
    { name: 'Central / GPO', lat: 31.5645, lng: 74.3211 },
    { name: 'Shimla Pahari', lat: 31.5672, lng: 74.3298 },
    { name: 'Lahore Railway Station', lat: 31.5741, lng: 74.3382 },
    { name: 'Sultanpura', lat: 31.5792, lng: 74.3489 },
    { name: 'UET Lahore', lat: 31.5834, lng: 74.3592 },
    { name: 'Baghbanpura', lat: 31.5867, lng: 74.3712 },
    { name: 'Shalamar Gardens', lat: 31.5889, lng: 74.3821 },
    { name: 'Pakistan Mint', lat: 31.5912, lng: 74.3945 },
    { name: 'Mahmood Booti', lat: 31.5956, lng: 74.4098 },
    { name: 'Salamatpura', lat: 31.6001, lng: 74.4215 },
    { name: 'Dera Gujran', lat: 31.6048, lng: 74.4352 }
  ]
};

// 2. Metrobus Lahore (MBS) - Color: Yellow (#eab308)
export const METROBUS_LINE: TransitLine = {
  id: 'mbs',
  name: 'Metrobus Lahore (MBS)',
  type: 'metro',
  color: '#eab308',
  bgClass: 'bg-amber-400',
  textClass: 'text-amber-700',
  borderClass: 'border-amber-400',
  badge: 'Metrobus (Green Line)',
  fare: 30,
  intervalMin: 3,
  stops: [
    { name: 'Shahdara Terminal', lat: 31.6212, lng: 74.2821 },
    { name: 'Niazi Chowk', lat: 31.6021, lng: 74.2982 },
    { name: 'Azadi Chowk', lat: 31.5912, lng: 74.3065 },
    { name: 'Bhati Chowk', lat: 31.5842, lng: 74.3102 },
    { name: 'Civil Secretariat', lat: 31.5698, lng: 74.3121 },
    { name: 'MAO College (Interchange)', lat: 31.5598, lng: 74.3138 },
    { name: 'Janazgah', lat: 31.5542, lng: 74.3168 },
    { name: 'Qartaba Chowk', lat: 31.5452, lng: 74.3204 },
    { name: 'Shama', lat: 31.5362, lng: 74.3242 },
    { name: 'Ichhra', lat: 31.5251, lng: 74.3289 },
    { name: 'Canal Station', lat: 31.5142, lng: 74.3341 },
    { name: 'Gaddafi Stadium', lat: 31.5062, lng: 74.3375 },
    { name: 'Kalma Chowk', lat: 31.4998, lng: 74.3412 },
    { name: 'Model Town', lat: 31.4889, lng: 74.3468 },
    { name: 'Naseerabad', lat: 31.4782, lng: 74.3521 },
    { name: 'Chungi Amar Sidhu', lat: 31.4641, lng: 74.3598 },
    { name: 'Kamahan', lat: 31.4498, lng: 74.3672 },
    { name: 'Youhanabad', lat: 31.4382, lng: 74.3721 },
    { name: 'Gajjumata Terminal', lat: 31.4215, lng: 74.3812 }
  ]
};

// 3. Speedo Bus Feeder Network - Color: Red (#ef4444)
export const SPEEDO_LINES: TransitLine[] = [
  {
    id: 'speedo_fr1',
    name: 'Speedo Feeder Bus FR-1',
    type: 'speedo',
    color: '#ef4444',
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-500',
    badge: 'Speedo FR-1',
    fare: 25,
    intervalMin: 6,
    stops: [
      { name: 'Railway Station', lat: 31.5741, lng: 74.3382 },
      { name: 'Shimla Pahari', lat: 31.5672, lng: 74.3298 },
      { name: 'Davis Road', lat: 31.5582, lng: 74.3412 },
      { name: 'Dharampura', lat: 31.5512, lng: 74.3645 },
      { name: 'Mughalpura', lat: 31.5592, lng: 74.3821 },
      { name: 'Harbanspura', lat: 31.5642, lng: 74.4121 },
      { name: 'Bhatta Chowk (DHA)', lat: 31.5124, lng: 74.4321 }
    ]
  },
  {
    id: 'speedo_fr3',
    name: 'Speedo Feeder Bus FR-3',
    type: 'speedo',
    color: '#ef4444',
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-500',
    badge: 'Speedo FR-3',
    fare: 25,
    intervalMin: 5,
    stops: [
      { name: 'Kalma Chowk', lat: 31.4998, lng: 74.3412 },
      { name: 'Barkat Market', lat: 31.5034, lng: 74.3289 },
      { name: 'Campus Bridge', lat: 31.5012, lng: 74.3162 },
      { name: 'Faisal Town', lat: 31.4872, lng: 74.3045 },
      { name: 'Township Market', lat: 31.4642, lng: 74.3012 },
      { name: 'Bagrian Chowk', lat: 31.4489, lng: 74.2982 }
    ]
  },
  {
    id: 'speedo_fr10',
    name: 'Speedo Feeder Bus FR-10',
    type: 'speedo',
    color: '#ef4444',
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-500',
    badge: 'Speedo FR-10',
    fare: 25,
    intervalMin: 7,
    stops: [
      { name: 'Allama Iqbal Town (Moon Market)', lat: 31.5123, lng: 74.2812 },
      { name: 'Wahdat Colony', lat: 31.5192, lng: 74.3012 },
      { name: 'Chauburji (OLMT)', lat: 31.5435, lng: 74.3087 },
      { name: 'MAO College (Metro)', lat: 31.5598, lng: 74.3138 },
      { name: 'Bhati Gate', lat: 31.5842, lng: 74.3102 }
    ]
  }
];

// 4. Green Electric Bus Network - Color: Green (#16a34a)
export const GREEN_BUS_LINES: TransitLine[] = [
  {
    id: 'green_e1',
    name: 'Green Electric Bus E-1',
    type: 'green_bus',
    color: '#16a34a',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-500',
    badge: 'Green Bus E-1',
    fare: 30,
    intervalMin: 8,
    stops: [
      { name: 'Lahore Railway Station', lat: 31.5741, lng: 74.3382 },
      { name: 'Gaddafi Stadium / Liberty', lat: 31.5098, lng: 74.3489 },
      { name: 'Firdous Market', lat: 31.5042, lng: 74.3592 },
      { name: 'Cavalry Ground', lat: 31.4982, lng: 74.3721 },
      { name: 'DHA Phase 1 (Main Blvd)', lat: 31.4892, lng: 74.3892 },
      { name: 'Allama Iqbal Airport Terminal', lat: 31.5216, lng: 74.4036 }
    ]
  },
  {
    id: 'green_e2',
    name: 'Green Electric Bus E-2',
    type: 'green_bus',
    color: '#16a34a',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-500',
    badge: 'Green Bus E-2',
    fare: 30,
    intervalMin: 10,
    stops: [
      { name: 'Thokar Niaz Baig', lat: 31.4704, lng: 74.2483 },
      { name: 'Johar Town (Emporium)', lat: 31.4682, lng: 74.2692 },
      { name: 'Shaukat Khanum', lat: 31.4651, lng: 74.2812 },
      { name: 'Green Town Commercial', lat: 31.4421, lng: 74.3121 },
      { name: 'General Hospital', lat: 31.4589, lng: 74.3512 }
    ]
  }
];

// Helper: Haversine distance in meters
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest stop on a line to given coordinates
function findClosestStop(lat: number, lng: number, line: TransitLine) {
  let closest = line.stops[0];
  let minDist = Infinity;
  let idx = 0;
  line.stops.forEach((stop, i) => {
    const d = haversineMeters(lat, lng, stop.lat, stop.lng);
    if (d < minDist) {
      minDist = d;
      closest = stop;
      idx = i;
    }
  });
  return { stop: closest, distance: minDist, index: idx };
}

export interface TransitStep {
  mode: 'walk' | 'transit';
  vehicleType?: 'metro' | 'orange_line' | 'speedo' | 'green_bus';
  lineName?: string;
  badge?: string;
  color?: string;
  fromName: string;
  toName: string;
  distanceMeters: number;
  durationMin: number;
  stopCount?: number;
  stops?: TransitStop[];
  instructions: string;
}

export interface TransitRouteResult {
  id: string;
  title: string;
  totalDurationMin: number;
  totalDistanceMeters: number;
  totalFarePkr: number;
  linesUsed: TransitLine[];
  steps: TransitStep[];
  geometryCoordinates: [number, number][]; // [lng, lat] for Leaflet
  segments: {
    color: string;
    coordinates: [number, number][]; // [lat, lng] for Polyline
    isDashed?: boolean;
    vehicleType: string;
    lineName: string;
  }[];
  stationsToMark: {
    name: string;
    lat: number;
    lng: number;
    badge: string;
    color: string;
  }[];
}

// Generate realistic PMA transit route options between origin and destination
export function solvePmaTransitRoutes(
  origin: [number, number], // [lat, lng]
  dest: [number, number]    // [lat, lng]
): TransitRouteResult[] {
  const allLines: TransitLine[] = [
    ORANGE_LINE,
    METROBUS_LINE,
    ...SPEEDO_LINES,
    ...GREEN_BUS_LINES
  ];

  const results: TransitRouteResult[] = [];

  // Candidate lines ordered by best proximity
  const scoredLines = allLines.map((line) => {
    const startMatch = findClosestStop(origin[0], origin[1], line);
    const endMatch = findClosestStop(dest[0], dest[1], line);
    const totalWalk = startMatch.distance + endMatch.distance;
    return {
      line,
      startMatch,
      endMatch,
      totalWalk
    };
  }).sort((a, b) => a.totalWalk - b.totalWalk);

  // Take the top 3 best matching single or combined transit options
  scoredLines.slice(0, 3).forEach((candidate, idx) => {
    const { line, startMatch, endMatch } = candidate;

    const fromIdx = Math.min(startMatch.index, endMatch.index);
    const toIdx = Math.max(startMatch.index, endMatch.index);
    const lineStopsSlice = line.stops.slice(fromIdx, toIdx + 1);
    if (startMatch.index > endMatch.index) {
      lineStopsSlice.reverse();
    }

    const transitRideDistance = lineStopsSlice.reduce((acc, stop, i) => {
      if (i === 0) return acc;
      return acc + haversineMeters(lineStopsSlice[i - 1].lat, lineStopsSlice[i - 1].lng, stop.lat, stop.lng);
    }, 0);

    const walk1Dist = Math.round(startMatch.distance);
    const walk1Min = Math.max(2, Math.round(walk1Dist / 80)); // 80m per min (~4.8 km/h)
    
    const transitRideMin = Math.max(4, Math.round(transitRideDistance / 450) + lineStopsSlice.length * 1);
    
    const walk2Dist = Math.round(endMatch.distance);
    const walk2Min = Math.max(2, Math.round(walk2Dist / 80));

    const totalDuration = walk1Min + line.intervalMin + transitRideMin + walk2Min;
    const totalDistance = walk1Dist + transitRideDistance + walk2Dist;

    // Build segments for Leaflet rendering
    const walk1Coords: [number, number][] = [
      [origin[0], origin[1]],
      [startMatch.stop.lat, startMatch.stop.lng]
    ];

    const transitCoords: [number, number][] = lineStopsSlice.map(s => [s.lat, s.lng]);

    const walk2Coords: [number, number][] = [
      [endMatch.stop.lat, endMatch.stop.lng],
      [dest[0], dest[1]]
    ];

    const fullGeoJsonLngLat: [number, number][] = [
      [origin[1], origin[0]],
      ...lineStopsSlice.map(s => [s.lng, s.lat] as [number, number]),
      [dest[1], dest[0]]
    ];

    const steps: TransitStep[] = [
      {
        mode: 'walk',
        fromName: 'Your Location',
        toName: startMatch.stop.name,
        distanceMeters: walk1Dist,
        durationMin: walk1Min,
        instructions: `Walk ${walk1Dist > 1000 ? (walk1Dist / 1000).toFixed(1) + ' km' : walk1Dist + ' m'} to ${startMatch.stop.name} station`
      },
      {
        mode: 'transit',
        vehicleType: line.type,
        lineName: line.name,
        badge: line.badge,
        color: line.color,
        fromName: startMatch.stop.name,
        toName: endMatch.stop.name,
        distanceMeters: Math.round(transitRideDistance),
        durationMin: transitRideMin,
        stopCount: lineStopsSlice.length,
        stops: lineStopsSlice,
        instructions: `Board ${line.badge} towards ${lineStopsSlice[lineStopsSlice.length - 1].name} (${lineStopsSlice.length} stops)`
      },
      {
        mode: 'walk',
        fromName: endMatch.stop.name,
        toName: 'Destination',
        distanceMeters: walk2Dist,
        durationMin: walk2Min,
        instructions: `Walk ${walk2Dist > 1000 ? (walk2Dist / 1000).toFixed(1) + ' km' : walk2Dist + ' m'} to destination`
      }
    ];

    results.push({
      id: `transit_${line.id}_${idx}`,
      title: `${line.badge}`,
      totalDurationMin: totalDuration,
      totalDistanceMeters: totalDistance,
      totalFarePkr: line.fare,
      linesUsed: [line],
      steps,
      geometryCoordinates: fullGeoJsonLngLat,
      segments: [
        {
          color: '#64748b',
          coordinates: walk1Coords,
          isDashed: true,
          vehicleType: 'walk',
          lineName: 'Walk'
        },
        {
          color: line.color,
          coordinates: transitCoords,
          isDashed: false,
          vehicleType: line.type,
          lineName: line.name
        },
        {
          color: '#64748b',
          coordinates: walk2Coords,
          isDashed: true,
          vehicleType: 'walk',
          lineName: 'Walk'
        }
      ],
      stationsToMark: [
        {
          name: startMatch.stop.name,
          lat: startMatch.stop.lat,
          lng: startMatch.stop.lng,
          badge: line.badge,
          color: line.color
        },
        {
          name: endMatch.stop.name,
          lat: endMatch.stop.lat,
          lng: endMatch.stop.lng,
          badge: line.badge,
          color: line.color
        }
      ]
    });
  });

  return results;
}
