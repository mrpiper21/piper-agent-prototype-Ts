import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles } from '../../clerk/shared/clerkStyles';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { businessInfoCache } from '../../../shared/utils/businessInfoCache';

// Create a custom Google Maps-like marker icon
const createGoogleMapsLikeIcon = () => {
  if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
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

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
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
  zoomLevel,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  setAddress: (addr: string) => void;
  reverseGeocode: (lat: number, lng: number) => Promise<string>;
  setLocationWithLogging: (
    lat: number,
    lng: number,
    addr: string,
    source: string,
    accuracy?: number
  ) => void;
  zoomLevel?: number;
}) {
  const map = useMap();

  // Center map on marker when position changes
  useEffect(() => {
    if (position && map) {
      map.setView(position, zoomLevel || map.getZoom());
    }
  }, [position, map, zoomLevel]);

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
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>(
    'prompt'
  );
  const [retryCount, setRetryCount] = useState(0);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Manual coordinate inputs
  const [manualLatitude, setManualLatitude] = useState<string>('');
  const [manualLongitude, setManualLongitude] = useState<string>('');
  const [coordinateError, setCoordinateError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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

  // Helper function to geocode/search locations by name
  const geocodeSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) {
      return [];
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PiperAgent/1.0',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Geocode search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Helper function to log and set location
  const setLocationWithLogging = useCallback(
    (lat: number, lng: number, addr: string, source: string, accuracy?: number) => {
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
    },
    []
  );

  // Function to request user's location with retry logic and fallback strategies
  const requestUserLocation = useCallback(
    async (isRetry = false) => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        const defaultCoords: [number, number] = [5.6037, -0.187];
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
            setLocationWithLogging(
              lat,
              lng,
              addr,
              strategy === 'high_accuracy' ? 'geolocation' : 'geolocation_low',
              pos.coords.accuracy
            );
          },
          async (error) => {
            console.error(`Geolocation error (${strategy}):`, error);

            // Strategy 2: If high accuracy fails with POSITION_UNAVAILABLE, try with lower accuracy
            if (
              !isRetry &&
              error.code === error.POSITION_UNAVAILABLE &&
              strategy === 'high_accuracy'
            ) {
              console.log('Retrying with lower accuracy settings...');
              setTimeout(() => {
                tryGetLocation(
                  {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 60000, // Accept cached location up to 1 minute old
                  },
                  'low_accuracy'
                );
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
                errorMessage =
                  'Location permission denied. Please:\n1. Enable location services in system settings\n2. Grant location permission to this app\n3. Or click on the map to select your location';
                setLocationPermission('denied');
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage =
                  'Location services unavailable. This may be due to:\n• Location services being disabled\n• GPS not available\n• Network issues\n\nPlease select your location manually on the map.';
                setLocationPermission('denied');
                break;
              case error.TIMEOUT:
                errorMessage =
                  'Location request timed out. Please try again or select your location on the map.';
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
                reverseGeocode(5.6037, -0.187).then((addr) => {
                  setPosition([5.6037, -0.187]);
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
    },
    [reverseGeocode, setLocationWithLogging, retryCount]
  );

  // Initialize map with default location - don't auto-request location on mount
  useEffect(() => {
    const initializeDefaultLocation = async () => {
      if (!position) {
        const defaultCoords: [number, number] = [5.6037, -0.187];
        const defaultAddr = await reverseGeocode(defaultCoords[0], defaultCoords[1]);
        setPosition(defaultCoords);
        setAddress(defaultAddr);
        // Initialize manual inputs with default coordinates
        setManualLatitude(defaultCoords[0].toString());
        setManualLongitude(defaultCoords[1].toString());
      }
    };

    initializeDefaultLocation();
  }, []); // Only run once on mount

  // Update manual inputs when position changes (from map click, search, etc.)
  useEffect(() => {
    if (position) {
      setManualLatitude(position[0].toFixed(6));
      setManualLongitude(position[1].toFixed(6));
      setCoordinateError(null);
    }
  }, [position]);

  // Handle search query changes with debouncing
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      geocodeSearch(debouncedSearchQuery).then((results) => {
        setSearchResults(results);
        setShowSearchResults(true);
      });
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchQuery, geocodeSearch]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search result selection
  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const newPosition: [number, number] = [lat, lng];

      setPosition(newPosition);
      setAddress(result.display_name);
      setLocationWithLogging(lat, lng, result.display_name, 'search');
      setMapZoom(15); // Zoom in when selecting from search for better visibility
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
    },
    [setLocationWithLogging]
  );

  // Handle manual coordinate input
  const handleManualCoordinateSubmit = useCallback(async () => {
    setCoordinateError(null);

    // Validate inputs
    const lat = parseFloat(manualLatitude);
    const lng = parseFloat(manualLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      setCoordinateError('Please enter valid numbers for both latitude and longitude');
      return;
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      setCoordinateError('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setCoordinateError('Longitude must be between -180 and 180');
      return;
    }

    try {
      setIsLoadingLocation(true);
      const newPosition: [number, number] = [lat, lng];
      const addr = await reverseGeocode(lat, lng);
      
      setPosition(newPosition);
      setAddress(addr);
      setLocationWithLogging(lat, lng, addr, 'manual_input');
      setMapZoom(15); // Zoom in for better visibility
      setCoordinateError(null);
    } catch (error) {
      console.error('Error setting manual coordinates:', error);
      setCoordinateError('Failed to set location. Please check your coordinates and try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [manualLatitude, manualLongitude, reverseGeocode, setLocationWithLogging]);

  const handleSave = async () => {
    if (!position) {
      setError('Please select a location on the map');
      return;
    }

    if (!user?.id) {
      setError('User not found. Please log in again.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const locationData: Location = {
        latitude: position[0],
        longitude: position[1],
        address: address || `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`,
      };

      // Retrieve cached business info
      const cachedBusinessInfo = businessInfoCache.get();

      // Prepare update data with location and business info
      const updateData: any = {
        location: locationData, // Location as object - will be sent as JSON when no file
      };

      // Add business info from cache if available
      if (cachedBusinessInfo) {
        updateData.businessName = cachedBusinessInfo.businessName;
        updateData.businessPhone = cachedBusinessInfo.businessPhone;
        updateData.websiteUrl = cachedBusinessInfo.websiteUrl;

        // Add working hours if available
        if (cachedBusinessInfo.workingHours && cachedBusinessInfo.workingHours.length > 0) {
          updateData.workingHours = cachedBusinessInfo.workingHours;
        }

        // Use uploaded image URL if available, otherwise use file path
        if (cachedBusinessInfo.businessCoverImageUrl) {
          // Image was already uploaded in BusinessInfoPage, use the URL (no file upload needed)
          updateData.businessCoverImage = cachedBusinessInfo.businessCoverImageUrl;
        } else if (cachedBusinessInfo.businessCoverImagePath) {
          // Image wasn't uploaded yet, upload it now using the file path (will use FormData)
          updateData.businessCoverImage = cachedBusinessInfo.businessCoverImagePath;
        }
      }

      console.log('Saving location and business info:', {
        location: locationData,
        businessInfo: cachedBusinessInfo,
      });

      // Use updateUser endpoint - it will use JSON if no file, FormData if file exists
      // Location will be sent as proper object in both cases
      const updatedUser = await window.electron.users.update(user.id, updateData);

      console.log('Location and business info saved successfully');

      // Update auth store with new user data
      useAuthStore.setState({
        user: updatedUser,
        isAuthenticated: true,
      });

      // Clear cache after successful save
      businessInfoCache.clear();

      console.log('Location and business info saved successfully, user authenticated');

      // User is now authenticated, navigate to dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Failed to save location and business info:', err);
      setError(err?.message || 'Failed to save location. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: themeStyles.container.background,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          background: themeStyles.card.background,
          borderBottom: themeStyles.card.border,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              color: themeStyles.text,
              fontSize: '24px',
              fontWeight: '700',
              margin: 0,
            }}
          >
            Set Your Location
          </h1>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {address && (
              <div
                style={{
                  color: themeStyles.textSecondary,
                  fontSize: '14px',
                  maxWidth: '400px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
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
                cursor: !position || isSaving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: !position || isSaving ? 0.6 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {isSaving ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div ref={searchContainerRef} style={{ position: 'relative' }}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setShowSearchResults(true);
              }
            }}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
            placeholder="Search for a location (e.g., Accra, Ghana)"
            style={{
              width: '100%',
              padding: '12px 16px',
              paddingRight: isSearching ? '40px' : '16px',
              background: themeStyles.input?.background || themeStyles.card.background,
              color: themeStyles.text,
              border: `1px solid ${themeStyles.card.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowSearchResults(false);
                setSearchQuery('');
              }
            }}
          />
          {isSearching && (
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: themeStyles.textSecondary,
              }}
            >
              ⏳
            </div>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: themeStyles.card.background,
                border: `1px solid ${themeStyles.card.border}`,
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              {searchResults.map((result) => (
                <div
                  key={result.place_id}
                  onClick={() => handleSearchResultSelect(result)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${themeStyles.card.border}`,
                    transition: 'background-color 0.2s ease',
                    color: themeStyles.text,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      themeStyles.button?.background || themeStyles.card.background;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                    }}
                  >
                    {result.display_name.split(',').slice(0, 2).join(', ')}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: themeStyles.textSecondary,
                    }}
                  >
                    {result.display_name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSearchResults &&
            searchQuery.trim() &&
            !isSearching &&
            searchResults.length === 0 &&
            debouncedSearchQuery.trim() && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  background: themeStyles.card.background,
                  border: `1px solid ${themeStyles.card.border}`,
                  borderRadius: '8px',
                  padding: '16px',
                  color: themeStyles.textSecondary,
                  fontSize: '14px',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              >
                No locations found
              </div>
            )}
        </div>

        {/* Manual Coordinate Inputs */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            marginTop: '12px',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: themeStyles.textSecondary,
              }}
            >
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={manualLatitude}
              onChange={(e) => {
                setManualLatitude(e.target.value);
                setCoordinateError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualCoordinateSubmit();
                }
              }}
              placeholder="e.g., 5.6037"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: themeStyles.input?.background || themeStyles.card.background,
                color: themeStyles.text,
                border: coordinateError
                  ? `1px solid ${themeStyles.error}`
                  : `1px solid ${themeStyles.card.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = themeStyles.accent;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = coordinateError
                  ? themeStyles.error
                  : themeStyles.card.border;
              }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: themeStyles.textSecondary,
              }}
            >
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={manualLongitude}
              onChange={(e) => {
                setManualLongitude(e.target.value);
                setCoordinateError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualCoordinateSubmit();
                }
              }}
              placeholder="e.g., -0.1870"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: themeStyles.input?.background || themeStyles.card.background,
                color: themeStyles.text,
                border: coordinateError
                  ? `1px solid ${themeStyles.error}`
                  : `1px solid ${themeStyles.card.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = themeStyles.accent;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = coordinateError
                  ? themeStyles.error
                  : themeStyles.card.border;
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              justifyContent: 'flex-end',
            }}
          >
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'transparent', // Invisible label for alignment
              }}
            >
              Apply
            </label>
            <button
              onClick={handleManualCoordinateSubmit}
              disabled={isLoadingLocation || !manualLatitude || !manualLongitude}
              style={{
                padding: '10px 20px',
                background: themeStyles.button?.background || themeStyles.card.background,
                color: themeStyles.text,
                border: themeStyles.card.border,
                borderRadius: '6px',
                fontWeight: '600',
                cursor: isLoadingLocation || !manualLatitude || !manualLongitude ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isLoadingLocation || !manualLatitude || !manualLongitude ? 0.6 : 1,
                transition: 'opacity 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Apply
            </button>
          </div>
        </div>
        {coordinateError && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: themeStyles.error + '20',
              color: themeStyles.error,
              borderRadius: '6px',
              fontSize: '12px',
            }}
          >
            {coordinateError}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0, // Important for flex children
          width: '100%',
        }}
      >
        {position ? (
          <MapContainer
            key={`${position[0]}-${position[1]}-${mapZoom}`}
            center={position}
            zoom={mapZoom}
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
              zoomLevel={mapZoom}
            />
          </MapContainer>
        ) : (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeStyles.textSecondary,
            }}
          >
            Loading map...
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
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
        }}
      >
        <span>
          {locationPermission === 'granted'
            ? '✅ Location access granted. Click on the map to adjust your location if needed.'
            : locationPermission === 'denied'
              ? '⚠️ Location access denied. Please click on the map to select your location, or click "Use My Location" to try again.'
              : 'Click on the map to select your location, or click "Use My Location" to use your current position.'}
        </span>
      </div>

      {error && (
        <div
          style={{
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
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

