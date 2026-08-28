import sharp from 'sharp'
import { MAX_REGISTRATION_FILE_SIZE } from '@/lib/registration-shared'

export class NormalizedImageTooLargeError extends Error {
  constructor() {
    super('Normalized image exceeds the registration file-size limit.')
    this.name = 'NormalizedImageTooLargeError'
  }
}

export async function normalizeRegistrationImage(buffer: Buffer, extension: string) {
  const image = sharp(buffer, { failOn: 'warning', limitInputPixels: 25_000_000 })
  const metadata = await image.metadata()
  if ((metadata.pages || 1) !== 1) throw new Error('Animated images are not supported.')

  let normalizedBuffer: Buffer
  if (extension === 'jpg') normalizedBuffer = await image.rotate().jpeg({ quality: 90 }).toBuffer()
  else if (extension === 'png') normalizedBuffer = await image.rotate().png({ compressionLevel: 9 }).toBuffer()
  else if (extension === 'webp') normalizedBuffer = await image.rotate().webp({ quality: 90 }).toBuffer()
  else throw new Error('Unsupported image format.')

  if (normalizedBuffer.length > MAX_REGISTRATION_FILE_SIZE) {
    throw new NormalizedImageTooLargeError()
  }
  return normalizedBuffer
}
