import { useState, useEffect, useRef } from 'react';
import { useInputHelp } from './hooks';

/**
 * Props for InputHelpComponent
 */
export interface InputHelpComponentProps {
  /**
   * Unique identifier for input help content
   */
  inputHelpId: string;
  
  /**
   * Default icon type
   */
  defaultIconType?: 'info' | 'exclamation';
  
  /**
   * Position of the help panel relative to the icon
   */
  position?: 'right' | 'left';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Required attribute for CMS discovery
   */
  'data-input-help-id': string;
}

// Position classes for help panel
const positionClasses = {
  right: 'left-full ml-3 top-1/2 -translate-y-1/2',
  left: 'right-full mr-3 top-1/2 -translate-y-1/2',
};

/**
 * Info icon SVG
 */
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}

/**
 * Exclamation icon SVG
 */
function ExclamationIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      style={style}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}



/**
 * InputHelpComponent displays a help icon next to form inputs.
 * Clicking the icon shows a panel/card with helpful information.
 * Content is loaded from the CMS and supports multiple languages.
 * 
 * In CMS mode (when ?cms-mode=true is in URL):
 * - Shows edit icon overlay on hover
 * - Sends postMessage to parent CMS window on click
 * - Listens for preview updates from CMS
 */
export function InputHelpComponent({
  inputHelpId,
  defaultIconType = 'info',
  position = 'right',
  className = '',
  'data-input-help-id': dataInputHelpId,
}: InputHelpComponentProps) {
  const helpContent = useInputHelp(inputHelpId);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only render if enabled (in both CMS and normal mode)
  if (!helpContent?.enabled) {
    return null;
  }

  const message = helpContent?.message || '';
  const iconType = helpContent?.iconType || defaultIconType;

  // Handle click - just toggle the help panel (no CMS settings)
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center group ${className}`}
      data-input-help-id={dataInputHelpId}
    >
      <button
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
        className={`
          relative rounded-full p-1.5 transition-all duration-300 
          focus:outline-none focus:ring-2 focus:ring-offset-2
          hover:scale-125 transform
          ${
            iconType === 'info' 
              ? 'focus:ring-blue-500' 
              : 'focus:ring-red-500'
          }
        `}
        style={{
          background: iconType === 'info'
            ? 'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)'
            : 'linear-gradient(145deg, #ef4444 0%, #dc2626 100%)',
          boxShadow: iconType === 'info'
            ? '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
            : '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
          animation: iconType === 'info' ? 'glow-pulse-blue 2s ease-in-out infinite' : 'glow-pulse-red 2s ease-in-out infinite',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label={isOpen ? 'Hide help' : 'Show help'}
        aria-expanded={isOpen}
        type="button"
      >
        {iconType === 'info' ? (
          <InfoIcon className="w-5 h-5 text-white drop-shadow-lg" />
        ) : (
          <ExclamationIcon className="w-5 h-5 text-white drop-shadow-lg" />
        )}
      </button>
      <style>{`
        @keyframes glow-pulse-blue {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          }
        }
        @keyframes glow-pulse-red {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          }
        }
      `}</style>



      {/* Help panel (shown when open and message exists) */}
      {isOpen && message && (
        <div className={`absolute z-50 top-1/2 -translate-y-1/2 ${positionClasses[position]}`}>
          <div 
            className="w-80 bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden"
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(10px)',
              animation: 'fadeIn 0.3s ease forwards'
            }}
          >
            {/* Gradient top bar */}
            <div 
              className={`h-1 ${
                iconType === 'info' 
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600' 
                  : 'bg-gradient-to-r from-red-500 via-orange-500 to-red-600'
              }`}
            />
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div 
                  className={`flex items-center justify-center rounded-2xl relative ${
                    iconType === 'info' 
                      ? 'w-12 h-12' 
                      : 'w-14 h-14'
                  }`}
                  style={iconType === 'info' ? {
                    background: 'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                  } : {
                    background: 'linear-gradient(145deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.1)',
                    animation: 'attention-pulse 2s ease-in-out infinite'
                  }}
                >
                  {iconType === 'exclamation' && (
                    <div
                      className="absolute -inset-1 rounded-2xl -z-10"
                      style={{
                        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                        animation: 'glow-pulse 2s ease-in-out infinite'
                      }}
                    />
                  )}
                  {iconType === 'info' ? (
                    <div style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}>
                      <InfoIcon className="w-7 h-7 text-white" />
                    </div>
                  ) : (
                    <div style={{ filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3))', animation: 'icon-bounce 2s ease-in-out infinite' }}>
                      <ExclamationIcon className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {iconType === 'info' ? 'Information' : 'Important'}
                </h3>
              </div>
              <style>{`
                @keyframes attention-pulse {
                  0%, 100% {
                    transform: scale(1);
                    box-shadow: 
                      0 8px 24px rgba(239, 68, 68, 0.4),
                      0 0 40px rgba(239, 68, 68, 0.3),
                      inset 0 2px 4px rgba(255, 255, 255, 0.3),
                      inset 0 -2px 4px rgba(0, 0, 0, 0.1);
                  }
                  50% {
                    transform: scale(1.08);
                    box-shadow: 
                      0 12px 32px rgba(239, 68, 68, 0.6),
                      0 0 50px rgba(239, 68, 68, 0.5),
                      inset 0 2px 4px rgba(255, 255, 255, 0.4),
                      inset 0 -2px 4px rgba(0, 0, 0, 0.15);
                  }
                }
                @keyframes glow-pulse {
                  0%, 100% {
                    opacity: 0.6;
                    transform: scale(1);
                  }
                  50% {
                    opacity: 1;
                    transform: scale(1.2);
                  }
                }
                @keyframes icon-bounce {
                  0%, 100% {
                    transform: translateY(0);
                  }
                  50% {
                    transform: translateY(-3px);
                  }
                }
              `}</style>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-all duration-200 hover:scale-110"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content - Fixed height with scroll */}
            <div className="px-5 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400" style={{ height: '220px' }}>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
