import { useEffect, useRef } from 'react';

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

export default function CalendlyWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initWidget = () => {
      if (window.Calendly && containerRef.current) {
        containerRef.current.innerHTML = '';
        window.Calendly.initInlineWidget({
          url: CALENDLY_URL,
          parentElement: containerRef.current,
        });
      }
    };

    const existingLink = document.querySelector(`link[href="${CALENDLY_CSS_URL}"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.href = CALENDLY_CSS_URL;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(`script[src="${CALENDLY_SCRIPT_URL}"]`);
    
    if (existingScript) {
      initWidget();
    } else {
      const script = document.createElement('script');
      script.src = CALENDLY_SCRIPT_URL;
      script.async = true;
      script.onload = initWidget;
      document.body.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ minWidth: '320px', height: '630px' }}
      data-testid="calendly-widget-container"
    />
  );
}
