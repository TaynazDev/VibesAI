import { useEffect, useRef } from "react";

const EMPTY_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<style>
  body{margin:0;height:100vh;display:grid;place-items:center;background:#08080e;color:#334155;font-family:system-ui,sans-serif;text-align:center}
  .icon{font-size:3.5rem;margin-bottom:1.25rem;opacity:.25}
  .msg{font-size:.9rem;opacity:.4;margin:0}
  .sub{font-size:.75rem;opacity:.25;margin:.4rem 0 0}
</style>
</head>
<body>
  <div>
    <div class='icon'>◈</div>
    <p class='msg'>Live preview will appear here</p>
    <p class='sub'>Your app renders in real-time as AI builds it</p>
  </div>
</body>
</html>`;

export function LivePreview({ code }: { code: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcdoc = code || EMPTY_HTML;
    }
  }, [code]);

  return (
    <iframe
      ref={ref}
      className="live-preview-frame"
      sandbox="allow-scripts allow-forms allow-modals"
      title="App Preview"
    />
  );
}
