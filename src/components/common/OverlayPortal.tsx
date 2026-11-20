import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface OverlayPortalProps {
  children: React.ReactNode;
  containerId?: string;
}

/**
 * OverlayPortal
 * Renders overlay elements directly into document.body or a dedicated portal root
 * to prevent parent overflow clipping, transform disruptions, and stacking context bugs.
 */
export const OverlayPortal: React.FC<OverlayPortalProps> = ({
  children,
  containerId = 'hotelos-overlay-root',
}) => {
  const [mounted, setMounted] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement('div');
      el.id = containerId;
      document.body.appendChild(el);
    }
    setTargetElement(el);
    setMounted(true);

    return () => {
      // Keep root container alive for performance
    };
  }, [containerId]);

  if (!mounted || !targetElement) {
    return null;
  }

  return createPortal(children, targetElement);
};
