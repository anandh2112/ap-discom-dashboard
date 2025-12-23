import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import HourlyConsumption from './Hourlyconsumption'
import Loadshift from './Loadshift'
import AvgPeakDemand from './Avgpeakdemand'
import PeakDemand from './Peakdemand'
import ConsumerInfo from './Consumerinfo'
import ConsumerTOD from './ConsumerTOD'
import ConsumerHeatmap from './Consumerheatmap'
import Consumption from './Consumption'
import Peakvariance from './Peakvariance'

export default function ConsumerDetail({ viewMode, selectedDate }) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Use the ID from URL params as the primary source
  const scno = id
  const consumerName = location.state?.short_name || `Consumer ${scno}`

  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Handle browser navigation events
  useEffect(() => {
    const handlePopState = () => {
      // Force re-render when URL changes
      window.location.reload()
    }

    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

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
      <ConsumerInfo 
        consumerName={consumerName} 
        scno={scno} 
        selectedDate={selectedDate} 
        viewMode={viewMode}  
      />

      {/* Hourly Consumption Graph */}
      <div className="mt-4">
        <HourlyConsumption scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
      </div>

      {/* Load Shift Section */}
      <div className="mt-8">
        <Loadshift scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
      </div>

      {/* Consumer Heatmap Section */}
      <div className="mt-8">
        <ConsumerHeatmap scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
      </div>

      {/* Peak Demand & TOD Section */}
      <div className="mt-8 flex gap-4 w-full">
        <div className="flex-4">
          <ConsumerTOD scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
        </div>
        <div className="flex-6">
          {/* <AvgPeakDemand scno={scno} selectedDate={selectedDate} viewMode={viewMode} /> */}
          <PeakDemand scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
        </div>
      </div>

      {/* Consumption */}
      <div className="mt-4">
        <Consumption scno={scno} selectedDate={selectedDate} viewMode={viewMode} />
      </div>

       <div className="mt-4">
        <Peakvariance scno={scno} />
      </div>
    </div>
  )
}