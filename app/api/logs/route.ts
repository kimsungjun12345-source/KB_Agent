import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOGS_DIR = join(process.cwd(), 'data', 'logs');

function ensureDir() {
  if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });
}

// POST: 세션 로그 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messages, finalStage } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    ensureDir();

    const log = {
      session_id: sessionId,
      saved_at: new Date().toISOString(),
      final_stage: finalStage ?? 1,
      message_count: messages.length,
      conversation: messages.map((m: any, i: number) => ({
        index: i,
        role: m.role,
        content: m.content,
        has_visualization: !!m.visualization,
        visualization_type: m.visualization?.type ?? null,
      })),
    };

    const filename = `session_${sessionId}.json`;
    writeFileSync(join(LOGS_DIR, filename), JSON.stringify(log, null, 2), 'utf-8');

    return NextResponse.json({ saved: filename });
  } catch (error) {
    console.error('Log save error:', error);
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 });
  }
}

// GET: 저장된 로그 목록
export async function GET() {
  try {
    ensureDir();
    const { readdirSync } = require('fs');
    const files: string[] = readdirSync(LOGS_DIR).filter((f: string) => f.endsWith('.json') && f !== 'eval_report.json');

    const summaries = files.map((f: string) => {
      const data = JSON.parse(readFileSync(join(LOGS_DIR, f), 'utf-8'));
      return {
        filename: f,
        session_id: data.session_id,
        saved_at: data.saved_at,
        final_stage: data.final_stage,
        message_count: data.message_count,
      };
    });

    return NextResponse.json({ logs: summaries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list logs' }, { status: 500 });
  }
}
