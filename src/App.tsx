import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ZooHistoryPoint {
  ts: number;
  timeLabel: string;
  satisfaction: number;
  revenue: number;
}

export interface ZooAnalyticsSnapshot {
  isOpen: boolean;
  zooLevel: number;
  levelTitle: string;
  nextLevelReq: {
    level: number;
    title: string;
    reqVisitors: number;
    reqSatisfaction: number;
    unlocksText: string;
  } | null;
  satisfaction: number;
  cleanliness: number;
  money: number;
  totalRevenue: number;
  totalVisitorsServed: number;
  currentVisitors: number;
  animalCount: number;
  hungryAnimals: number;
  history: ZooHistoryPoint[];
}

declare global {
  interface Window {
    __ZOO_ANALYTICS__?: {
      getSnapshot: () => ZooAnalyticsSnapshot;
      subscribe: (listener: (snap: ZooAnalyticsSnapshot) => void) => () => void;
      setOpen: (open: boolean) => void;
    };
  }
}

export default function App() {
  const [snapshot, setSnapshot] = useState<ZooAnalyticsSnapshot | null>(() =>
    window.__ZOO_ANALYTICS__ ? window.__ZOO_ANALYTICS__.getSnapshot() : null
  );

  useEffect(() => {
    const connect = () => {
      if (!window.__ZOO_ANALYTICS__) return false;
      setSnapshot(window.__ZOO_ANALYTICS__.getSnapshot());
      return window.__ZOO_ANALYTICS__.subscribe((next) => {
        setSnapshot({ ...next, history: [...next.history] });
      });
    };

    const unsub = connect();
    if (typeof unsub === 'function') return unsub;

    const timer = window.setInterval(() => {
      const cleanup = connect();
      if (typeof cleanup === 'function') {
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  if (!snapshot || !snapshot.isOpen) {
    return null;
  }

  const tenMinRevenue = snapshot.history.reduce((sum, pt) => sum + pt.revenue, 0);
  const avgSatisfaction =
    snapshot.history.length > 0
      ? Math.round(
          snapshot.history.reduce((sum, pt) => sum + pt.satisfaction, 0) /
            snapshot.history.length
        )
      : Math.round(snapshot.satisfaction);

  let strategyHint = '營運穩定！持續擴建棲息地與餐飲攤位吸引更多遊客衝刺園區等級。';
  if (snapshot.hungryAnimals > 0) {
    strategyHint = `注意：目前有 ${snapshot.hungryAnimals} 隻動物飢餓中，建議放入動物飼料或雇用餵食人員！`;
  } else if (snapshot.cleanliness < 75) {
    strategyHint = '注意：園區整潔度下降，建議在商店附近設置垃圾桶或雇用清潔人員！';
  } else if (snapshot.animalCount === 0) {
    strategyHint = '建議先用圍欄圍出封閉棲息地並放入動物，即可開始穩定賺取門票與觀賞收益。';
  } else if (snapshot.nextLevelReq) {
    const needV = Math.max(0, snapshot.nextLevelReq.reqVisitors - snapshot.totalVisitorsServed);
    const needS = Math.max(0, Math.round(snapshot.nextLevelReq.reqSatisfaction - snapshot.satisfaction));
    strategyHint = `距離 Lv.${snapshot.nextLevelReq.level}（解鎖 ${snapshot.nextLevelReq.unlocksText}）還差 ${needV} 位累計遊客、滿意度再提升 ${needS}%！`;
  } else {
    strategyHint = '已達成傳奇滿級！所有稀有動物與高階設施皆已解鎖。';
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 pointer-events-auto">
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#10171ef2] p-5 text-slate-100 shadow-2xl"
        role="dialog"
        aria-label="過去 10 分鐘經營趨勢圖表"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-wide text-white">
              📊 過去 10 分鐘經營趨勢（滿意度 & 營收）
            </h2>
            <p className="text-xs text-slate-300">
              每 10 秒自動採樣滾動記錄最近 10 分鐘波動，協助園長即時微調園區設施與管理策略
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.__ZOO_ANALYTICS__?.setOpen(false)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 cursor-pointer"
          >
            ✕ 關閉圖表
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] text-slate-400">10 分鐘區間總營收</div>
            <div className="text-base font-extrabold text-amber-300 tabular-nums">
              ${tenMinRevenue.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] text-slate-400">10 分鐘平均滿意度</div>
            <div className="text-base font-extrabold text-pink-300 tabular-nums">
              {avgSatisfaction}%
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] text-slate-400">累計入園遊客總數</div>
            <div className="text-base font-extrabold text-cyan-300 tabular-nums">
              {snapshot.totalVisitorsServed} 位（場內 {snapshot.currentVisitors}）
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] text-slate-400">目前園區等級</div>
            <div className="text-base font-extrabold text-emerald-300">
              Lv.{snapshot.zooLevel} {snapshot.levelTitle}
            </div>
          </div>
        </div>

        <div className="h-64 w-full rounded-xl border border-white/10 bg-slate-950/60 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={snapshot.history}
              margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="timeLabel"
                stroke="#94a3b8"
                tick={{ fontSize: 11, fill: '#cbd5e1' }}
                minTickGap={18}
              />
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                stroke="#ff80ab"
                tick={{ fontSize: 11, fill: '#ff80ab' }}
                tickFormatter={(v) => `${v}%`}
                width={44}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#ffd54f"
                tick={{ fontSize: 11, fill: '#ffd54f' }}
                tickFormatter={(v) => `$${v}`}
                width={52}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
                formatter={(value, name) => {
                  if (String(name).includes('滿意度')) return [`${value}%`, name];
                  return [`$${value}`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="satisfaction"
                name="遊客滿意度 (%)"
                stroke="#ff80ab"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#ff80ab' }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name="區間營收 ($)"
                stroke="#ffd54f"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#ffd54f' }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-100">
          💡 經營建議：{strategyHint}
        </div>
      </div>
    </div>
  );
}
