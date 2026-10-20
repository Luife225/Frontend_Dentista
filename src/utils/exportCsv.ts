/** Escapa delimitadores y neutraliza fórmulas al abrir el reporte en una hoja de cálculo. */
export default function exportCsv(filename: string, rows: unknown[][]) {
  const content = rows
    .map((row) =>
      row
        .map((value) => {
          let text = String(value ?? "")
          if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`
          return `"${text.replace(/"/g, '""')}"`
        })
        .join(";"),
    )
    .join("\r\n")
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
  )
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
