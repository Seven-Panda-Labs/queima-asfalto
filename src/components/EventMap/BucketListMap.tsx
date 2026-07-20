import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { BucketListItem } from '../../types/BucketListItem'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { formatTargetMonth } from '../../utils/targetMonth'
import { PRIMARY_COLOR } from '../StatusBadge'
import { createClusterIcon, markerIcon } from './mapMarkers'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

type BucketListMapProps = {
  items: BucketListItem[]
  className?: string
}

function FitMapBounds({ items }: { items: BucketListItem[] }) {
  const map = useMap()

  useEffect(() => {
    if (items.length === 0) return

    if (items.length === 1) {
      const item = items[0]
      map.setView([item.locationLat!, item.locationLng!], 12)
      return
    }

    const bounds = L.latLngBounds(
      items.map((item) => [item.locationLat!, item.locationLng!] as [number, number]),
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
  }, [items, map])

  return null
}

export function BucketListMap({ items, className = '' }: BucketListMapProps) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        {t('bucketList.noMappedItems')}
      </p>
    )
  }

  const defaultCenter = [items[0].locationLat!, items[0].locationLng!] as [number, number]

  return (
    <div className={['isolate overflow-hidden rounded-lg border border-border', className].join(' ')}>
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
        <FitMapBounds items={items} />
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          zoomToBoundsOnClick
          spiderfyOnMaxZoom
          spiderfyDistanceMultiplier={2}
          maxClusterRadius={45}
          iconCreateFunction={createClusterIcon}
        >
          {items.map((item) => (
            <Marker
              key={item.id}
              position={[item.locationLat!, item.locationLng!]}
              icon={markerIcon(PRIMARY_COLOR)}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    {item.emoji ? `${item.emoji} ` : ''}
                    {item.name}
                  </p>
                  <p className="text-muted">
                    {item.disciplines.map((d) => formatEventTypeLabel(d)).join(', ')} ·{' '}
                    {item.realDistance} km
                  </p>
                  <p className="text-muted">{item.location}</p>
                  {item.targetMonth ? (
                    <p className="text-muted">{formatTargetMonth(item.targetMonth)}</p>
                  ) : null}
                  <Link
                    to={`/bucket-list/${item.id}/editar`}
                    className="inline-block font-semibold text-primary hover:underline"
                  >
                    {t('common.edit')}
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      <p className="border-t border-border bg-surface px-3 py-2 text-xs text-muted">
        {t('bucketList.mapClusterHint')}
      </p>
    </div>
  )
}
