import { MAX_PHOTO_BYTES, MAX_PHOTO_DIMENSION } from '../constants/eventMedia'

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('invalid_image'))
    }
    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('compression_failed'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

function scaleDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const largest = Math.max(width, height)
  if (largest <= maxDimension) {
    return { width, height }
  }
  const ratio = maxDimension / largest
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

export async function compressImageFile(
  file: File,
  maxBytes: number = MAX_PHOTO_BYTES,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size <= maxBytes && file.type === 'image/jpeg') return file

  const image = await loadImage(file)
  const { width, height } = scaleDimensions(image.width, image.height, MAX_PHOTO_DIMENSION)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return file

  context.drawImage(image, 0, 0, width, height)

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  let quality = 0.9

  while (quality >= 0.5) {
    const blob = await canvasToBlob(canvas, outputType, quality)
    if (blob.size <= maxBytes) {
      const extension = outputType === 'image/png' ? 'png' : 'jpg'
      return new File([blob], replaceExtension(file.name, extension), {
        type: outputType,
        lastModified: file.lastModified,
      })
    }
    quality -= 0.1
  }

  const blob = await canvasToBlob(canvas, outputType, 0.5)
  return new File([blob], replaceExtension(file.name, outputType === 'image/png' ? 'png' : 'jpg'), {
    type: outputType,
    lastModified: file.lastModified,
  })
}

function replaceExtension(fileName: string, extension: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return `${base}.${extension}`
}
