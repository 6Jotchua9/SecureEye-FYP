import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { readTokens } from "../../../design-system/theme.js";
import { Banner, Button, EmptyState, Page, PageHeader } from "../../../design-system/ui.jsx";
import { apiGetStats } from "../api";

const DAY_OPTIONS = [7, 30, 90];
const CHART_TOKENS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6", "--chart-grid", "--chart-axis-text", "--surface-raised", "--text-primary", "--line-hairline", "--radius-control"];

function palette() {
  return readTokens(CHART_TOKENS);
}

function series(counts, colors) {
  const keys = Object.keys(colors).filter((name) => name.startsWith("--chart-") && name !== "--chart-grid" && name !== "--chart-axis-text");
  return Object.entries(counts || {}).map(([name, value], index) => ({
    name,
    value,
    color: colors[keys[index % keys.length]] || colors["--chart-2"],
  }));
}

export default function StatsPage() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [colors, setColors] = useState(palette);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGetStats(days);
      setStats(data);
    } catch (err) {
      setError(err.message || "Could not load stats.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setColors(palette());
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    sync();
    return () => observer.disconnect();
  }, []);

  const decisionData = series(stats?.by_decision, colors);
  const labelData = series(stats?.by_sensitivity_label, colors);
  const labelMax = Math.max(1, ...labelData.map((item) => item.value));
  const tooltipStyle = {
    background: colors["--surface-raised"],
    border: `1px solid ${colors["--line-hairline"]}`,
    borderRadius: colors["--radius-control"],
    color: colors["--text-primary"],
  };

  return (
    <Page>
      <PageHeader
        kicker="Overview"
        title="Gateway stats"
        lede="Files the pipeline processed in the selected window."
        actions={
          <div className="cq-segmented" role="radiogroup" aria-label="Time window">
            {DAY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className="cq-segment"
                role="radio"
                aria-checked={days === option}
                onClick={() => setDays(option)}
              >
                {option} days
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <Banner action={<Button size="sm" onClick={load}>Try again</Button>}>
          {error}
        </Banner>
      ) : null}

      {loading ? (
        <div className="gw-stat-row" aria-busy="true">
          <p className="cq-sr-only">Loading stats</p>
          <span className="cq-skeleton gw-skel" />
          <span className="cq-skeleton gw-skel" />
          <span className="cq-skeleton gw-skel" />
        </div>
      ) : null}

      {!loading && stats ? (
        <>
          <section className="gw-stat-row" aria-label="Totals">
            <div className="cq-stat">
              <span className="cq-numeral cq-stat-value">{stats.total_files}</span>
              <span className="t-body-s">Files processed</span>
              <span className="t-caption gw-hint">Last {stats.days} days</span>
            </div>
            {Object.entries(stats.by_decision || {}).map(([status, count]) => (
              <div className="cq-stat gw-stat-quiet" key={status}>
                <span className="t-h2 gw-tabular">{count}</span>
                <span className="t-body-s">{status}</span>
              </div>
            ))}
          </section>

          <div className="gw-split">
            <section className="gw-region" aria-label="Decisions by type">
              <h2 className="t-h4">Decisions by type</h2>
              {decisionData.length === 0 ? (
                <EmptyState
                  title="No files in this window"
                  body="The first processed file will draw the first bar."
                />
              ) : (
                <div className="gw-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={decisionData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid stroke={colors["--chart-grid"]} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: colors["--chart-axis-text"], fontSize: 12 }} interval={0} />
                      <YAxis allowDecimals={false} tick={{ fill: colors["--chart-axis-text"], fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: colors["--chart-grid"] }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {decisionData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="gw-region" aria-label="Sensitivity labels">
              <h2 className="t-h4">Sensitivity labels</h2>
              {labelData.length === 0 ? (
                <p className="t-body gw-hint">No labelled files in this window.</p>
              ) : (
                <ol className="gw-rank">
                  {labelData.map((item) => (
                    <li key={item.name}>
                      <div className="gw-rank-label">
                        <span className="t-body-s">{item.name}</span>
                        <span className="t-body-s gw-tabular">{item.value}</span>
                      </div>
                      <div className="gw-rank-track">
                        <div
                          className="gw-rank-fill"
                          style={{ width: `${(item.value / labelMax) * 100}%`, background: item.color }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          {decisionData.length > 0 ? (
            <div className="cq-table-wrap">
              <table className="cq-table">
                <caption className="cq-sr-only">Decisions in the selected window</caption>
                <thead>
                  <tr>
                    <th>Decision</th>
                    <th className="cq-num">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionData.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td className="cq-num">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
