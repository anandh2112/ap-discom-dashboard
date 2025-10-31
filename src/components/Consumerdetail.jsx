import { useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ConsumptionGraph from './Consumptiongraph'
import Loadshift from './Loadshift'
import AvgPeakDemand from './Avgpeakdemand'
import PeakDemand from './Peakdemand'
import ConsumerInfo from './Consumerinfo'
import ConsumerTOD from './ConsumerTOD'

export default function ConsumerDetail({ viewMode, selectedDate }) {
  const { id } = useParams()
  const location = useLocation()

  const scno = location.state?.scno || id
  const consumerName = location.state?.short_name || `Consumer ${scno}`

  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Prevent sidebar from resizing due to scrollbar changes
  useEffect(() => {
    document.body.style.scrollbarGutter = 'stable' // keeps layout stable
    return () => {
      document.body.style.scrollbarGutter = ''
    }
  }, [])

  return (
    <div className="p-2 overflow-y-auto min-h-screen">
      {/* Offline banner */}
      {isOffline && (
        <div className="mb-2 text-sm bg-yellow-100 border border-yellow-300 text-yellow-700 px-3 py-2 rounded-md text-center">
          You are currently offline. Showing cached data where available.
        </div>
      )}

      {/* Consumer Info Cards */}
      <ConsumerInfo consumerName={consumerName} scno={scno} selectedDate={selectedDate} viewMode={viewMode}  />

      {/* Consumption Graph */}
      <div className="mt-4">
        <ConsumptionGraph scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
      </div>

      {/* Load Shift Section */}
      <div className="mt-8">
        <Loadshift scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
      </div>

      {/* Peak Demand & TOD Section */}
      <div className="mt-8 flex gap-4">
        <div className="flex-6">
          {/* <AvgPeakDemand scno={scno} selectedDate={selectedDate} viewMode={viewMode} /> */}
          <PeakDemand scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
        </div>
        <div className="flex-4">
          <ConsumerTOD scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
        </div>
      </div>
    </div>
  )
}
