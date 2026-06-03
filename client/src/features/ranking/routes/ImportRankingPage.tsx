import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { fetchSeriesList, type Series } from "@/features/series/api/series";
import { importRankings } from "../api/ranking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  Info
} from "lucide-react";

type ImportRow = {
  seriesId: string;
  voteCount: string;
  readerScore: string;
};

export function ImportRankingPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [period, setPeriod] = useState("2026-W22");
  const [rows, setRows] = useState<ImportRow[]>([{ seriesId: "", voteCount: "", readerScore: "" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSeries() {
      try {
        setIsLoading(true);
        const token = await getToken({ template: "mangaflow" });
        if (!token) throw new Error("Not authenticated");
        const list = await fetchSeriesList(token);
        setSeriesList(list);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load series for selection");
      } finally {
        setIsLoading(false);
      }
    }
    loadSeries();
  }, [getToken]);

  const handleAddRow = () => {
    setRows([...rows, { seriesId: "", voteCount: "", readerScore: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof ImportRow, value: string) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate period
    if (!/^\d{4}-W\d{2}$/.test(period)) {
      setError("Period must be in YYYY-Www format (e.g. 2026-W22)");
      return;
    }

    if (rows.length === 0) {
      setError("At least one series score row must be specified");
      return;
    }

    // Process and validate rows
    const items: Array<{ seriesId: string; voteCount: number; readerScore: number }> = [];
    const chosenSeries = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.seriesId) {
        setError(`Row ${i + 1}: Please select a series`);
        return;
      }
      if (chosenSeries.has(r.seriesId)) {
        setError(`Row ${i + 1}: Duplicate series selected`);
        return;
      }
      chosenSeries.add(r.seriesId);

      const votes = parseInt(r.voteCount, 10);
      if (isNaN(votes) || votes < 0) {
        setError(`Row ${i + 1}: Vote count must be a non-negative integer`);
        return;
      }

      const score = parseFloat(r.readerScore);
      if (isNaN(score) || score < 1 || score > 10) {
        setError(`Row ${i + 1}: Reader score must be a number between 1.0 and 10.0`);
        return;
      }

      items.push({
        seriesId: r.seriesId,
        voteCount: votes,
        readerScore: score
      });
    }

    try {
      setIsSaving(true);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      await importRankings(token, period, items);
      navigate("/app/board/ranking");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to import and calculate rankings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
          <Loader2 className="size-8 animate-spin text-indigo-500" />
          <span>Loading Series List...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/30 py-10 px-6 sm:px-12 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="max-w-4xl mx-auto flex items-center gap-4 relative z-10">
          <Link to="/app/board/ranking">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white border-slate-800">
              <ChevronLeft className="size-4" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">
                Score Import Panel
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Import Period Scores
            </h1>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 sm:px-12">
        {error && (
          <div className="bg-red-950/50 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Period Details */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Info className="size-5 text-indigo-400" /> General Information
            </h2>
            <div className="flex flex-col gap-1.5 max-w-sm">
              <label htmlFor="period-input" className="text-xs font-semibold text-slate-400">Target Period</label>
              <input
                id="period-input"
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. 2026-W22"
                required
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500">Must follow ISO week pattern `YYYY-Www`.</span>
            </div>
          </section>

          {/* Series Multi-row Input */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Scores Log</h2>
                <p className="text-xs text-slate-400">Input vote metrics and reader feedback</p>
              </div>
              <Button
                type="button"
                onClick={handleAddRow}
                variant="outline"
                size="sm"
                className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-950/50"
              >
                <Plus className="mr-1 size-4" /> Add Row
              </Button>
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-3 p-4 border border-slate-800 bg-slate-950/30 rounded-xl items-end sm:items-center relative"
                >
                  {/* Dropdown for Series */}
                  <div className="flex-1 flex flex-col gap-1 w-full">
                    <span className="text-[10px] font-semibold text-slate-500">Series</span>
                    <select
                      value={row.seriesId}
                      onChange={(e) => handleRowChange(index, "seriesId", e.target.value)}
                      required
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
                    >
                      <option value="">Select a Series...</option>
                      {seriesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vote Count */}
                  <div className="w-full sm:w-32 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-500">Vote Count</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 1000"
                      value={row.voteCount}
                      onChange={(e) => handleRowChange(index, "voteCount", e.target.value)}
                      required
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
                    />
                  </div>

                  {/* Reader Score */}
                  <div className="w-full sm:w-32 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-500">Reader Score (1-10)</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      placeholder="e.g. 8.5"
                      value={row.readerScore}
                      onChange={(e) => handleRowChange(index, "readerScore", e.target.value)}
                      required
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
                    />
                  </div>

                  {/* Remove row button */}
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveRow(index)}
                      className="text-rose-400 hover:bg-rose-950/20 border-slate-800 px-3 h-10 w-full sm:w-auto"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Link to="/app/board/ranking">
              <Button type="button" variant="outline" className="border-slate-850 hover:bg-slate-900/50">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Save className="size-4" /> Calculate & Save
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
