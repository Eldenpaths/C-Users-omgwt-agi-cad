// src/app/api/sentinel/route.js
import { runChecksumSentinel } from '@/../functions/checksumSentinel.js'

/**
 * POST — triggers the Checksum Sentinel integrity sweep
 */
export async function POST() {
  try {
    await runChecksumSentinel()
    return Response.json({ status: 'ok', message: 'Sentinel sweep completed successfully.' })
  } catch (e) {
    console.error('[Sentinel API Error]', e)
    return Response.json(
      { status: 'error', message: e.message || 'Unknown error during Sentinel run.' },
      { status: 500 }
    )
  }
}

/**
 * GET — simple status check (for browser or monitoring tools)
 */
export async function GET() {
  return Response.json({ status: 'ready', message: 'Sentinel API live and awaiting POST calls.' })
}