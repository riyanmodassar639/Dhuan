// Punjab MassTransit Authority (PMA) Lahore Integrated Transit Network & Route Solver

export interface TransitStop {
  name: string;
  lat: number;
  lng: number;
  isInterchange?: boolean;
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
    { name: 'Thokar Niaz Baig', lat: 31.4704, lng: 74.2483, isInterchange: true },
    { name: 'Canal View', lat: 31.4795, lng: 74.2625 },
    { name: 'Hanjarwal', lat: 31.4883, lng: 74.2741 },
    { name: 'Wahdat Road', lat: 31.4988, lng: 74.2833 },
    { name: 'Awan Town', lat: 31.5034, lng: 74.2882 },
    { name: 'Sabzazar', lat: 31.5098, lng: 74.2934 },
    { name: 'Shahnoor', lat: 31.5165, lng: 74.2989 },
    { name: 'Bund Road', lat: 31.5232, lng: 74.3032 },
    { name: 'Samanabad', lat: 31.5295, lng: 74.3072 },
    { name: 'Gulshan-e-Ravi', lat: 31.5361, lng: 74.3094 },
    { name: 'Chauburji', lat: 31.5435, lng: 74.3087, isInterchange: true },
    { name: 'Anarkali (OLMT Interchange)', lat: 31.5592, lng: 74.3148, isInterchange: true },
    { name: 'Central / GPO', lat: 31.5645, lng: 74.3211 },
    { name: 'Shimla Pahari', lat: 31.5672, lng: 74.3298 },
    { name: 'Lahore Railway Station', lat: 31.5741, lng: 74.3382, isInterchange: true },
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

// 2. Metrobus Lahore (MBS) - All 27 Official Stations (Shahdara Terminal to Gajjumatta Terminal)
export const METROBUS_LINE: TransitLine = {
  id: 'mbs',
  name: 'Metrobus Lahore (Green Line)',
  type: 'metro',
  color: '#16a34a', // Official PMA Green Line color
  bgClass: 'bg-emerald-600',
  textClass: 'text-emerald-700',
  borderClass: 'border-emerald-600',
  badge: 'Metrobus (Green Line)',
  fare: 30,
  intervalMin: 3,
  stops: [
    { name: 'Shahdara Terminal', lat: 31.6212, lng: 74.2821, isInterchange: true },
    { name: 'Niazi Chowk', lat: 31.6021, lng: 74.2982 },
    { name: 'Timber Market', lat: 31.5968, lng: 74.3025 },
    { name: 'Azadi Chowk', lat: 31.5912, lng: 74.3065, isInterchange: true },
    { name: 'Bhatti Chowk', lat: 31.5842, lng: 74.3102, isInterchange: true },
    { name: 'Katchery', lat: 31.5762, lng: 74.3114 },
    { name: 'Civil Secretariat', lat: 31.5698, lng: 74.3121, isInterchange: true },
    { name: 'MAO College (OLMT Interchange)', lat: 31.5598, lng: 74.3138, isInterchange: true },
    { name: 'Janazgah', lat: 31.5542, lng: 74.3168 },
    { name: 'Qartaba Chowk', lat: 31.5452, lng: 74.3204, isInterchange: true },
    { name: 'Shama', lat: 31.5362, lng: 74.3242 },
    { name: 'Ichhra', lat: 31.5251, lng: 74.3289 },
    { name: 'Canal Station', lat: 31.5142, lng: 74.3341, isInterchange: true },
    { name: 'Gaddafi Stadium', lat: 31.5062, lng: 74.3375 },
    { name: 'Kalma Chowk', lat: 31.4998, lng: 74.3412, isInterchange: true },
    { name: 'Model Town', lat: 31.4889, lng: 74.3468 },
    { name: 'Naseerabad', lat: 31.4782, lng: 74.3521 },
    { name: 'Ittefaq Hospital (Arfa Software Park)', lat: 31.4735, lng: 74.3548 },
    { name: 'Qainchi', lat: 31.4682, lng: 74.3575 },
    { name: 'Ghazi Chowk', lat: 31.4642, lng: 74.3592 },
    { name: 'Chungi Amar Sidhu', lat: 31.4598, lng: 74.3621, isInterchange: true },
    { name: 'Kamahan', lat: 31.4498, lng: 74.3672 },
    { name: 'Atari Saroba', lat: 31.4435, lng: 74.3698 },
    { name: 'Nishtar Colony', lat: 31.4382, lng: 74.3721 },
    { name: 'Youhanabad', lat: 31.4312, lng: 74.3752 },
    { name: 'Dullo Khurd', lat: 31.4265, lng: 74.3780 },
    { name: 'Gajjumatta Terminal', lat: 31.4215, lng: 74.3812, isInterchange: true }
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
      { name: 'Railway Station', lat: 31.5741, lng: 74.3382, isInterchange: true },
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
      { name: 'Kalma Chowk (Metrobus Interchange)', lat: 31.4998, lng: 74.3412, isInterchange: true },
      { name: 'Barkat Market', lat: 31.5034, lng: 74.3289 },
      { name: 'Campus Bridge', lat: 31.5012, lng: 74.3162 },
      { name: 'Faisal Town', lat: 31.4872, lng: 74.3045 },
      { name: 'Township Market', lat: 31.4642, lng: 74.3012 },
      { name: 'Bagrian Chowk', lat: 31.4489, lng: 74.2982 }
    ]
  },
  {
    id: 'speedo_fr4',
    name: 'Speedo Feeder Bus FR-4',
    type: 'speedo',
    color: '#ef4444',
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-500',
    badge: 'Speedo FR-4',
    fare: 25,
    intervalMin: 6,
    stops: [
      { name: 'R.A. Bazar (Cantt)', lat: 31.5182, lng: 74.3782 },
      { name: 'Defence Chowk', lat: 31.4952, lng: 74.3765 },
      { name: 'Walton Railway Station', lat: 31.4821, lng: 74.3698 },
      { name: 'Ghazi Road', lat: 31.4712, lng: 74.3654 },
      { name: 'Chungi Amar Sidhu (Metrobus Interchange)', lat: 31.4598, lng: 74.3621, isInterchange: true }
    ]
  },
  {
    id: 'speedo_fr8_16',
    name: 'Speedo Feeder Bus FR-16 (Canal / Thokar)',
    type: 'speedo',
    color: '#ef4444',
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-500',
    badge: 'Speedo FR-16',
    fare: 25,
    intervalMin: 5,
    stops: [
      { name: 'Canal Station (Metrobus Interchange)', lat: 31.5142, lng: 74.3341, isInterchange: true },
      { name: 'Muslim Town (Canal)', lat: 31.5112, lng: 74.3256 },
      { name: 'Punjab University New Campus', lat: 31.5034, lng: 74.3056 },
      { name: 'Doctors Hospital', lat: 31.4812, lng: 74.2754 },
      { name: 'Thokar Niaz Baig / Daewoo Terminal', lat: 31.4704, lng: 74.2483, isInterchange: true }
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
      { name: 'Chauburji (OLMT Interchange)', lat: 31.5435, lng: 74.3087, isInterchange: true },
      { name: 'MAO College (Metrobus Interchange)', lat: 31.5598, lng: 74.3138, isInterchange: true },
      { name: 'Bhatti Chowk (Metrobus Interchange)', lat: 31.5842, lng: 74.3102, isInterchange: true }
    ]
  },
  {
    id: 'speedo_fr17',
    name: 'Speedo Feeder Bus FR-17 (Gajjumatta to PKLI)',
    type: 'speedo',
    color: '#ef4444',
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-500',
    badge: 'Speedo FR-17',
    fare: 25,
    intervalMin: 7,
    stops: [
      { name: 'Gajjumatta Terminal (Metrobus Interchange)', lat: 31.4215, lng: 74.3812, isInterchange: true },
      { name: 'Nishat Mills', lat: 31.4235, lng: 74.3982 },
      { name: 'Rohi Nala / Deo Pind', lat: 31.4282, lng: 74.4156 },
      { name: 'Elite Police Training School / Bedian Road', lat: 31.4412, lng: 74.4321 },
      { name: 'PKLI (Pakistan Kidney and Liver Institute)', lat: 31.4568, lng: 74.4498 }
    ]
  }
];

// 4. Green Electric Bus Network - Color: Teal (#0d9488)
export const GREEN_BUS_LINES: TransitLine[] = [
  {
    id: 'green_e1',
    name: 'Green Electric Bus E-1',
    type: 'green_bus',
    color: '#0d9488',
    bgClass: 'bg-teal-500',
    textClass: 'text-teal-600',
    borderClass: 'border-teal-500',
    badge: 'Green Bus E-1',
    fare: 30,
    intervalMin: 8,
    stops: [
      { name: 'Lahore Railway Station', lat: 31.5741, lng: 74.3382, isInterchange: true },
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
    color: '#0d9488',
    bgClass: 'bg-teal-500',
    textClass: 'text-teal-600',
    borderClass: 'border-teal-500',
    badge: 'Green Bus E-2',
    fare: 30,
    intervalMin: 10,
    stops: [
      { name: 'Thokar Niaz Baig', lat: 31.4704, lng: 74.2483, isInterchange: true },
      { name: 'Johar Town (Emporium)', lat: 31.4682, lng: 74.2692 },
      { name: 'Shaukat Khanum Hospital', lat: 31.4651, lng: 74.2812 },
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
    METROBUS_LINE,
    ORANGE_LINE,
    ...SPEEDO_LINES,
    ...GREEN_BUS_LINES
  ];

  const results: TransitRouteResult[] = [];

  // 1. Single Line Direct Candidates
  const directCandidates: {
    line: TransitLine;
    startMatch: ReturnType<typeof findClosestStop>;
    endMatch: ReturnType<typeof findClosestStop>;
    totalWalk: number;
  }[] = [];

  allLines.forEach((line) => {
    const startMatch = findClosestStop(origin[0], origin[1], line);
    const endMatch = findClosestStop(dest[0], dest[1], line);
    // Ignore if boarding and alighting map to the exact same stop
    if (startMatch.index === endMatch.index) return;

    const totalWalk = startMatch.distance + endMatch.distance;
    directCandidates.push({
      line,
      startMatch,
      endMatch,
      totalWalk
    });
  });

  // Sort single direct lines by minimal walk distance
  directCandidates.sort((a, b) => a.totalWalk - b.totalWalk);

  // Take the top 3 best matching single transit options
  directCandidates.slice(0, 3).forEach((candidate, idx) => {
    const { line, startMatch, endMatch } = candidate;

    const fromIdx = Math.min(startMatch.index, endMatch.index);
    const toIdx = Math.max(startMatch.index, endMatch.index);
    let lineStopsSlice = line.stops.slice(fromIdx, toIdx + 1);
    if (startMatch.index > endMatch.index) {
      lineStopsSlice = [...lineStopsSlice].reverse();
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
    const totalDistance = walk1Dist + Math.round(transitRideDistance) + walk2Dist;

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

    // Mark all stations along this route on the map
    const stationsToMark = lineStopsSlice.map((stop, sIdx) => {
      let roleLabel = `${line.badge} Stop ${sIdx + 1} of ${lineStopsSlice.length}`;
      if (sIdx === 0) roleLabel = `${line.badge} (Boarding Station)`;
      if (sIdx === lineStopsSlice.length - 1) roleLabel = `${line.badge} (Alighting Station)`;
      return {
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        badge: roleLabel,
        color: line.color
      };
    });

    results.push({
      id: `transit_direct_${line.id}_${idx}`,
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
      stationsToMark
    });
  });

  // 2. Multimodal Transfer Option: Metrobus <-> Orange Line / Feeder Networks
  // Known key PMA Multimodal transfer points
  const keyTransfers = [
    {
      name: 'MAO College / Anarkali Interchange',
      line1: METROBUS_LINE,
      stop1Name: 'MAO College (OLMT Interchange)',
      line2: ORANGE_LINE,
      stop2Name: 'Anarkali (OLMT Interchange)'
    },
    {
      name: 'Canal Station Interchange',
      line1: METROBUS_LINE,
      stop1Name: 'Canal Station',
      line2: SPEEDO_LINES.find(l => l.id === 'speedo_fr8_16') || SPEEDO_LINES[0],
      stop2Name: 'Canal Station (Metrobus Interchange)'
    },
    {
      name: 'Kalma Chowk Interchange',
      line1: METROBUS_LINE,
      stop1Name: 'Kalma Chowk',
      line2: SPEEDO_LINES.find(l => l.id === 'speedo_fr3') || SPEEDO_LINES[0],
      stop2Name: 'Kalma Chowk (Metrobus Interchange)'
    },
    {
      name: 'Chungi Amar Sidhu Interchange',
      line1: METROBUS_LINE,
      stop1Name: 'Chungi Amar Sidhu',
      line2: SPEEDO_LINES.find(l => l.id === 'speedo_fr4') || SPEEDO_LINES[0],
      stop2Name: 'Chungi Amar Sidhu (Metrobus Interchange)'
    },
    {
      name: 'Gajjumatta PKLI Interchange',
      line1: METROBUS_LINE,
      stop1Name: 'Gajjumatta Terminal',
      line2: SPEEDO_LINES.find(l => l.id === 'speedo_fr17') || SPEEDO_LINES[0],
      stop2Name: 'Gajjumatta Terminal (Metrobus Interchange)'
    }
  ];

  for (const xfer of keyTransfers) {
    // Check direction: Line1 -> Line2
    const checkPair = (lA: TransitLine, stopAName: string, lB: TransitLine, stopBName: string) => {
      const startMatch = findClosestStop(origin[0], origin[1], lA);
      const xferStopAIdx = lA.stops.findIndex(s => s.name === stopAName);
      const xferStopBIdx = lB.stops.findIndex(s => s.name === stopBName);
      const endMatch = findClosestStop(dest[0], dest[1], lB);

      if (xferStopAIdx === -1 || xferStopBIdx === -1) return;
      if (startMatch.index === xferStopAIdx || endMatch.index === xferStopBIdx) return;

      const walkStart = Math.round(startMatch.distance);
      const walkEnd = Math.round(endMatch.distance);

      // Only consider if walk distances are within reasonable transit catchment (< 3.5 km)
      if (walkStart > 3500 || walkEnd > 3500) return;

      // Leg 1 slice
      const fromA = Math.min(startMatch.index, xferStopAIdx);
      const toA = Math.max(startMatch.index, xferStopAIdx);
      let sliceA = lA.stops.slice(fromA, toA + 1);
      if (startMatch.index > xferStopAIdx) sliceA = [...sliceA].reverse();

      // Leg 2 slice
      const fromB = Math.min(xferStopBIdx, endMatch.index);
      const toB = Math.max(xferStopBIdx, endMatch.index);
      let sliceB = lB.stops.slice(fromB, toB + 1);
      if (xferStopBIdx > endMatch.index) sliceB = [...sliceB].reverse();

      const distLegA = sliceA.reduce((acc, s, i) => i === 0 ? acc : acc + haversineMeters(sliceA[i - 1].lat, sliceA[i - 1].lng, s.lat, s.lng), 0);
      const distLegB = sliceB.reduce((acc, s, i) => i === 0 ? acc : acc + haversineMeters(sliceB[i - 1].lat, sliceB[i - 1].lng, s.lat, s.lng), 0);

      const walk1Min = Math.max(2, Math.round(walkStart / 80));
      const rideAMin = Math.max(4, Math.round(distLegA / 450) + sliceA.length);
      const xferWalkMin = 3; // Platform change
      const rideBMin = Math.max(4, Math.round(distLegB / 450) + sliceB.length);
      const walk2Min = Math.max(2, Math.round(walkEnd / 80));

      const totalDur = walk1Min + lA.intervalMin + rideAMin + xferWalkMin + lB.intervalMin + rideBMin + walk2Min;
      const totalDist = walkStart + Math.round(distLegA) + 150 + Math.round(distLegB) + walkEnd;

      const xferSteps: TransitStep[] = [
        {
          mode: 'walk',
          fromName: 'Your Location',
          toName: startMatch.stop.name,
          distanceMeters: walkStart,
          durationMin: walk1Min,
          instructions: `Walk ${walkStart > 1000 ? (walkStart / 1000).toFixed(1) + ' km' : walkStart + ' m'} to ${startMatch.stop.name}`
        },
        {
          mode: 'transit',
          vehicleType: lA.type,
          lineName: lA.name,
          badge: lA.badge,
          color: lA.color,
          fromName: startMatch.stop.name,
          toName: lA.stops[xferStopAIdx].name,
          distanceMeters: Math.round(distLegA),
          durationMin: rideAMin,
          stopCount: sliceA.length,
          stops: sliceA,
          instructions: `Board ${lA.badge} towards ${lA.stops[xferStopAIdx].name} (${sliceA.length} stops)`
        },
        {
          mode: 'walk',
          fromName: lA.stops[xferStopAIdx].name,
          toName: lB.stops[xferStopBIdx].name,
          distanceMeters: 150,
          durationMin: xferWalkMin,
          instructions: `Transfer at ${xfer.name} to ${lB.badge}`
        },
        {
          mode: 'transit',
          vehicleType: lB.type,
          lineName: lB.name,
          badge: lB.badge,
          color: lB.color,
          fromName: lB.stops[xferStopBIdx].name,
          toName: endMatch.stop.name,
          distanceMeters: Math.round(distLegB),
          durationMin: rideBMin,
          stopCount: sliceB.length,
          stops: sliceB,
          instructions: `Board ${lB.badge} towards ${endMatch.stop.name} (${sliceB.length} stops)`
        },
        {
          mode: 'walk',
          fromName: endMatch.stop.name,
          toName: 'Destination',
          distanceMeters: walkEnd,
          durationMin: walk2Min,
          instructions: `Walk ${walkEnd > 1000 ? (walkEnd / 1000).toFixed(1) + ' km' : walkEnd + ' m'} to destination`
        }
      ];

      const fullGeo: [number, number][] = [
        [origin[1], origin[0]],
        ...sliceA.map(s => [s.lng, s.lat] as [number, number]),
        ...sliceB.map(s => [s.lng, s.lat] as [number, number]),
        [dest[1], dest[0]]
      ];

      const markedStations = [
        ...sliceA.map(s => ({
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          badge: lA.badge,
          color: lA.color
        })),
        ...sliceB.map(s => ({
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          badge: lB.badge,
          color: lB.color
        }))
      ];

      results.push({
        id: `transit_xfer_${lA.id}_${lB.id}`,
        title: `${lA.badge} ⇄ ${lB.badge}`,
        totalDurationMin: totalDur,
        totalDistanceMeters: totalDist,
        totalFarePkr: lA.fare + lB.fare,
        linesUsed: [lA, lB],
        steps: xferSteps,
        geometryCoordinates: fullGeo,
        segments: [
          {
            color: '#64748b',
            coordinates: [[origin[0], origin[1]], [startMatch.stop.lat, startMatch.stop.lng]],
            isDashed: true,
            vehicleType: 'walk',
            lineName: 'Walk'
          },
          {
            color: lA.color,
            coordinates: sliceA.map(s => [s.lat, s.lng]),
            isDashed: false,
            vehicleType: lA.type,
            lineName: lA.name
          },
          {
            color: '#64748b',
            coordinates: [[lA.stops[xferStopAIdx].lat, lA.stops[xferStopAIdx].lng], [lB.stops[xferStopBIdx].lat, lB.stops[xferStopBIdx].lng]],
            isDashed: true,
            vehicleType: 'walk',
            lineName: 'Transfer Walk'
          },
          {
            color: lB.color,
            coordinates: sliceB.map(s => [s.lat, s.lng]),
            isDashed: false,
            vehicleType: lB.type,
            lineName: lB.name
          },
          {
            color: '#64748b',
            coordinates: [[endMatch.stop.lat, endMatch.stop.lng], [dest[0], dest[1]]],
            isDashed: true,
            vehicleType: 'walk',
            lineName: 'Walk'
          }
        ],
        stationsToMark: markedStations
      });
    };

    checkPair(xfer.line1, xfer.stop1Name, xfer.line2, xfer.stop2Name);
    checkPair(xfer.line2, xfer.stop2Name, xfer.line1, xfer.stop1Name);
  }

  // If no routes found, fallback to full Metrobus corridor
  if (results.length === 0) {
    const fullStops = METROBUS_LINE.stops;
    results.push({
      id: 'transit_mbs_fallback',
      title: 'Metrobus (Green Line Corridor)',
      totalDurationMin: 45,
      totalDistanceMeters: 27000,
      totalFarePkr: 30,
      linesUsed: [METROBUS_LINE],
      steps: [
        {
          mode: 'walk',
          fromName: 'Your Location',
          toName: fullStops[0].name,
          distanceMeters: 400,
          durationMin: 5,
          instructions: `Walk to ${fullStops[0].name}`
        },
        {
          mode: 'transit',
          vehicleType: 'metro',
          lineName: METROBUS_LINE.name,
          badge: METROBUS_LINE.badge,
          color: METROBUS_LINE.color,
          fromName: fullStops[0].name,
          toName: fullStops[fullStops.length - 1].name,
          distanceMeters: 27000,
          durationMin: 40,
          stopCount: fullStops.length,
          stops: fullStops,
          instructions: `Board Metrobus (Green Line) from ${fullStops[0].name} to ${fullStops[fullStops.length - 1].name} (27 stations)`
        }
      ],
      geometryCoordinates: fullStops.map(s => [s.lng, s.lat]),
      segments: [
        {
          color: METROBUS_LINE.color,
          coordinates: fullStops.map(s => [s.lat, s.lng]),
          isDashed: false,
          vehicleType: 'metro',
          lineName: METROBUS_LINE.name
        }
      ],
      stationsToMark: fullStops.map((s, idx) => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        badge: `Metrobus Stop ${idx + 1}/27`,
        color: METROBUS_LINE.color
      }))
    });
  }

  // Sort overall results: prioritize direct Metrobus/OLMT with lowest duration
  return results.sort((a, b) => a.totalDurationMin - b.totalDurationMin).slice(0, 4);
}
