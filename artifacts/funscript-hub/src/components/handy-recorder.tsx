import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Circle,
  Square,
  Play,
  Upload,
  Download,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";

export interface FunscriptData {
  version: string;
  inverted?: boolean;
  range?: number;
  actions: Array<{ at: number; pos: number }>;
}

interface HandyRecorderProps {
  onScriptReady: (data: FunscriptData | null) => void;
  initialData?: FunscriptData | null;
}

type ConnectState = "disconnected" | "connecting" | "connected";
type RecordState = "idle" | "recording";
type PlayState = "idle" | "playing";

declare global {
  interface Window {
    Handy: { init: () => HandyDevice };
  }
}

interface HandyDevice {
  connect: (key: string) => Promise<void>;
  hdsp: (pos: number, speed: number, a: number, b: number, c: boolean) => Promise<void>;
}

export function HandyRecorder({ onScriptReady, initialData }: HandyRecorderProps) {
  const [connectionKey, setConnectionKey] = useState("Tfm27yxK");
  const [connectState, setConnectState] = useState<ConnectState>("disconnected");
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [loop, setLoop] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [actions, setActions] = useState<Array<{ at: number; pos: number }>>(
    initialData?.actions ?? []
  );
  const [recordStatus, setRecordStatus] = useState(
    initialData ? `Loaded — ${initialData.actions.length} points` : "No recording"
  );
  const [playStatus, setPlayStatus] = useState(
    initialData ? "Script ready — press Play" : "No script loaded"
  );
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const handyRef = useRef<HandyDevice | null>(null);
  const recordStartRef = useRef(0);
  const lastPosRef = useRef(-1);
  const actionsRef = useRef(actions);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with state
  useEffect(() => { actionsRef.current = actions; }, [actions]);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  // Load Handy SDK
  useEffect(() => {
    if (window.Handy) { setSdkLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@ohdoki/handy-sdk@2.3.1/dist/handy.umd.js";
    script.onload = () => setSdkLoaded(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const log = useCallback((msg: string) => {
    const ts = new Date().toISOString().slice(11, 23);
    setConsoleLogs((prev) => [...prev.slice(-99), `${ts}  ${msg}`]);
  }, []);

  // Connection
  const handleConnect = async () => {
    if (!sdkLoaded) { log("SDK not loaded yet"); return; }
    setConnectState("connecting");
    try {
      const handy = window.Handy.init();
      await handy.connect(connectionKey.trim());
      handyRef.current = handy;
      setConnectState("connected");
      log("Connected to Handy");
    } catch (err) {
      setConnectState("disconnected");
      log(`Connection failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Slider → send position + record
  const sendPosition = useCallback((pos: number) => {
    setSliderValue(pos);
    if (handyRef.current) {
      handyRef.current.hdsp(pos / 100, 1, 0, 0, false).catch(() => {});
    }
    if (recordState === "recording" && pos !== lastPosRef.current) {
      const at = Date.now() - recordStartRef.current;
      lastPosRef.current = pos;
      setActions((prev) => {
        const next = [...prev, { at, pos }];
        const secs = (at / 1000).toFixed(1);
        setRecordStatus(`Recording — ${next.length} points, ${secs}s`);
        log(`rec  pos=${pos}  t=${secs}s`);
        return next;
      });
    } else if (recordState === "idle") {
      log(`pos → ${pos}`);
    }
  }, [recordState, log]);

  // Record
  const startRecording = () => {
    setActions([]);
    actionsRef.current = [];
    lastPosRef.current = -1;
    recordStartRef.current = Date.now();
    setRecordState("recording");
    setRecordStatus("Recording…");
    setPlayStatus("No script loaded");
    onScriptReady(null);
    log("Recording started");
  };

  const stopRecording = () => {
    setRecordState("idle");
    const captured = actionsRef.current;
    if (captured.length > 1) {
      const secs = (captured[captured.length - 1].at / 1000).toFixed(1);
      setRecordStatus(`Recorded — ${captured.length} points, ${secs}s`);
      setPlayStatus("Script ready — press Play");
      const data: FunscriptData = { version: "1.0", inverted: false, range: 100, actions: captured };
      onScriptReady(data);
      log("Recording stopped");
    } else {
      setActions([]);
      setRecordStatus("No points captured — try again");
      log("Recording stopped (no points)");
    }
  };

  // Playback
  const startPlayback = useCallback(() => {
    const currentActions = actionsRef.current;
    if (!currentActions.length) return;
    playingRef.current = true;
    setPlayState("playing");
    setPlayStatus(loop ? "Playing (looping)" : "Playing");
    const duration = currentActions[currentActions.length - 1].at;
    let index = 0;
    const startTime = Date.now();

    const scheduleNext = () => {
      if (!playingRef.current) return;
      if (index >= currentActions.length) {
        if (loop) { index = 0; scheduleNext(); }
        else { stopPlayback(); setPlayStatus("Finished"); }
        return;
      }
      const action = currentActions[index];
      const elapsed = Date.now() - startTime;
      const loopOffset = Math.floor(elapsed / (duration || 1)) * duration;
      const delay = Math.max(0, action.at + loopOffset - elapsed);
      playbackTimerRef.current = setTimeout(() => {
        if (!playingRef.current) return;
        if (handyRef.current) handyRef.current.hdsp(action.pos / 100, 1, 0, 0, false).catch(() => {});
        setSliderValue(action.pos);
        log(`playback → ${action.pos}  (${(action.at / 1000).toFixed(2)}s)`);
        index++;
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }, [loop, log]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    setPlayState("idle");
  }, []);

  // File import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const imported: Array<{ at: number; pos: number }> = parsed.actions || [];
        if (!imported.length) throw new Error("No actions found");
        setActions(imported);
        actionsRef.current = imported;
        const secs = (imported[imported.length - 1].at / 1000).toFixed(1);
        setRecordStatus(`Imported — ${imported.length} points, ${secs}s`);
        setPlayStatus("Script ready — press Play");
        const data: FunscriptData = {
          version: parsed.version || "1.0",
          inverted: parsed.inverted ?? false,
          range: parsed.range ?? 100,
          actions: imported,
        };
        onScriptReady(data);
        log(`Imported ${imported.length} points, ${secs}s`);
      } catch (err) {
        setRecordStatus(`Import failed: ${err instanceof Error ? err.message : "invalid file"}`);
        log("Import failed");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // File export
  const handleExport = () => {
    const data: FunscriptData = { version: "1.0", inverted: false, range: 100, actions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.funscript";
    a.click();
    URL.revokeObjectURL(url);
    log("Exported .funscript");
  };

  const hasScript = actions.length > 1;
  const isRecording = recordState === "recording";
  const isPlaying = playState === "playing";

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Handy Device Recorder</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Record movements with your Handy device or import an existing .funscript file
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {connectState === "connected" && <Badge variant="default" className="bg-green-600 text-xs gap-1"><Wifi className="w-3 h-3"/>Connected</Badge>}
            {connectState === "connecting" && <Badge variant="secondary" className="text-xs gap-1"><Loader2 className="w-3 h-3 animate-spin"/>Connecting</Badge>}
            {connectState === "disconnected" && <Badge variant="outline" className="text-xs gap-1"><WifiOff className="w-3 h-3"/>Not connected</Badge>}
            {isRecording && <Badge variant="destructive" className="text-xs animate-pulse gap-1"><Circle className="w-3 h-3 fill-current"/>REC</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Connection */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">Device Connection Key</Label>
            <Input
              value={connectionKey}
              onChange={(e) => setConnectionKey(e.target.value)}
              placeholder="e.g. Tfm27yxK"
              className="h-8 text-sm font-mono"
              disabled={connectState !== "disconnected"}
            />
          </div>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connectState !== "disconnected" || !sdkLoaded}
            variant={connectState === "connected" ? "secondary" : "default"}
          >
            {connectState === "connecting" ? <><Loader2 className="w-3 h-3 animate-spin mr-1"/>Connecting</> : "Connect"}
          </Button>
        </div>

        {/* Position slider */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Position</span>
            <span className="font-mono font-bold">{sliderValue}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderValue}
            onChange={(e) => sendPosition(Number(e.target.value))}
            className="w-full h-7 accent-primary cursor-pointer"
          />
        </div>

        {/* Console */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Console</span>
            <Button variant="ghost" size="sm" className="h-5 px-2 text-xs" onClick={() => setConsoleLogs([])}>Clear</Button>
          </div>
          <div className="h-20 overflow-y-auto bg-black/40 rounded text-xs font-mono p-2 space-y-0.5">
            {consoleLogs.length === 0 && <span className="text-muted-foreground">Ready</span>}
            {consoleLogs.map((line, i) => (
              <div key={i} className="text-green-400 leading-tight">{line}</div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>

        {/* Record controls */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1"
            onClick={startRecording}
            disabled={isRecording || isPlaying}
          >
            <Circle className="w-3 h-3 fill-current" /> Record
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 gap-1"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            <Square className="w-3 h-3 fill-current" /> Stop
          </Button>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">{recordStatus}</p>

        {/* Playback controls */}
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 mr-auto">
            <Switch id="loop" checked={loop} onCheckedChange={setLoop} />
            <Label htmlFor="loop" className="text-xs">Loop</Label>
          </div>
          <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={startPlayback} disabled={!hasScript || isRecording || isPlaying}>
            <Play className="w-3 h-3 fill-current" /> Play
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { stopPlayback(); setPlayStatus("Stopped"); }} disabled={!isPlaying}>
            <Square className="w-3 h-3 fill-current" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">{playStatus}</p>

        {/* File actions */}
        <div className="flex gap-2 pt-1 border-t">
          <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={handleExport} disabled={!hasScript}>
            <Download className="w-3 h-3" /> Export .funscript
          </Button>
          <label className="flex-1">
            <Button size="sm" variant="outline" className="w-full gap-1 text-xs" asChild>
              <span><Upload className="w-3 h-3" /> Import .funscript</span>
            </Button>
            <input type="file" accept=".funscript,.json" className="hidden" onChange={handleImport} />
          </label>
        </div>

      </CardContent>
    </Card>
  );
}
