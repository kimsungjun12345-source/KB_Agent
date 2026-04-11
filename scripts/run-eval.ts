import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { evaluateSession, SessionEval } from '../lib/evaluator';

const LOGS_DIR = join(process.cwd(), 'data', 'logs');

function main() {
  const files = readdirSync(LOGS_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('data/logs/ 에 세션 로그가 없습니다.');
    process.exit(0);
  }

  console.log(`\n📊 ${files.length}개 세션 평가 시작\n${'─'.repeat(60)}`);

  const results: SessionEval[] = [];

  for (const file of files) {
    const log = JSON.parse(readFileSync(join(LOGS_DIR, file), 'utf-8'));
    const result = evaluateSession(log);
    results.push(result);

    const scoreColor = result.score >= 80 ? '🟢' : result.score >= 50 ? '🟡' : '🔴';
    console.log(`\n${scoreColor} [${result.score}점] ${file}`);
    console.log(`   Stage: ${result.finalStage} | 메시지: ${result.messageCount}개`);

    if (result.issues.length === 0) {
      console.log('   ✅ 이슈 없음');
    } else {
      for (const issue of result.issues) {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️';
        const idx = issue.messageIndex !== undefined ? ` (msg #${issue.messageIndex})` : '';
        console.log(`   ${icon} [${issue.rule}] ${issue.message}${idx}`);
      }
    }
  }

  // 요약
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
  const criticals = results.reduce((s, r) => s + r.issues.filter(i => i.severity === 'critical').length, 0);
  const warnings = results.reduce((s, r) => s + r.issues.filter(i => i.severity === 'warning').length, 0);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📈 평균 점수: ${avg.toFixed(1)}점`);
  console.log(`   Critical: ${criticals}개 | Warning: ${warnings}개`);
  console.log(`   세션 수: ${results.length}개\n`);
}

main();
