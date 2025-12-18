// PDF to PPT (PPTX) Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initPDFToPPTConverter() {
    const dropZone = document.getElementById("pdfDropZone")
    const fileInput = document.getElementById("pdfFileInput")
    const convertBtn = document.getElementById("pdfConvertBtn")

    if (!dropZone || !fileInput || !convertBtn) return

    dropZone.addEventListener("click", () => fileInput.click())

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-orange)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle())

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf"
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
      showNotification("Please select valid PDF files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("pdfDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} PDF file${selectedFiles.length > 1 ? "s" : ""} added`
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
          <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
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

    const convertBtn = document.getElementById("pdfConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "RENDERING SLIDES..."
    convertBtn.disabled = true

    for (const file of selectedFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        
        const pptx = new PptxGenJS()
        pptx.title = file.name.replace(/\.pdf$/i, "")
        
        // Loop through each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2.0 }) // High res
          
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({ canvasContext: context, viewport: viewport }).promise
          
          const imgData = canvas.toDataURL('image/png')
          const slide = pptx.addSlide()
          
          // Fill slide with the page image
          slide.addImage({ 
            data: imgData, 
            x: 0, 
            y: 0, 
            w: '100%', 
            h: '100%' 
          })
        }

        await pptx.writeFile({ fileName: file.name.replace(/\.pdf$/i, ".pptx") })
        
      } catch (err) {
        console.error("PDF to PPT conversion failed:", err)
        showNotification(`Could not process ${file.name}`, "error")
      }
    }

    showNotification("Conversion complete!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("pdfFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#pdfDropZone .drop-text").textContent = "Drop PDF files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("pdfDropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    }
  }

  document.addEventListener("DOMContentLoaded", initPDFToPPTConverter)
})()
