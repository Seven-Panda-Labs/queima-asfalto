import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { Event } from '../../types/Event'
import { statusDotColor } from '../StatusBadge'
import { formatDatePt } from '../../utils/date'
import { eventLinkState, buildEventDetailPath } from '../../utils/eventNavigation'
import { createClusterIcon, markerIcon } from './mapMarkers'
import { EventMapLegend } from './EventMapLegend'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

type EventMapProps = {
  events: Event[]
  className?: string
  returnTo?: string
  readOnly?: boolean
  ownerId?: string | null
}

function FitMapBounds({ events }: { events: Event[] }) {
  const map = useMap()

  useEffect(() => {
    if (events.length === 0) return

    if (events.length === 1) {
      const event = events[0]
      map.setView([event.locationLat!, event.locationLng!], 12)
      return
    }

    const bounds = L.latLngBounds(
      events.map((event) => [event.locationLat!, event.locationLng!] as [number, number]),
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
  }, [events, map])

  return null
}

export function EventMap({
  events,
  className = '',
  returnTo = '/eventos',
  readOnly = false,
  ownerId = null,
}: EventMapProps) {
  const { t } = useTranslation()

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        {t('eventMap.noMappedEvents')}
      </p>
    )
  }

  const defaultCenter = [events[0].locationLat!, events[0].locationLng!] as [number, number]

  return (
    <div className={['isolate overflow-hidden rounded-lg border border-border', className].join(' ')}>
      <div className="flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1">
          <MapContainer
            center={defaultCenter}
            zoom={6}
            scrollWheelZoom
            className="h-[min(60vh,420px)] w-full lg:h-[min(72vh,560px)]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitMapBounds events={events} />
            <MarkerClusterGroup
              chunkedLoading
              showCoverageOnHover={false}
              zoomToBoundsOnClick
              spiderfyOnMaxZoom
              spiderfyDistanceMultiplier={2}
              maxClusterRadius={45}
              iconCreateFunction={createClusterIcon}
            >
              {events.map((event) => (
                <Marker
                  key={event.id}
                  position={[event.locationLat!, event.locationLng!]}
                  icon={markerIcon(statusDotColor(event.status))}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground">{event.name}</p>
                      <p className="text-muted">{formatDatePt(event.date)}</p>
                      <p className="text-muted">
                        {event.realDistance} km · {event.location}
                      </p>
                      {readOnly && !ownerId ? null : (
                        <Link
                          to={buildEventDetailPath(event.id, { ownerId, returnTo })}
                          state={eventLinkState(returnTo).state}
                          className="inline-block font-semibold text-primary hover:underline"
                        >
                          {t('common.view')}
                        </Link>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
          <p className="border-t border-border bg-surface px-3 py-2 text-xs text-muted">
            {t('eventMap.clusterHint')}
          </p>
        </div>
        <EventMapLegend />
      </div>
    </div>
  )
}
