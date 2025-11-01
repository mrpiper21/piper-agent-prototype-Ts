import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles } from '../../clerk/shared/clerkStyles';

// Create a custom Google Maps-like marker icon
const createGoogleMapsLikeIcon = () => {
  if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }
};

// Initialize icon on mount
if (typeof window !== 'undefined') {
  createGoogleMapsLikeIcon();
}

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

function MapController() {
  const map = useMap();
  useEffect(() => {
    if (map) {
      // Force map to resize and invalidate size to load tiles
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map]);
  return null;
}

function LocationMarker({ 
  position, 
  setPosition, 
  setAddress,
  reverseGeocode,
  setLocationWithLogging,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  setAddress: (addr: string) => void;
  reverseGeocode: (lat: number, lng: number) => Promise<string>;
  setLocationWithLogging: (lat: number, lng: number, addr: string, source: string, accuracy?: number) => void;
}) {
  const map = useMap();
  
  // Center map on marker when position changes
  useEffect(() => {
    if (position && map) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const newPosition: [number, number] = [lat, lng];
      setPosition(newPosition);
      
      // Reverse geocode to get address (optimized)
      reverseGeocode(lat, lng).then((addr: string) => {
        setAddress(addr);
        setLocationWithLogging(lat, lng, addr, 'map_click');
      });
    },
  });

  // Always show marker if position exists
  return position ? <Marker position={position} /> : null;
}

export default function SetupLocationPage() {
  const navigate = useNavigate();
  const { updateUserLocation } = useAuthStore();
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [retryCount, setRetryCount] = useState(0);

  // Helper function to reverse geocode coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PiperAgent/1.0',
          },
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Helper function to log and set location
  const setLocationWithLogging = useCallback((lat: number, lng: number, addr: string, source: string, accuracy?: number) => {
    const location = {
      latitude: lat,
      longitude: lng,
      address: addr,
      source,
      ...(accuracy !== undefined && { accuracy }),
    };
    console.log(`Location selected (${source}):`, location);
    
    setPosition([lat, lng]);
    setAddress(addr);
    setLocationPermission('granted');
  }, []);

  // Function to request user's location with retry logic and fallback strategies
  const requestUserLocation = useCallback(async (isRetry = false) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      const defaultCoords: [number, number] = [5.6037, -0.1870];
      setPosition(defaultCoords);
      setAddress('5.6037, -0.1870');
      return;
    }

    if (!isRetry) {
      setIsLoadingLocation(true);
      setError(null);
      setRetryCount(0);
    }

    // Strategy 1: Try with high accuracy first (if not a retry)
    const tryGetLocation = (options: PositionOptions, strategy = 'high_accuracy') => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          setIsLoadingLocation(false);
          
          // Get address asynchronously
          const addr = await reverseGeocode(lat, lng);
          setLocationWithLogging(lat, lng, addr, strategy === 'high_accuracy' ? 'geolocation' : 'geolocation_low', pos.coords.accuracy);
        },
        async (error) => {
          console.error(`Geolocation error (${strategy}):`, error);
          
          // Strategy 2: If high accuracy fails with POSITION_UNAVAILABLE, try with lower accuracy
          if (!isRetry && error.code === error.POSITION_UNAVAILABLE && strategy === 'high_accuracy') {
            console.log('Retrying with lower accuracy settings...');
            setTimeout(() => {
              tryGetLocation({
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 60000, // Accept cached location up to 1 minute old
              }, 'low_accuracy');
            }, 500);
            return;
          }
          
          setIsLoadingLocation(false);
          
          // Don't show error if this was an automatic retry - let user manually select
          if (isRetry || retryCount > 0) {
            setLocationPermission('denied');
            return;
          }
          
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please:\n1. Enable location services in system settings\n2. Grant location permission to this app\n3. Or click on the map to select your location';
              setLocationPermission('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location services unavailable. This may be due to:\n• Location services being disabled\n• GPS not available\n• Network issues\n\nPlease select your location manually on the map.';
              setLocationPermission('denied');
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again or select your location on the map.';
              break;
            default:
              errorMessage = 'Unable to get your location. Please select it manually on the map.';
              break;
          }
          
          setError(errorMessage);
          
          // Set default location only if no position exists
          setPosition((currentPosition) => {
            if (!currentPosition) {
              // Async set default - this will happen after error is shown
              reverseGeocode(5.6037, -0.1870).then((addr) => {
                setPosition([5.6037, -0.1870]);
                setAddress(addr);
              });
            }
            return currentPosition;
          });
        },
        options
      );
    };

    // Start with high accuracy
    tryGetLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, [reverseGeocode, setLocationWithLogging, retryCount]);

  // Initialize map with default location - don't auto-request location on mount
  useEffect(() => {
    const initializeDefaultLocation = async () => {
      if (!position) {
        const defaultCoords: [number, number] = [5.6037, -0.1870];
        const defaultAddr = await reverseGeocode(defaultCoords[0], defaultCoords[1]);
        setPosition(defaultCoords);
        setAddress(defaultAddr);
      }
    };

    initializeDefaultLocation();
  }, []); // Only run once on mount

  const handleSave = async () => {
    if (!position) {
      setError('Please select a location on the map');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const location: Location = {
        latitude: position[0],
        longitude: position[1],
        address: address || `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`,
      };

      // Log location object before saving
      console.log('Saving location:', location);

      // Update user location via API (this will call the IPC handler which calls the API service)
      // This will also authenticate the user and save to local database
      await updateUserLocation(location);
      
      console.log('Location saved successfully, user authenticated');
      
      // User is now authenticated, navigate to dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Failed to save location:', err);
      setError(err?.message || 'Failed to save location. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: themeStyles.container.background,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: themeStyles.card.background,
        borderBottom: themeStyles.card.border,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <h1 style={{
          color: themeStyles.text,
          fontSize: '24px',
          fontWeight: '700',
          margin: 0,
        }}>
          Set Your Location
        </h1>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          {address && (
            <div style={{
              color: themeStyles.textSecondary,
              fontSize: '14px',
              maxWidth: '400px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              📍 {address}
            </div>
          )}
          {locationPermission !== 'granted' && (
            <button
              onClick={() => requestUserLocation(false)}
              disabled={isLoadingLocation}
              style={{
                padding: '10px 20px',
                background: themeStyles.button?.background || themeStyles.card.background,
                color: themeStyles.text,
                border: themeStyles.card.border,
                borderRadius: '8px',
                fontWeight: '600',
                cursor: isLoadingLocation ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isLoadingLocation ? 0.6 : 1,
                transition: 'opacity 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isLoadingLocation ? '⏳ Getting Location...' : '📍 Use My Location'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!position || isSaving}
            style={{
              padding: '10px 24px',
              background: themeStyles.primaryButton.background,
              color: themeStyles.primaryButton.color,
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: (!position || isSaving) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: (!position || isSaving) ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Location'}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0, // Important for flex children
        width: '100%',
      }}>
        {position ? (
          <MapContainer
            key={`${position[0]}-${position[1]}`}
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={true}
          >
            {/* Colorful map style with buildings and details like Google Maps - OpenStreetMap has vibrant colors */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c']}
              maxZoom={19}
              noWrap={false}
              errorTileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect fill='%23f0f0f0' width='256' height='256'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ETile Error%3C/text%3E%3C/svg%3E"
            />
            <MapController />
            <LocationMarker
              position={position}
              setPosition={setPosition}
              setAddress={setAddress}
              reverseGeocode={reverseGeocode}
              setLocationWithLogging={setLocationWithLogging}
            />
          </MapContainer>
        ) : (
          <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeStyles.textSecondary,
          }}>
            Loading map...
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        padding: '16px 20px',
        background: themeStyles.card.background,
        borderTop: themeStyles.card.border,
        color: themeStyles.textSecondary,
        fontSize: '14px',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span>
          {locationPermission === 'granted' 
            ? '✅ Location access granted. Click on the map to adjust your location if needed.'
            : locationPermission === 'denied'
            ? '⚠️ Location access denied. Please click on the map to select your location, or click "Use My Location" to try again.'
            : 'Click on the map to select your location, or click "Use My Location" to use your current position.'}
        </span>
      </div>

      {error && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px',
          background: themeStyles.error,
          color: '#ffffff',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '500px',
          whiteSpace: 'pre-line',
          textAlign: 'left',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

