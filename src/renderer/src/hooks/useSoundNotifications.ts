import { useCallback, useRef, useEffect, useState } from 'react';

// Helper to get asset path - works in both dev and production
function getAssetPath(relativePath: string): string {
  // In Electron with Vite, assets are served from the renderer directory
  // Try multiple path formats for compatibility
  if (import.meta.env.DEV) {
    // Development: use direct path
    return new URL(`../../assets/${relativePath}`, import.meta.url).href;
  } else {
    // Production: assets should be in the out directory
    return new URL(`../../assets/${relativePath}`, import.meta.url).href;
  }
}

// Sound file paths
const whatsappJobSound = getAssetPath('sounds/new_whatsapp_job_beep_high_tech_with_reverb_007_87543.mp3');
const paymentSuccessSound = getAssetPath('sounds/payment_job_bell_ring_clapper_movement_x5_89158.mp3');
const publicJobSound = getAssetPath('sounds/public_job_beeps_reverb_large_area_high_pitched_65401.mp3');

type SoundType = 'whatsapp-job' | 'payment-success' | 'public-job';

interface SoundConfig {
  file: string;
  volume?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  'whatsapp-job': {
    file: whatsappJobSound,
  },
  'payment-success': {
    file: paymentSuccessSound,
  },
  'public-job': {
    file: publicJobSound,
  },
};

// Track which jobs have already played sounds to avoid duplicates
const playedSounds = new Map<string, Set<string>>();

export function useSoundNotifications() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7); // Default 70% volume
  const audioRefs = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Initialize audio elements
  useEffect(() => {
    console.log('[SoundNotifications] Initializing audio elements...');
    Object.entries(SOUND_CONFIGS).forEach(([type, config]) => {
      console.log(`[SoundNotifications] Loading sound: ${type} from ${config.file}`);
      const audio = new Audio(config.file);
      audio.volume = volume;
      audio.preload = 'auto';
      
      // Add error handlers
      audio.addEventListener('error', () => {
        console.error(`[SoundNotifications] ❌ Error loading audio ${type}:`, {
          src: audio.src,
          error: audio.error,
          errorCode: audio.error?.code,
          errorMessage: audio.error?.message,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log(`[SoundNotifications] ✅ Audio ${type} ready to play (src: ${audio.src})`);
      });
      
      audio.addEventListener('loadstart', () => {
        console.log(`[SoundNotifications] 📥 Audio ${type} loading started`);
      });
      
      audio.addEventListener('loadeddata', () => {
        console.log(`[SoundNotifications] 📦 Audio ${type} data loaded`);
      });
      
      // Try to load immediately to catch errors early
      try {
        audio.load();
      } catch (error) {
        console.error(`[SoundNotifications] ❌ Error in audio.load() for ${type}:`, error);
      }
      
      audioRefs.current.set(type as SoundType, audio);
    });

    return () => {
      // Cleanup: pause and remove all audio elements
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    audioRefs.current.forEach((audio) => {
      audio.volume = isMuted ? 0 : volume;
    });
  }, [volume, isMuted]);

  const playSound = useCallback(
    (type: SoundType, jobId?: string) => {
      console.log(`[SoundNotifications] 🎵 playSound called: ${type}${jobId ? ` for job ${jobId}` : ''}`);
      
      if (isMuted) {
        console.log(`[SoundNotifications] Sound ${type} muted`);
        return;
      }

      // If jobId is provided, check if we've already played this sound for this job
      if (jobId) {
        const jobSounds = playedSounds.get(jobId) || new Set();
        if (jobSounds.has(type)) {
          console.log(`[SoundNotifications] Sound ${type} already played for job ${jobId}`);
          return;
        }
        jobSounds.add(type);
        playedSounds.set(jobId, jobSounds);
      }

      let audio = audioRefs.current.get(type);
      
      // If audio element doesn't exist or has an error, create a new one
      if (!audio || audio.error) {
        console.log(`[SoundNotifications] Creating new audio element for ${type}`);
        const config = SOUND_CONFIGS[type];
        audio = new Audio(config.file);
        audio.volume = isMuted ? 0 : volume;
        audio.preload = 'auto';
        
        audio.addEventListener('error', (e) => {
          console.error(`[SoundNotifications] ❌ Error in new audio ${type}:`, e, {
            src: audio?.src,
            error: audio?.error,
          });
        });
        
        audioRefs.current.set(type, audio);
      }

      if (!audio) {
        console.error(`[SoundNotifications] ❌ Failed to create audio element for type: ${type}`);
        return;
      }

      // Check if audio is ready to play
      const playAudio = async () => {
        try {
          // Reset audio to start
          audio.currentTime = 0;
          
          // Check if audio is loaded
          if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            console.log(`[SoundNotifications] Audio ${type} is ready, playing...`);
          } else {
            console.log(`[SoundNotifications] Audio ${type} not fully loaded (readyState: ${audio.readyState}), attempting to load...`);
            // Try to load the audio
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
              }, 2000);
              
              audio.addEventListener('canplaythrough', () => {
                clearTimeout(timeout);
                resolve(undefined);
              }, { once: true });
              
              audio.addEventListener('error', (e) => {
                clearTimeout(timeout);
                reject(e);
              }, { once: true });
              
              audio.load();
            });
          }
          
          // Play the sound
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log(`[SoundNotifications] ✅ Successfully playing sound: ${type}${jobId ? ` for job ${jobId}` : ''}`);
          }
        } catch (error: unknown) {
          const err = error as Error;
          console.error(`[SoundNotifications] ❌ Error playing sound ${type}:`, err);
          
          // If autoplay is blocked, try creating a new audio element and playing it
          // This sometimes works around autoplay restrictions
          if (err.name === 'NotAllowedError' || err.name === 'NotSupportedError') {
            console.log(`[SoundNotifications] Autoplay blocked, trying fallback method...`);
            try {
              const config = SOUND_CONFIGS[type];
              const fallbackAudio = new Audio(config.file);
              fallbackAudio.volume = isMuted ? 0 : volume;
              const fallbackPromise = fallbackAudio.play();
              if (fallbackPromise !== undefined) {
                await fallbackPromise;
                console.log(`[SoundNotifications] ✅ Fallback audio playing for ${type}`);
              }
            } catch (fallbackError) {
              console.error(`[SoundNotifications] ❌ Fallback also failed:`, fallbackError);
            }
          }
        }
      };

      // Execute play
      playAudio();
    },
    [isMuted, volume]
  );

  // Clear played sounds for a job (useful when job status changes)
  const clearJobSounds = useCallback((jobId: string) => {
    playedSounds.delete(jobId);
  }, []);

  // Clear all played sounds (useful for testing or reset)
  const clearAllSounds = useCallback(() => {
    playedSounds.clear();
  }, []);

  return {
    playSound,
    isMuted,
    setIsMuted,
    volume,
    setVolume,
    clearJobSounds,
    clearAllSounds,
  };
}

