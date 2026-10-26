import { loadJSON } from '../../services/storage';
import { useApiData } from '../../hooks/useApiData';
import { PLACES, validPlace } from '../weather/weather';

// Facilities near a place: the one passed in (the map), else the place picked
// on the weather card (Johannesburg until one is picked). The API rounds the
// coordinates, so the exact spot never leaves the server.
export function useFacilities(near) {
  const place = near ?? validPlace(loadJSON('weather:place', PLACES[0]));
  const { status, data } = useApiData(`/services/facilities?lat=${place.lat}&lon=${place.lon}`);
  return { place, status, data };
}
