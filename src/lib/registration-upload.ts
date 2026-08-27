import sharp from 'sharp'

export async function normalizeRegistrationImage(buffer: Buffer, extension: string) {
  const image = sharp(buffer, { failOn: 'warning', limitInputPixels: 25_000_000 })
  const metadata = await image.metadata()
  if ((metadata.pages || 1) !== 1) throw new Error('Animated images are not supported.')

  if (extension === 'jpg') return image.rotate().jpeg({ quality: 90 }).toBuffer()
  if (extension === 'png') return image.rotate().png({ compressionLevel: 9 }).toBuffer()
  if (extension === 'webp') return image.rotate().webp({ quality: 90 }).toBuffer()
  throw new Error('Unsupported image format.')
}
