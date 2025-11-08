import type { NextApiRequest, NextApiResponse } from 'next'
import { ensureWsServer } from '@/lib/neuroevolution/wsServer'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureWsServer(res)
  res.status(200).json({ ok: true, ws: true })
}

