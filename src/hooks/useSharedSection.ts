import {
  hasSectionAccess,
  useSharedView,
  type SharedOwnerEntry,
  type SharedSection,
} from '../contexts/SharedViewContext'

export type { SharedOwnerEntry, SharedSection }

/** The global shared view, narrowed to one section. */
export function useSharedSection(section: SharedSection) {
  const { viewedOwner } = useSharedView()
  const activeOwner =
    viewedOwner && hasSectionAccess(viewedOwner.permissions, section) ? viewedOwner : null

  return {
    activeOwner: activeOwner ?? undefined,
    activeOwnerId: activeOwner?.ownerId ?? null,
    isSharedView: activeOwner !== null,
  }
}
