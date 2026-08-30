import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Uploaded as XML rather than with the browser's reported type, which varies by
 * platform for these extensions and would make the Storage rule unpredictable.
 */
export async function uploadEventTrackFile(storagePath: string, file: File): Promise<string> {
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file, { contentType: 'application/xml' })
  return getDownloadURL(storageRef)
}

export async function deleteEventTrackFile(storagePath: string): Promise<void> {
  await deleteObject(ref(storage, storagePath))
}
