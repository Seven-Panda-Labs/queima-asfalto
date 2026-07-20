import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'

export function buildEventMediaStoragePath(
  userId: string,
  eventId: string,
  mediaId: string,
  extension: string,
): string {
  return `users/${userId}/events/${eventId}/media/${mediaId}.${extension}`
}

export function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/heic':
    case 'image/heif':
      return 'heic'
    case 'video/mp4':
      return 'mp4'
    case 'video/quicktime':
      return 'mov'
    case 'video/webm':
      return 'webm'
    default:
      return 'bin'
  }
}

export async function uploadEventMediaFile(
  storagePath: string,
  file: File,
): Promise<string> {
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file, { contentType: file.type })
  return getDownloadURL(storageRef)
}

export async function deleteEventMediaFile(storagePath: string): Promise<void> {
  await deleteObject(ref(storage, storagePath))
}
