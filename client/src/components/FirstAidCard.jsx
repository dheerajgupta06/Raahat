import { AlertTriangle, HeartPulse } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PROBLEM_BY_ID } from '../lib/problems.js';

export function FirstAidCard({ problemId }) {
  const { t, lang } = useApp();
  const problem = PROBLEM_BY_ID[problemId] || PROBLEM_BY_ID.other;
  const steps = problem.firstAid[lang] || problem.firstAid.en;

  return (
    <aside id="first-aid" className="panel relative overflow-hidden p-5 sm:p-6">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-brand/10 blur-2xl" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
          <HeartPulse size={20} />
        </span>
        <div>
          <p className="label-xs">{t('firstAid.title')}</p>
          <h3 className="mt-1 text-lg font-bold text-body">
            {t('firstAid.for', { problem: problem.label[lang] })}
          </h3>
        </div>
      </div>

      <ol className="mt-4 space-y-2.5">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-muted">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-elevated text-[10px] font-bold text-accent">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2.5 text-[11px] leading-relaxed text-warn">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        {t('firstAid.warning')}
      </p>
    </aside>
  );
}
