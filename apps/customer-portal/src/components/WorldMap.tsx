import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

interface CustomerLocation {
  lon: number;
  lat: number;
  label: string;
}

interface ClusterConfig {
  name: string;
  center: [number, number];
  count: number;
  radiusKm: number;
}

interface WorldMapProps {
  customerLocations?: CustomerLocation[];
  backgroundColor?: string;
  width?: number;
  height?: number;
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
  backgroundColor = '#151515',
  width = 1600,
  height = 900
}: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous SVG
    if (svgRef.current) {
      svgRef.current.remove();
    }

    const container = containerRef.current;

    // Configuration
    const SPACING = 14;
    const DOT_R = 2.0;
    const OCEAN_DOT = '#1f1f22';
    const LAND_DOT = '#2e2e33';
    const HI = '#f5c542';
    const OCEAN_OPACITY = 0.55;
    const LAND_OPACITY = 0.95;
    const GLOBAL_SCATTER_COUNT = 45; // Scattered highlights across the world

    // Helper functions
    const snapPx = (v: number, spacing: number) => Math.round(v / spacing) * spacing;
    
    const kmToDegLat = (km: number) => km / 110.574;
    const kmToDegLon = (km: number, latDeg: number) => 
      km / (111.32 * Math.cos((latDeg * Math.PI) / 180));
    
    const randInCircle = () => {
      const t = 2 * Math.PI * Math.random();
      const u = Math.random() + Math.random();
      const r = u > 1 ? 2 - u : u;
      return { dx: r * Math.cos(t), dy: r * Math.sin(t) };
    };

    // Create SVG
    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svgRef.current = svg.node();

    // Background
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', backgroundColor);

    // Filters
    const defs = svg.append('defs');

    // Glow filter
    const glow = defs
      .append('filter')
      .attr('id', 'customer-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    glow
      .append('feGaussianBlur')
      .attr('stdDeviation', 2.8)
      .attr('result', 'blur');
    
    glow
      .append('feColorMatrix')
      .attr('in', 'blur')
      .attr('type', 'matrix')
      .attr('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 2.2 0')
      .attr('result', 'bloom');
    
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'bloom');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Vignette
    const vignette = defs.append('radialGradient').attr('id', 'customer-vignette');
    vignette.append('stop').attr('offset', '55%').attr('stop-color', 'rgba(0,0,0,0)');
    vignette.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(0,0,0,0.65)');

    // Load and render
    (async () => {
      try {
        const topo: any = await d3.json(
          'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'
        );

        const land = feature(topo, topo.objects.land) as any as GeoJSON.Feature<GeoJSON.MultiPolygon>;

        // Use Natural Earth projection for better aesthetics
        const projection = d3
          .geoNaturalEarth1()
          .fitExtent(
            [[60, 80], [width - 60, height - 120]],
            land
          );

        const isLand = (lon: number, lat: number) => d3.geoContains(land, [lon, lat]);

        // Generate highlights
        const highlightPx = new Set<string>();

        const addHighlightLonLat = (lon: number, lat: number) => {
          const p = projection([lon, lat]);
          if (!p) return;
          const x = snapPx(p[0], SPACING);
          const y = snapPx(p[1], SPACING);
          highlightPx.add(`${x},${y}`);
        };

        // Add customer location clusters
        const clusters: ClusterConfig[] = customerLocations.map(loc => ({
          name: loc.label,
          center: [loc.lon, loc.lat],
          count: 6, // dots per cluster
          radiusKm: 280
        }));

        for (const c of clusters) {
          const [clon, clat] = c.center;
          const addedForCluster = new Set<string>();
          
          for (let i = 0; i < c.count * 4; i++) {
            if (addedForCluster.size >= c.count) break;
            
            const { dx, dy } = randInCircle();
            const dKm = c.radiusKm * Math.random();
            const dLat = kmToDegLat(dKm * dy);
            const dLon = kmToDegLon(dKm * dx, clat);

            const lon = clon + dLon;
            const lat = clat + dLat;

            if (isLand(lon, lat)) {
              const before = highlightPx.size;
              addHighlightLonLat(lon, lat);
              if (highlightPx.size > before) {
                addedForCluster.add(`${lon},${lat}`);
              }
            }
          }
          
          // Ensure center is highlighted
          addHighlightLonLat(clon, clat);
        }

        // Add scattered global highlights
        let added = 0;
        let attempts = 0;
        while (added < GLOBAL_SCATTER_COUNT && attempts < GLOBAL_SCATTER_COUNT * 60) {
          attempts++;
          const lon = -180 + Math.random() * 360;
          const lat = -60 + Math.random() * 140;
          
          if (!isLand(lon, lat)) continue;

          const before = highlightPx.size;
          addHighlightLonLat(lon, lat);
          if (highlightPx.size > before) added++;
        }

        // Generate dot grid
        const dots: Array<{ x: number; y: number; kind: 'ocean' | 'land' | 'hi' }> = [];

        for (let y = 0; y <= height; y += SPACING) {
          for (let x = 0; x <= width; x += SPACING) {
            const lonlat = projection.invert?.([x, y]);
            if (!lonlat) continue;

            if (highlightPx.has(`${x},${y}`)) {
              dots.push({ x, y, kind: 'hi' });
              continue;
            }

            const [lon, lat] = lonlat;
            dots.push({ x, y, kind: isLand(lon, lat) ? 'land' : 'ocean' });
          }
        }

        // Render layers
        const g = svg.append('g');

        // Ocean dots
        g.append('g')
          .attr('opacity', OCEAN_OPACITY)
          .selectAll('circle')
          .data(dots.filter(d => d.kind === 'ocean'))
          .enter()
          .append('circle')
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', DOT_R)
          .attr('fill', OCEAN_DOT);

        // Land dots
        g.append('g')
          .attr('opacity', LAND_OPACITY)
          .selectAll('circle')
          .data(dots.filter(d => d.kind === 'land'))
          .enter()
          .append('circle')
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', DOT_R)
          .attr('fill', LAND_DOT);

        // Highlighted dots with glow
        g.append('g')
          .selectAll('circle')
          .data(dots.filter(d => d.kind === 'hi'))
          .enter()
          .append('circle')
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', DOT_R + 0.4)
          .attr('fill', HI)
          .attr('filter', 'url(#customer-glow)');

        // Vignette overlay
        svg
          .append('rect')
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('fill', 'url(#customer-vignette)')
          .style('pointer-events', 'none');

      } catch (error) {
        console.error('Failed to load world topology:', error);
      }
    })();

    return () => {
      if (svgRef.current) {
        svgRef.current.remove();
      }
    };
  }, [customerLocations, backgroundColor, width, height]);

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
