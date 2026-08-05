import { PDFJS_GZIP_BASE64, PDFJS_WORKER_GZIP_BASE64 } from "@/components/pdfjs-bundle"

function inlineJson(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

function urlOrigin(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return "http: https:"
  }
}

export function pdfPreviewHtml(url: string): string {
  const pdfUrl = inlineJson(url)
  const connectSource = urlOrigin(url)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; worker-src blob:; connect-src ${connectSource}; style-src 'unsafe-inline'; img-src data: blob:; font-src data:;" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; background: #121017; color: #f5eff7; font-family: system-ui, sans-serif; }
      #status { position: sticky; top: 0; z-index: 1; padding: 12px 16px; background: rgba(18, 16, 23, .94); color: #d4ccd8; text-align: center; font-size: 14px; }
      #pages { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px; }
      canvas { display: block; max-width: 100%; background: white; box-shadow: 0 3px 18px rgba(0, 0, 0, .35); }
    </style>
  </head>
  <body>
    <div id="status" role="status">Loading secure PDF…</div>
    <main id="pages" aria-label="PDF pages"></main>
    <script>
      const pdfUrl = ${pdfUrl};
      const pdfJsPayload = "${PDFJS_GZIP_BASE64}";
      const pdfJsWorkerPayload = "${PDFJS_WORKER_GZIP_BASE64}";
      const status = document.getElementById("status");
      const pages = document.getElementById("pages");

      function decodeBase64(value) {
        const binary = atob(value);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        return bytes;
      }

      async function inflate(value) {
        const compressed = decodeBase64(value);
        const decompressed = new Blob([compressed])
          .stream()
          .pipeThrough(new DecompressionStream("gzip"));
        return new Response(decompressed).text();
      }

      function reportFailure() {
        status.textContent = "The PDF preview could not be loaded.";
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage("pdf-preview-error");
        }
      }

      async function renderPdf() {
        const sources = await Promise.all([inflate(pdfJsPayload), inflate(pdfJsWorkerPayload)]);
        (0, eval)(sources[0]);
        const workerUrl = URL.createObjectURL(new Blob([sources[1]], { type: "text/javascript" }));
        globalThis.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

        const loadingTask = globalThis.pdfjsLib.getDocument({ url: pdfUrl, isEvalSupported: false });
        const pdf = await loadingTask.promise;
        const availableWidth = Math.max(280, document.documentElement.clientWidth - 24);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          status.textContent = "Rendering page " + pageNumber + " of " + pdf.numPages + "…";
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const cssScale = availableWidth / baseViewport.width;
          const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Canvas is unavailable");

          canvas.width = Math.ceil(renderViewport.width);
          canvas.height = Math.ceil(renderViewport.height);
          canvas.style.width = Math.floor(renderViewport.width / pixelRatio) + "px";
          canvas.style.height = Math.floor(renderViewport.height / pixelRatio) + "px";
          canvas.setAttribute("aria-label", "Page " + pageNumber + " of " + pdf.numPages);
          pages.appendChild(canvas);
          await page.render({ canvasContext: context, viewport: renderViewport }).promise;
          page.cleanup();
        }

        URL.revokeObjectURL(workerUrl);
        status.remove();
      }

      renderPdf().catch(reportFailure);
    </script>
  </body>
</html>`
}
