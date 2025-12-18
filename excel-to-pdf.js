// Excel to PDF Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initExcelToPDF() {
    const dropZone = document.getElementById("excelDropZone")
    const fileInput = document.getElementById("excelFileInput")
    const convertBtn = document.getElementById("excelConvertBtn")

    if (!dropZone || !fileInput || !convertBtn) return

    dropZone.addEventListener("click", () => fileInput.click())

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-green)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle())

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls")
      )
      handleFileSelection(files)
    })

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    convertBtn.addEventListener("click", () => handleConversion())
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid Excel files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("excelDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} spreadsheet${selectedFiles.length > 1 ? "s" : ""} added`
      previewContainer.classList.remove("hidden")
    }
  }

  function displayFilesPreviews() {
    const filesList = document.getElementById("filesList")
    if (!filesList) return
    filesList.innerHTML = ""

    selectedFiles.forEach((file, index) => {
      const fileItem = document.createElement("div")
      fileItem.className = "file-item"
      fileItem.innerHTML = `
        <div class="file-info">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
        </div>
        <button class="remove-file-btn" data-index="${index}">✕</button>
      `
      fileItem.querySelector(".remove-file-btn").onclick = (e) => {
        e.stopPropagation()
        removeFile(index)
      }
      filesList.appendChild(fileItem)
    })
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1)
    if (selectedFiles.length === 0) {
      resetConverter()
    } else {
      updateUI()
      displayFilesPreviews()
    }
  }

  async function handleConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("excelConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "GENERATING PDF..."
    convertBtn.disabled = true

    for (const file of selectedFiles) {
      try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Convert first sheet to HTML
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const html = XLSX.utils.sheet_to_html(worksheet)
        
        // Create hidden iframe to trigger PDF generation via print
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        
        const doc = iframe.contentWindow.document
        doc.open()
        doc.write(`
          <html>
            <head>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
                h2 { color: #333; text-align: center; }
              </style>
            </head>
            <body>
              <h2>${file.name.replace(/\.[^/.]+$/, "")}</h2>
              ${html}
            </body>
          </html>
        `)
        doc.close()

        iframe.contentWindow.onload = () => {
          iframe.contentWindow.print()
          document.body.removeChild(iframe)
        }
        
      } catch (err) {
        console.error("Excel to PDF conversion failed:", err)
        showNotification(`Could not process ${file.name}`, "error")
      }
    }

    showNotification("PDF generation ready!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("excelFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#excelDropZone .drop-text").textContent = "Drop Excel files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("excelDropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    }
  }

  document.addEventListener("DOMContentLoaded", initExcelToPDF)
})()
