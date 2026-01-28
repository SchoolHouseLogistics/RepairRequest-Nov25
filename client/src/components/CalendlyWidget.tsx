import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: Record<string, unknown>;
        utm?: Record<string, unknown>;
      }) => void;
    };
  }
}

const CALENDLY_URL = 'https://calendly.com/schoolhouselogistics/30min';
const CALENDLY_SCRIPT_URL = 'https://assets.calendly.com/assets/external/widget.js';
const CALENDLY_CSS_URL = 'https://assets.calendly.com/assets/external/widget.css';
const SCRIPT_LOAD_TIMEOUT = 10000; // 10 seconds

export default function CalendlyWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let mounted = true;

    const initWidget = () => {
      try {
        if (window.Calendly && containerRef.current) {
          containerRef.current.innerHTML = '';
          window.Calendly.initInlineWidget({
            url: CALENDLY_URL,
            parentElement: containerRef.current,
          });
          if (mounted) {
            setIsLoading(false);
            setLoadError(null);
          }
        }
      } catch (error) {
        console.error('Error initializing Calendly widget:', error);
        if (mounted) {
          setLoadError('Failed to initialize scheduling widget');
          setIsLoading(false);
        }
      }
    };

    const loadCalendly = () => {
      try {
        // Add CSS if not already present
        const existingLink = document.querySelector(`link[href="${CALENDLY_CSS_URL}"]`);
        if (!existingLink) {
          const link = document.createElement('link');
          link.href = CALENDLY_CSS_URL;
          link.rel = 'stylesheet';
          link.onerror = () => {
            console.error('Failed to load Calendly CSS');
          };
          document.head.appendChild(link);
        }

        // Check if script already loaded
        const existingScript = document.querySelector(`script[src="${CALENDLY_SCRIPT_URL}"]`);

        if (existingScript) {
          // Script already loaded, just init widget
          initWidget();
        } else {
          // Set timeout for script loading
          timeoutId = setTimeout(() => {
            if (mounted && isLoading) {
              setLoadError('Scheduling widget took too long to load');
              setIsLoading(false);
            }
          }, SCRIPT_LOAD_TIMEOUT);

          // Load script
          const script = document.createElement('script');
          script.src = CALENDLY_SCRIPT_URL;
          script.async = true;

          script.onload = () => {
            if (timeoutId) clearTimeout(timeoutId);
            initWidget();
          };

          script.onerror = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (mounted) {
              setLoadError('Failed to load scheduling widget');
              setIsLoading(false);
            }
          };

          document.body.appendChild(script);
        }
      } catch (error) {
        console.error('Error loading Calendly:', error);
        if (mounted) {
          setLoadError('Failed to load scheduling widget');
          setIsLoading(false);
        }
      }
    };

    loadCalendly();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (loadError) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg"
        style={{ minWidth: '320px', height: '630px' }}
      >
        <div className="text-center p-4">
          <p className="text-gray-600 mb-2">{loadError}</p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Schedule directly on Calendly
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-50"
          style={{ minWidth: '320px', height: '630px' }}
        >
          <div className="text-gray-500">Loading scheduler...</div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ minWidth: '320px', height: '630px' }}
        data-testid="calendly-widget-container"
      />
    </div>
  );
}
