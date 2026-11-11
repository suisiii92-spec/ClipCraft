import { useState, type ReactNode } from "react";

type Props = { src: (retry: number) => string; aspectRatio: string; overlay?: ReactNode };

export default function ServerClipPlayer({ src, aspectRatio, overlay }: Props) {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  const start = () => {
    setFailed(false);
    setReady(false);
    setStarted(true);
    setRetry((r) => r + 1);
  };

  return (
    <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl bg-black" style={{ aspectRatio }}>
      {started && !failed && (
        <video
          key={retry}
          src={src(retry)}
          controls
          autoPlay
          playsInline
          className="h-full w-full object-contain"
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 p-4 text-center">
          {started && !failed ? (
            <span className="animate-pulse text-xs font-semibold text-purple-300">Preparing clip... (20-60s)</span>
          ) : (
            <>
              {failed && <span className="text-xs text-red-400">Preview failed.</span>}
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-purple-500"
              >
                {failed ? "Retry" : "▶ Load preview"}
              </button>
            </>
          )}
        </div>
      )}
      {overlay}
    </div>
  );
}
