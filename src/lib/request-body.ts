export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('Request body exceeds the allowed size.')
    this.name = 'RequestBodyTooLargeError'
  }
}

export async function readRequestBody(request: Request, maxBytes: number) {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBytes)) {
    throw new RequestBodyTooLargeError()
  }

  if (!request.body) return Buffer.alloc(0)

  const reader = request.body.getReader()
  const chunks: Buffer[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined)
        throw new RequestBodyTooLargeError()
      }
      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }

  return Buffer.concat(chunks, totalBytes)
}

export async function readJsonWithLimit<T>(request: Request, maxBytes: number): Promise<T> {
  const body = await readRequestBody(request, maxBytes)
  return JSON.parse(body.toString('utf8')) as T
}

export async function readFormDataWithLimit(request: Request, maxBytes: number) {
  const contentType = request.headers.get('content-type') || ''
  const body = await readRequestBody(request, maxBytes)
  return new Response(body, { headers: { 'Content-Type': contentType } }).formData()
}
