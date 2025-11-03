import React, { useState, useRef, useEffect } from 'react';
import { format, addDays, subDays, differenceInCalendarDays } from 'date-fns';

/**
 * ConsumerHeatMap (React + TailwindCSS)
 *
 * - Tooltip appears on hover and follows the cursor; also shows on keyboard focus.
 * - Cells are responsive: they scale to fit the container (between min and max widths);
 *   when there's not enough space cells stay at min width and horizontal scrolling appears.
 * - Styling uses Tailwind utility classes; dynamic widths/heights and colors are applied via inline styles.
 *
 * Note: make sure TailwindCSS is configured and applied globally in your app (e.g., index.css imports).
 */
export default function ConsumerHeatMap() {
  const today = new Date();
  const windowStart = subDays(today, 14);
  const windowEnd = today;
  const numDays = differenceInCalendarDays(windowEnd, windowStart) + 1;
  const numHours = 24;

  // Dummy data (numDays x numHours)
  const [data] = useState(
    Array.from({ length: numDays }, () =>
      Array.from({ length: numHours }, () => Math.floor(Math.random() * 401))
    )
  );

  const containerRef = useRef(null);
  const heatmapRef = useRef(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [heatmapLayout, setHeatmapLayout] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState(null);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const updateLayout = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
      if (heatmapRef.current) {
        const rect = heatmapRef.current.getBoundingClientRect();
        setHeatmapLayout({ x: rect.x, y: rect.y });
      }
      if (typeof window !== 'undefined') {
        setScreenSize({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    updateLayout();
    const onResize = () => updateLayout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [data]);

  const colorValues = [
    '#066A06',
    '#298F35',
    '#4DB458',
    '#6AC96A',
    '#8EDC7F',
    '#B1EF98',
    '#BBF558',
    '#DAEF2A',
    '#F9E900',
    '#FFF400',
    '#FFE300',
    '#FFC200',
    '#FFA100',
    '#FF8100',
    '#FF5F00',
    '#FF3F00',
    '#FF1000'
  ];
  const getColor = (v) => colorValues[Math.min(Math.floor(v / 29), colorValues.length - 1)];

  // Responsive cell sizing
  const minCellWidth = 28;
  const maxCellWidth = 64;
  let cellWidth;
  if (containerWidth && Math.floor((containerWidth - 40) / numHours) >= minCellWidth) {
    cellWidth = Math.min(
      maxCellWidth,
      Math.floor(Math.max(minCellWidth, (containerWidth - 40) / numHours))
    );
  } else {
    cellWidth = minCellWidth;
  }
  const cellHeight = 28;

  // Tooltip sizing & margins (for clamp)
  const tooltipWidth = 180;
  const tooltipHeight = 72;
  const tooltipMargin = 8;

  const computeTooltipPosition = (clientX, clientY) => {
    const intendedTop = (clientY ?? 0) + 12;
    const intendedLeft = (clientX ?? 0) + 12;
    const top = Math.max(tooltipMargin, Math.min(intendedTop, screenSize.height - tooltipHeight - tooltipMargin));
    const left = Math.max(tooltipMargin, Math.min(intendedLeft, screenSize.width - tooltipWidth - tooltipMargin));
    return { top, left };
  };

  // Hover / focus handlers
  const handleCellMouseEnter = (e, v, i, j) => {
    setTooltipData({
      value: v,
      hour: `${j}:00`,
      date: format(addDays(windowStart, i), 'MMM d'),
      clientX: e.clientX,
      clientY: e.clientY
    });
  };
  const handleCellMouseMove = (e) => {
    setTooltipData((prev) => (prev ? { ...prev, clientX: e.clientX, clientY: e.clientY } : prev));
  };
  const handleCellMouseLeave = () => setTooltipData(null);

  const handleCellFocus = (e, v, i, j) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipData({
      value: v,
      hour: `${j}:00`,
      date: format(addDays(windowStart, i), 'MMM d'),
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
  };
  const handleCellBlur = () => setTooltipData(null);

  return (
    <div className="px-0 w-full font-sans" ref={containerRef}>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mt-4 w-full">
        <div className="flex items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Heat Map</h2>
        </div>

        <div className="flex mb-2">
          {/* Y Axis */}
          <div className="mr-2 flex flex-col items-end">
            {Array.from({ length: numDays }).map((_, i) => (
              <div key={i} className="text-xs text-gray-600 flex items-center" style={{ height: cellHeight }}>
                {i === 0 || i === numDays - 1 ? format(addDays(windowStart, i), 'MMM d') : format(addDays(windowStart, i), 'd')}
              </div>
            ))}
          </div>

          {/* Heatmap (scrollable horizontally if needed) */}
          <div className="flex-1 overflow-x-auto" ref={heatmapRef}>
            <div
              className="mb-2"
              style={{ minWidth: numHours * cellWidth }}
            >
              <div className="flex flex-col">
                {data.map((row, i) => (
                  <div key={i} className="flex">
                    {row.map((v, j) => (
                      <button
                        key={j}
                        onMouseEnter={(e) => handleCellMouseEnter(e, v, i, j)}
                        onMouseMove={handleCellMouseMove}
                        onMouseLeave={handleCellMouseLeave}
                        onFocus={(e) => handleCellFocus(e, v, i, j)}
                        onBlur={handleCellBlur}
                        aria-label={`Consumption ${v} kWh on ${format(addDays(windowStart, i), 'MMM d')} at ${j}:00`}
                        className="p-0 m-0 border-0 bg-transparent cursor-pointer outline-none"
                        style={{ lineHeight: 0 }}
                      >
                        <div
                          className="m-0"
                          style={{
                            width: cellWidth,
                            height: cellHeight,
                            backgroundColor: getColor(v)
                          }}
                        />
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* X Axis */}
              <div className="flex items-center mt-2">
                {Array.from({ length: numHours }).map((_, i) => (
                  <div key={i} className="text-xs text-gray-600 text-center" style={{ width: cellWidth }}>
                    {`${i}:00`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 px-0">
          <div className="text-xs font-semibold text-gray-600 mb-1 ml-1">Consumption (kWh)</div>
          <div className="flex h-2 rounded overflow-hidden mb-1">
            {colorValues.map((c, idx) => (
              <div key={idx} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            {[0, 100, 200, 300, 400, 500].map((v) => (
              <div key={v}>{v}</div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltipData && (
          (() => {
            const { top, left } = computeTooltipPosition(tooltipData.clientX, tooltipData.clientY);
            return (
              <div
                className="fixed z-50 pointer-events-none bg-black bg-opacity-85 text-white text-xs rounded px-2 py-1"
                style={{
                  top,
                  left,
                  width: tooltipWidth,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
                }}
              >
                <div className="font-semibold text-sm">Date: {tooltipData.date}</div>
                <div>Hour: {tooltipData.hour}</div>
                <div>Consumption: {tooltipData.value} kWh</div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}