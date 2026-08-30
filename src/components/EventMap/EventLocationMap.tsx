import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { RoutePoint } from '../../domain/activityTrack'
import type { Event } from '../../types/Event'
import type { EventStatus } from '../../types/Event'
import { eventHasCoordinates } from '../../services/eventGeocoding'
import { PRIMARY_COLOR, statusDotColor } from '../StatusBadge'
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
  /** The simplified track, when the event has one. */
  route?: RoutePoint[]
  className?: string
}

/** A course fills the frame; the venue pin alone does not say where it goes. */
function FitRouteBounds({ route }: { route: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (route.length < 2) return
    map.fitBounds(L.latLngBounds(route), { padding: [24, 24] })
  }, [route, map])

  return null
}

export function LocationMap({ point, route, className = '' }: LocationMapProps) {
  const { t } = useTranslation()
  const position = [point.locationLat, point.locationLng] as [number, number]
  const line = (route ?? []).map((routePoint) => [routePoint.lat, routePoint.lon] as [number, number])

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
        {line.length > 1 ? (
          <>
            <Polyline positions={line} pathOptions={{ color: PRIMARY_COLOR, weight: 4 }} />
            <FitRouteBounds route={line} />
          </>
        ) : null}
      </MapContainer>
      <p className="border-t border-border bg-surface px-3 py-2 text-xs text-muted">
        {t('eventMap.attribution')}
      </p>
    </div>
  )
}

type EventLocationMapProps = {
  event: Event
  route?: RoutePoint[]
  className?: string
}

export function EventLocationMap({ event, route, className = '' }: EventLocationMapProps) {
  if (!eventHasCoordinates(event)) return null

  return (
    <LocationMap
      point={{
        location: event.location,
        locationLat: event.locationLat!,
        locationLng: event.locationLng!,
        status: event.status,
      }}
      route={route}
      className={className}
    />
  )
}
