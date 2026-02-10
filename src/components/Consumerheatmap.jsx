import React, { useState, useRef, useEffect } from 'react';
import { format, addDays, subDays, differenceInCalendarDays } from 'date-fns';

export default function ConsumerHeatMap({ scno, selectedDate, viewMode }) {
  // normalize selectedDate to a Date instance; fallback to today
  const endDate = selectedDate ? (selectedDate instanceof Date ? selectedDate : new Date(selectedDate)) : new Date();

  // windowStart should be 29 days before endDate so we have 30 days inclusive
  const windowStart = subDays(endDate, 29);
  const windowEnd = endDate;
  const numDays = differenceInCalendarDays(windowEnd, windowStart) + 1; // should be 30
  const numHours = 24;

  const containerRef = useRef(null);
  const heatmapRef = useRef(null);

  // Data will be stored as rows = hours (0..23), columns = days (0..numDays-1)
  const [data, setData] = useState(() =>
    // initialize with zeros so layout is stable while loading
    Array.from({ length: numHours }, () => Array.from({ length: numDays }, () => 0))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [heatmapLayout, setHeatmapLayout] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState(null);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  // Offline state
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [cacheMeta, setCacheMeta] = useState(null); // { key, ts }

  // update layout and screen size on resize
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

  // network online/offline handlers
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // color palette and helper
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

  // Responsive sizing: now width depends on numDays (columns), height per row is fixed
  // Reduced cell sizes per user request
  const minCellWidth = 20; // reduced from 28
  const maxCellWidth = 48; // reduced from 64
  let cellWidth;
  if (containerWidth && Math.floor((containerWidth - 40) / numDays) >= minCellWidth) {
    cellWidth = Math.min(
      maxCellWidth,
      Math.floor(Math.max(minCellWidth, (containerWidth - 40) / numDays))
    );
  } else {
    cellWidth = minCellWidth;
  }
  const cellHeight = 20; // reduced from 28

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

  // LocalStorage caching
  const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in ms
  const buildCacheKey = (sc, date) => `heatmapCache_${sc}_${date}`;
  const saveCache = (key, payload) => {
    try {
      const wrap = {
        ts: Date.now(),
        data: payload
      };
      localStorage.setItem(key, JSON.stringify(wrap));
      setCacheMeta({ key, ts: wrap.ts });
    } catch (e) {
      // ignore storage errors silently
      console.warn('Failed to save cache', e);
    }
  };
  const loadCache = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.warn('Failed to read cache', e);
      return null;
    }
  };
  const isCacheFresh = (ts) => {
    if (!ts) return false;
    return Date.now() - ts < CACHE_TTL;
  };

  // Fetch heatmap data when scno or selectedDate change
  useEffect(() => {
    if (!scno) {
      setError('No consumer (scno) provided');
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const dateStr = format(endDate, 'yyyy-MM-dd');
      const cacheKey = buildCacheKey(scno, dateStr);

      try {
        // If offline, attempt to use cache (even if stale). If no cache -> error.
        if (isOffline) {
          const cached = loadCache(cacheKey);
          if (cached && cached.data) {
            // Use cached data immediately
            if (isActive) {
              setData(cached.data);
              setCacheMeta({ key: cacheKey, ts: cached.ts });
              setError(null);
            }
          } else {
            if (isActive) {
              setError('Offline and no cached data available for this consumer/date.');
            }
          }
          return;
        }

        // Online: try to use fresh cache immediately for snappy UI while fetching
        const cached = loadCache(cacheKey);
        if (cached && cached.data && isCacheFresh(cached.ts)) {
          if (isActive) {
            setData(cached.data);
            setCacheMeta({ key: cacheKey, ts: cached.ts });
          }
        }

        // Now fetch fresh data from API (will update cache on success)
        const url = `https://ee.elementsenergies.com/api/fetchHMHourlyConsumption1?scno=${encodeURIComponent(
          scno
        )}&date=${encodeURIComponent(dateStr)}`;

        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
        const json = await resp.json();

        // json keys look like: "2025-09-09 00:00:00": 94.06
        // Build a map date => hour => value
        const map = {};
        for (const key in json) {
          if (!Object.prototype.hasOwnProperty.call(json, key)) continue;
          const val = json[key];
          // split on space to separate date and time
          const parts = key.split(' ');
          if (parts.length < 2) continue;
          const datePart = parts[0]; // '2025-09-09'
          const timePart = parts[1]; // '00:00:00'
          const hour = parseInt(timePart.split(':')[0], 10);
          if (!Number.isFinite(hour)) continue;
          if (!map[datePart]) map[datePart] = {};
          // store rounded to 2 decimals
          map[datePart][hour] = Math.round((Number(val) + Number.EPSILON) * 100) / 100;
        }

        // Build days x hours first (like before), then transpose to hours x days
        const daysMatrix = Array.from({ length: numDays }, (_, i) => {
          const dateKey = format(addDays(windowStart, i), 'yyyy-MM-dd');
          return Array.from({ length: numHours }, (_, h) => {
            const v = map[dateKey] && Number.isFinite(map[dateKey][h]) ? map[dateKey][h] : 0;
            return v;
          });
        });

        // Transpose: hours x days
        const transposed = Array.from({ length: numHours }, (_, h) =>
          Array.from({ length: numDays }, (_, d) => daysMatrix[d][h])
        );

        if (isActive) {
          setData(transposed);
          saveCache(cacheKey, transposed);
          setError(null);
        }
      } catch (err) {
        if (isActive) {
          if (err.name === 'AbortError') {
            // ignore
          } else {
            // Attempt to fallback to cache if available (this helps in case of transient fetch failure)
            const dateStr2 = format(endDate, 'yyyy-MM-dd');
            const cacheKey2 = buildCacheKey(scno, dateStr2);
            const cached2 = loadCache(cacheKey2);
            if (cached2 && cached2.data) {
              setData(cached2.data);
              setCacheMeta({ key: cacheKey2, ts: cached2.ts });
              setError(`Fetch failed, using cached data. (${err.message || String(err)})`);
            } else {
              setError(err.message || String(err));
            }
          }
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isActive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scno, selectedDate, isOffline]);

  // compute min/max across data for dynamic scale
  const flatValues = data.flat();
  const numericValues = flatValues.filter((v) => Number.isFinite(v));
  const minVal = numericValues.length ? Math.min(...numericValues) : 0;
  const maxVal = numericValues.length ? Math.max(...numericValues) : 0;

  // Create equal interval scale ticks (we'll show 6 ticks including endpoints if possible)
  const ticksCount = 6;
  let scaleTicks = [];
  if (maxVal === minVal) {
    // single-value case: show that value and a zero if it's not zero
    if (minVal === 0) {
      scaleTicks = [0];
    } else {
      scaleTicks = [Math.round(minVal)];
    }
  } else {
    const stepFloat = (maxVal - minVal) / (ticksCount - 1);
    const generated = Array.from({ length: ticksCount }, (_, i) =>
      Math.round(minVal + i * stepFloat)
    );
    // ensure first is exact min and last is exact max
    generated[0] = Math.round(minVal);
    generated[generated.length - 1] = Math.round(maxVal);
    // remove duplicates (possible due to rounding) while preserving order
    scaleTicks = generated.filter((v, idx, arr) => arr.indexOf(v) === idx);
    // ensure at least min and max are present
    if (!scaleTicks.includes(Math.round(minVal))) scaleTicks.unshift(Math.round(minVal));
    if (!scaleTicks.includes(Math.round(maxVal))) scaleTicks.push(Math.round(maxVal));
  }

  const getColor = (v) => {
    const numeric = Number.isFinite(v) ? v : minVal;
    if (maxVal === minVal) {
      // all same, return middle color
      return colorValues[Math.floor(colorValues.length / 2)];
    }
    const ratio = (numeric - minVal) / (maxVal - minVal);
    const idx = Math.min(colorValues.length - 1, Math.max(0, Math.round(ratio * (colorValues.length - 1))));
    return colorValues[idx];
  };

  // Hover / focus handlers (now data indexes are [hour][day])
  const handleCellMouseEnter = (e, v, hourIndex, dayIndex) => {
    setTooltipData({
      value: v,
      hour: `${hourIndex}:00`,
      date: format(addDays(windowStart, dayIndex), 'MMM d, yyyy'),
      clientX: e.clientX,
      clientY: e.clientY
    });
  };
  const handleCellMouseMove = (e) => {
    setTooltipData((prev) => (prev ? { ...prev, clientX: e.clientX, clientY: e.clientY } : prev));
  };
  const handleCellMouseLeave = () => setTooltipData(null);

  const handleCellFocus = (e, v, hourIndex, dayIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipData({
      value: v,
      hour: `${hourIndex}:00`,
      date: format(addDays(windowStart, dayIndex), 'MMM d, yyyy'),
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
  };
  const handleCellBlur = () => setTooltipData(null);

  const formatAgo = (ts) => {
    if (!ts) return 'unknown';
    const diff = Date.now() - ts;
    const mins = Math.round(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="font-sans" ref={containerRef}>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 w-full relative">
        {/* Offline banner */}
        {isOffline ? (
          <div className="absolute -top-3 left-3 right-3 bg-amber-500 text-white text-xs rounded-md px-3 py-1 shadow z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a1 1 0 00-.894.553L7 6H3a1 1 0 000 2h3l1.382 3.445A2 2 0 009 14h2a2 2 0 001.618-1.555L14 8h3a1 1 0 100-2h-4l-2.106-4.447A1 1 0 0010 2z" />
              </svg>
              <span>Offline — showing cached data if available</span>
            </div>
            <div className="text-[11px] opacity-90">
              {cacheMeta && cacheMeta.ts ? `Cached: ${format(new Date(cacheMeta.ts), 'PPP p')} (${formatAgo(cacheMeta.ts)})` : 'No cache'}
            </div>
          </div>
        ) : null
        }

        <div className="flex items-center mb-3 justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Heat Map</h2>
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : error ? `Error: ${error}` : ``}
          </div>
        </div>

        <div className="flex mb-2">
          {/* Y Axis: Hours */}
          <div className=" flex flex-col items-end">
            {Array.from({ length: numHours }).map((_, h) => (
              <div
                key={h}
                className="text-[11px] text-gray-600 flex items-center"
                style={{ height: cellHeight, width: 40 }}
              >
                {`${h}:00`}
              </div>
            ))}
          </div>

          {/* Heatmap (scrollable horizontally if needed) */}
          <div className="flex-1 overflow-x-auto" ref={heatmapRef}>
            <div
              className="mb-2"
              style={{ minWidth: numDays * cellWidth }}
            >
              <div className="flex">
                {/* build rows for each hour */}
                <div className="flex flex-col">
                  {data.map((row, hourIdx) => (
                    <div key={hourIdx} className="flex">
                      {row.map((v, dayIdx) => (
                        <button
                          key={`${hourIdx}-${dayIdx}`}
                          onMouseEnter={(e) => handleCellMouseEnter(e, v, hourIdx, dayIdx)}
                          onMouseMove={handleCellMouseMove}
                          onMouseLeave={handleCellMouseLeave}
                          onFocus={(e) => handleCellFocus(e, v, hourIdx, dayIdx)}
                          onBlur={handleCellBlur}
                          aria-label={`Consumption ${v} kWh on ${format(addDays(windowStart, dayIdx), 'MMM d')} at ${hourIdx}:00`}
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
              </div>

              {/* X Axis: Dates */}
              <div className="flex items-center mt-2">
                {Array.from({ length: numDays }).map((_, d) => (
                  <div
                    key={d}
                    className="text-[11px] text-gray-600 text-center"
                    style={{ width: cellWidth }}
                  >
                    {format(addDays(windowStart, d), 'MMM d')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 px-0">
          <div className="text-[11px] font-semibold text-gray-600 mb-1 ml-1">Consumption (kWh)</div>
          <div className="flex h-2 rounded overflow-hidden mb-1">
            {colorValues.map((c, idx) => (
              <div key={idx} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-gray-600">
            {scaleTicks.map((v) => (
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