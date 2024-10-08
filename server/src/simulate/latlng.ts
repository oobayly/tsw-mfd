type LatLng = [number, number];

/**
 * Calculate the distance between two lat/lng coordinates using the Haversine formula.
 */
function haversineDistance(coord1: LatLng, coord2: LatLng): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371000; // Radius of the Earth in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Linearly interpolate between two values.
 */
function lerp(start: number, end: number, t: number): number {
  return start + t * (end - start);
}

/**
 * Generate interpolated coordinates given a speed and an array of lat/lng tuples.
 */
function interpolatePositions(speed: number, coords: LatLng[]): LatLng[] {
  const interpolatedCoords: LatLng[] = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];

    const distance = haversineDistance(start, end);
    const numSteps = Math.ceil(distance / speed);

    for (let j = 0; j < numSteps; j++) {
      const t = j / numSteps;
      const lat = lerp(start[0], end[0], t);
      const lng = lerp(start[1], end[1], t);
      interpolatedCoords.push([lat, lng]);
    }
  }

  // Add the final coordinate
  interpolatedCoords.push(coords[coords.length - 1]);

  return interpolatedCoords;
}

export const interpolateKolnAachen = (kmph: number): LatLng[] => {
  const coordinates: LatLng[] = [
    [50.949361005752, 6.9521346351542],
    [50.952051106148, 6.9507184287943],
    [50.953362304672, 6.9498601219096],
    [50.954403126647, 6.9475641509928],
    [50.954845545922, 6.9449229311105],
    [50.954345418357, 6.9392151903268],
    [50.953047764983, 6.9326706003305],
    [50.948170115412, 6.883176530006],
    [50.938956492281, 6.7963182101504],
    [50.936756775838, 6.7798662773704],
    [50.934484999299, 6.766820012722],
    [50.931996735752, 6.7581511131859],
    [50.920256827575, 6.7245913139915],
    [50.904995929981, 6.684508382473],
    [50.876091351097, 6.6093035277371],
    [50.841522480496, 6.5207458776352],
    [50.832958206368, 6.5092445653793],
    [50.81712642394, 6.4912201207993],
    [50.806984756915, 6.4800621312973],
    [50.803459062803, 6.4741398137924],
    [50.80074680936, 6.4662433904526],
    [50.798902387091, 6.4553428930161],
    [50.800095845107, 6.4429832738754],
    [50.816206677672, 6.3607524938257],
    [50.818484227277, 6.3507961339624],
    [50.820978558923, 6.3370632238061],
    [50.82119545103, 6.3317853461347],
    [50.820110980419, 6.3256484519086],
    [50.814552673221, 6.3155204306684],
    [50.810214022566, 6.3060361395917],
    [50.807879424695, 6.2977204929726],
    [50.80679464485, 6.2872491489784],
    [50.807526874008, 6.2743316303627],
    [50.809425192453, 6.263216556205],
    [50.810775062177, 6.2589461618868],
    [50.812646132222, 6.2549550348727],
    [50.813757891967, 6.251049738547],
    [50.813812123473, 6.2456853205172],
    [50.81253766644, 6.2410075479952],
    [50.811181822911, 6.2388617807833],
    [50.809581876926, 6.2373168283907],
    [50.807915743132, 6.2359177620823],
    [50.804254513049, 6.2343728096897],
    [50.802139004887, 6.2329136879856],
    [50.80070148956, 6.2305533440525],
    [50.794869658356, 6.2183224986197],
    [50.793459046961, 6.2135588954093],
    [50.792590957249, 6.2089240382316],
    [50.791397307571, 6.1991822550895],
    [50.786405351376, 6.1610734294059],
    [50.784696647168, 6.1493480588467],
    [50.782580253594, 6.1421382810147],
    [50.777668766096, 6.1283624555142],
    [50.771345484052, 6.1187494184048],
    [50.768577082962, 6.113728323129],
    [50.766622818846, 6.1108959104092],
    [50.765401362317, 6.1075055982144],
    [50.765102779205, 6.1042440320523],
    [50.765645656174, 6.1014545346768],
    [50.767898528284, 6.0928714658292],
  ];

  return interpolatePositions(kmph / 3.6, coordinates);
}
