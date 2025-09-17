'use client';

import { useEffect, useRef } from 'react';

interface GlobeProps {
  projects?: any[];
}

export default function Globe({ projects = [] }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // This is a placeholder for the actual Three.js globe implementation
    // For now, we'll just show a gradient sphere effect
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create a simple animated gradient sphere
    let rotation = 0;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.3;

      // Draw sphere with gradient
      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius
      );
      
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');  // Emerald
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)'); // Blue
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');   // Purple

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw grid lines for globe effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      // Latitude lines
      for (let i = -80; i <= 80; i += 20) {
        ctx.beginPath();
        const y = centerY + (radius * i / 90);
        const lineRadius = Math.sqrt(Math.max(0, radius * radius - (radius * i / 90) * (radius * i / 90)));
        ctx.arc(centerX, y, lineRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw project points
      if (projects.length > 0) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)'; // Amber for projects
        projects.slice(0, 100).forEach((project, i) => {
          const angle = (i / 100) * Math.PI * 2 + rotation;
          const x = centerX + Math.cos(angle) * radius * 0.8;
          const y = centerY + Math.sin(angle) * radius * 0.8;
          
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      rotation += 0.001;
      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [projects]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}