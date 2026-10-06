import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import type { ActivityFileFormat } from '../domain/activityTrack'
import { eventTrackContentType } from '../utils/eventTrackPaths'
import { storage } from './firebase'

export async function uploadEventTrackFile(
  storagePath: string,
  file: File,
  format: ActivityFileFormat,
): Promise<string> {
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file, { contentType: eventTrackContentType(format) })
  return getDownloadURL(storageRef)
}

export async function deleteEventTrackFile(storagePath: string): Promise<void> {
  await deleteObject(ref(storage, storagePath))
}
