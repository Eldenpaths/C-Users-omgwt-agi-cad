import { NextResponse } from 'next/server'
import { analyzeLearningTrendsServer } from '@/lib/learning/analyzerServer'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') ?? undefined
    const data = await analyzeLearningTrendsServer(userId as string | undefined)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
