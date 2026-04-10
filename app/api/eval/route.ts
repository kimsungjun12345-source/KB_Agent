import { NextResponse } from 'next/server';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { evaluateSession, SessionEval } from '@/lib/evaluator';

const LOGS_DIR = join(process.cwd(), 'data', 'logs');

// GET: 전체 로그 평가 리포트
export async function GET() {
  try {
    if (!existsSync(LOGS_DIR)) {
      return NextResponse.json({ sessions: [], summary: null });
    }

    const files = readdirSync(LOGS_DIR).filter(
      (f: string) => f.startsWith('session_') && f.endsWith('.json')
    );

    const evals: SessionEval[] = [];

    for (const file of files) {
      try {
        const log = JSON.parse(readFileSync(join(LOGS_DIR, file), 'utf-8'));
        evals.push(evaluateSession(log));
      } catch {
        // 파싱 실패한 로그 스킵
      }
    }

    // 요약 통계
    const totalSessions = evals.length;
    if (totalSessions === 0) {
      return NextResponse.json({ sessions: [], summary: null });
    }

    const avgScore = Math.round(evals.reduce((s, e) => s + e.score, 0) / totalSessions);

    // 규칙별 발생 빈도
    const ruleCounts: Record<string, number> = {};
    for (const ev of evals) {
      for (const issue of ev.issues) {
        ruleCounts[issue.rule] = (ruleCounts[issue.rule] ?? 0) + 1;
      }
    }

    // 발생 빈도 내림차순 정렬
    const topIssues = Object.entries(ruleCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([rule, count]) => ({
        rule,
        count,
        rate: `${Math.round((count / totalSessions) * 100)}%`,
      }));

    const stageCompletion: Record<string, number> = {};
    for (const ev of evals) {
      const key = `stage_${ev.finalStage}`;
      stageCompletion[key] = (stageCompletion[key] ?? 0) + 1;
    }

    return NextResponse.json({
      sessions: evals.sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
      summary: {
        total_sessions: totalSessions,
        avg_score: avgScore,
        top_issues: topIssues,
        stage_completion: stageCompletion,
      },
    });
  } catch (error) {
    console.error('Eval error:', error);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
