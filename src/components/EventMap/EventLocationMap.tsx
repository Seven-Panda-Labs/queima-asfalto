import { useTranslation } from 'react-i18next'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import type { Event } from '../../types/Event'
import type { EventStatus } from '../../types/Event'
import { eventHasCoordinates } from '../../services/eventGeocoding'
import { statusDotColor } from '../StatusBadge'
import { markerIcon } from './mapMarkers'
import 'leaflet/dist/leaflet.css'

export type LocationMapPoint = {
  location: string
  locationLat: number
  locationLng: number
  status?: EventStatus
}

type LocationMapProps = {
  point: LocationMapPoint
  className?: string
}

export function LocationMap({ point, className = '' }: LocationMapProps) {
  const { t } = useTranslation()
  const position = [point.locationLat, point.locationLng] as [number, number]

  return (
    <div className={['isolate overflow-hidden rounded-lg border border-border', className].join(' ')}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        className="h-52 w-full sm:h-64"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          icon={markerIcon(statusDotColor(point.status ?? 'planned'))}
          title={point.location}
        />
      </MapContainer>
      <p className="border-t border-border bg-surface px-3 py-2 text-xs text-muted">
        {t('eventMap.attribution')}
      </p>
    </div>
  )
}

type EventLocationMapProps = {
  event: Event
  className?: string
}

export function EventLocationMap({ event, className = '' }: EventLocationMapProps) {
  if (!eventHasCoordinates(event)) return null

  return (
    <LocationMap
      point={{
        location: event.location,
        locationLat: event.locationLat!,
        locationLng: event.locationLng!,
        status: event.status,
      }}
      className={className}
    />
  )
}
