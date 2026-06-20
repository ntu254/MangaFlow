import { useRef, useState } from "react";
import {
  detect,
  whiten,
  process,
  getAiBaseUrl,
  setAiBaseUrl,
  ping,
  type Bubble,
} from "../api/bubble-service";
import { Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/layouts/AppShell";
import { Dropzone } from "./Dropzone";

type Mode = "detect" | "whiten" | "process";

export function BubbleStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [mode, setMode] = useState<Mode>("process");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [baseUrl, setBase] = useState(getAiBaseUrl());
  const [serviceOk, setServiceOk] = useState<boolean | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const onFile = (f: File) => {
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setBubbles([]);
    setErr(null);
  };

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setErr(null);
    setResultUrl(null);
    setBubbles([]);
    try {
      if (mode === "detect") {
        const r = await detect(file);
        setBubbles(r.bubbles);
      } else if (mode === "whiten") {
        const url = await whiten(file);
        setResultUrl(url);
      } else {
        const r = await process(file);
        setBubbles(r.bubbles);
        setResultUrl(`data:${r.image_mime_type};base64,${r.image_base64}`);
      }
    } catch (e: any) {
      setErr(
        e?.message ||
          "Request failed — likely CORS or service down. Start AI service at " + baseUrl + ".",
      );
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    setServiceOk(null);
    setServiceOk(await ping());
  };

  return (
    <div>
      <PageHeader
        title="AI Bubble Studio"
        jp="吹き出し検出"
        description="Detect, whiten or fully process speech bubbles on a manuscript page."
        actions={<Sparkles className="h-4 w-4 text-foreground/55" />}
      />

      {/* Service config bar */}
      <div className="mb-4 rounded-md border border-foreground/10 bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[12px] text-foreground/65">AI base URL</label>
          <input
            value={baseUrl}
            onChange={(e) => setBase(e.target.value)}
            className="h-8 w-72 rounded-md border border-foreground/15 bg-foreground/5 px-2 text-[12px] outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => setAiBaseUrl(baseUrl)}
            className="h-8 rounded-md border border-foreground/15 px-3 text-[12px] hover:bg-foreground/5"
          >
            Save
          </button>
          <button
            onClick={test}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-foreground/15 px-3 text-[12px] hover:bg-foreground/5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Test
          </button>
          {serviceOk === true && (
            <span className="text-[12px] text-emerald-600 dark:text-emerald-400">● reachable</span>
          )}
          {serviceOk === false && (
            <span className="text-[12px] text-destructive">
              ● not reachable (check CORS / start service)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Workspace */}
        <section className="rounded-md border border-foreground/10 bg-card p-4">
          {!originalUrl ? (
            <Dropzone onFile={onFile} />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["detect", "whiten", "process"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-md px-3 py-1.5 text-[12px] ${
                      mode === m
                        ? "bg-primary text-primary-foreground"
                        : "border border-foreground/15 hover:bg-foreground/5"
                    }`}
                  >
                    {m === "detect" ? "Detect" : m === "whiten" ? "Whiten" : "Process (full)"}
                  </button>
                ))}
                <button
                  onClick={run}
                  disabled={loading}
                  className="ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Run
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setOriginalUrl(null);
                    setResultUrl(null);
                    setBubbles([]);
                  }}
                  className="rounded-md border border-foreground/15 px-3 py-1.5 text-[12px] hover:bg-foreground/5"
                >
                  Reset
                </button>
              </div>

              {err && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-[12px] text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>{err}</div>
                </div>
              )}

              <div className="relative inline-block max-w-full overflow-hidden rounded-md border border-foreground/10 bg-background">
                <img
                  ref={imgRef}
                  src={resultUrl || originalUrl}
                  alt="manuscript"
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    setImgSize({ w: el.naturalWidth, h: el.naturalHeight });
                  }}
                  className="block max-h-[70vh] w-auto"
                />
                {bubbles.length > 0 && imgRef.current && (
                  <svg
                    viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  >
                    {bubbles.map((b) => (
                      <g key={b.id}>
                        <rect
                          x={b.bbox.x}
                          y={b.bbox.y}
                          width={b.bbox.width}
                          height={b.bbox.height}
                          fill="none"
                          stroke="#0B1F3A"
                          strokeWidth={3}
                        />
                        <rect
                          x={b.bbox.x}
                          y={b.bbox.y - 22}
                          width={42}
                          height={20}
                          fill="#0B1F3A"
                        />
                        <text x={b.bbox.x + 6} y={b.bbox.y - 7} fill="#F5EFE6" fontSize="14">
                          #{b.id}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Side panel */}
        <aside className="rounded-md border border-foreground/10 bg-card">
          <header className="border-b border-foreground/10 px-4 py-2.5 text-[12px] font-semibold">
            Detected bubbles{" "}
            {bubbles.length > 0 && <span className="text-foreground/55">· {bubbles.length}</span>}
          </header>
          <div className="max-h-[65vh] divide-y divide-foreground/5 overflow-y-auto">
            {bubbles.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-foreground/55">
                Upload a page and run Detect or Process.
              </div>
            ) : (
              bubbles.map((b) => (
                <div key={b.id} className="px-4 py-2.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">#{b.id}</span>
                    <span className="text-foreground/55 tabular-nums">
                      {(b.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-foreground/55 tabular-nums">
                    ({Math.round(b.bbox.x)}, {Math.round(b.bbox.y)}) · {Math.round(b.bbox.width)}×
                    {Math.round(b.bbox.height)}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
