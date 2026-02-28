import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

interface CustomerLocation {
  lon: number;  // longitude
  lat: number;  // latitude
  label: string;
}

interface WorldMapProps {
  customerLocations?: CustomerLocation[];
  dotColor?: string;
  markerColor?: string;
  dotOpacity?: number;
  dotRadius?: number;
  markerRadius?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
  spacing?: number; // px spacing between dots (smaller = denser)
}

export default function WorldMap({
  customerLocations = [
    { lon: -122.4194, lat: 37.7749, label: 'San Francisco' },
    { lon: -74.006, lat: 40.7128, label: 'New York' },
    { lon: -0.1276, lat: 51.5074, label: 'London' },
    { lon: 72.8777, lat: 19.0760, label: 'Mumbai' },
    { lon: 139.6917, lat: 35.6895, label: 'Tokyo' },
    { lon: 2.3522, lat: 48.8566, label: 'Paris' },
    { lon: 103.8198, lat: 1.3521, label: 'Singapore' },
    { lon: 151.2093, lat: -33.8688, label: 'Sydney' }
  ],
  dotColor = '#2f2f2f',
  markerColor = '#f5c542',
  dotOpacity = 0.95,
  dotRadius = 1.8,
  markerRadius = 6,
  backgroundColor = '#151515',
  width = 1400,
  height = 800,
  spacing = 10
}: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous SVG if exists
    if (svgRef.current) {
      svgRef.current.remove();
    }

    const container = containerRef.current;

    // Create SVG using D3
    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svgRef.current = svg.node();

    // Background rectangle
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', backgroundColor);

    // Load world topology and render
    (async () => {
      try {
        // Load world-atlas land topology
        const topo: any = await d3.json(
          'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'
        );

        const land = feature(topo, topo.objects.land) as any as GeoJSON.Feature<GeoJSON.MultiPolygon>;

        // Create projection
        const projection = d3
          .geoEquirectangular()
          .fitSize([width * 0.92, height * 0.92], land);

        // Point-in-polygon test for land
        const isLand = (lon: number, lat: number) => d3.geoContains(land, [lon, lat]);

        // Convert customer locations to pixel coordinates
        const customerXY = customerLocations
          .map(({ lon, lat, label }) => {
            const coords = projection([lon, lat]);
            return coords ? { x: coords[0], y: coords[1], label } : null;
          })
          .filter((c): c is { x: number; y: number; label: string } => c !== null);

        // Generate dot grid
        const circles: Array<{ x: number; y: number; isHighlight: boolean }> = [];
        const highlightThreshold2 = (spacing * 0.6) * (spacing * 0.6);

        for (let y = 0; y <= height; y += spacing) {
          for (let x = 0; x <= width; x += spacing) {
            if (!projection.invert) continue;
            const lonlat = projection.invert([x, y]);
            if (!lonlat) continue;

            const [lon, lat] = lonlat;
            if (!isLand(lon, lat)) continue;

            // Check if near any customer location
            let isHighlight = false;
            for (const c of customerXY) {
              const dx = x - c.x;
              const dy = y - c.y;
              if (dx * dx + dy * dy < highlightThreshold2) {
                isHighlight = true;
                break;
              }
            }

            circles.push({ x, y, isHighlight });
          }
        }

        // Draw dots
        svg
          .append('g')
          .attr('opacity', dotOpacity)
          .selectAll('circle')
          .data(circles)
          .enter()
          .append('circle')
          .attr('cx', (d) => d.x)
          .attr('cy', (d) => d.y)
          .attr('r', dotRadius)
          .attr('fill', (d) => (d.isHighlight ? markerColor : dotColor));

        // Draw customer markers on top with animation
        const markerGroup = svg.append('g').attr('class', 'customer-markers');

        // Add CSS animation for pulse effect
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse-marker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `;
        document.head.appendChild(style);

        customerXY.forEach((loc, i) => {
          markerGroup
            .append('circle')
            .attr('cx', loc.x)
            .attr('cy', loc.y)
            .attr('r', markerRadius)
            .attr('fill', markerColor)
            .style('animation', 'pulse-marker 2s ease-in-out infinite')
            .style('animation-delay', `${i * 0.2}s`)
            .append('title')
            .text(loc.label);
        });

      } catch (error) {
        console.error('Failed to load world topology:', error);
      }
    })();

    // Cleanup
    return () => {
      if (svgRef.current) {
        svgRef.current.remove();
      }
    };
  }, [customerLocations, dotColor, markerColor, dotOpacity, dotRadius, markerRadius, backgroundColor, width, height, spacing]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full"
      style={{ 
        backgroundColor,
        minHeight: '500px',
        aspectRatio: `${width} / ${height}`
      }}
      aria-label="World map showing customer locations"
    />
  );
}
