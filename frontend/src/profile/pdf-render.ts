// Rendu d'un PDF page par page dans des canvas, via pdf.js (chargé seulement à l'ouverture de l'aperçu).
// Un cadre <iframe> ne marche pas partout : Chrome Android n'affiche pas les PDF, Safari iOS une seule page.
export async function renderPdf(data: ArrayBuffer, container: HTMLElement, width: number): Promise<void> {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  // pdf.js 6 n'évalue jamais de code issu du PDF (plus d'eval ni de new Function dans la bibliothèque)
  const pdf = await pdfjs.getDocument({ data }).promise
  container.replaceChildren()
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    const base = page.getViewport({ scale: 1 })
    const ratio = window.devicePixelRatio || 1
    const viewport = page.getViewport({ scale: (width / base.width) * ratio })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = '100%'
    canvas.setAttribute('aria-label', `Page ${n} sur ${pdf.numPages}`)
    container.append(canvas)
    await page.render({ canvas, viewport }).promise
  }
}
