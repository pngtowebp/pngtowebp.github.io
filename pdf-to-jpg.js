// PDF to JPG Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []
  
  // Set worker source for PDF.js
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  }

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initPDFConverter() {
    const dropZone = document.getElementById("pdfDropZone")
    const fileInput = document.getElementById("pdfFileInput")
    const convertBtn = document.getElementById("pdfConvertBtn")
    const previewContainer = document.getElementById("previewContainer")

    if (!dropZone || !fileInput || !convertBtn) return

    dropZone.addEventListener("click", () => fileInput.click())

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-blue)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle())

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf")
      handleFileSelection(files)
    })

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    convertBtn.addEventListener("click", () => handlePDFtoJPGConversion())
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid PDF files", "error")
      return
    }
    selectedFiles = files
    updateDropZoneUI()
    displayFilesPreviews()
  }

  function updateDropZoneUI() {
    const dropZone = document.getElementById("pdfDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} PDF file${selectedFiles.length > 1 ? "s" : ""} selected`
      dropZone.style.borderColor = "var(--color-red)"
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
          <span class="file-size">${formatFileSize(file.size)}</span>
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
      updateDropZoneUI()
      displayFilesPreviews()
    }
  }

  async function handlePDFtoJPGConversion() {
    if (selectedFiles.length === 0) return
    if (typeof pdfjsLib === "undefined") {
      showNotification("PDF Library not loaded.", "error")
      return
    }

    const convertBtn = document.getElementById("pdfConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "CONVERTING PAGES..."
    convertBtn.disabled = true

    for (const file of selectedFiles) {
      try {
        await convertPDFFile(file)
      } catch (err) {
        console.error("Conversion failed for " + file.name, err)
        showNotification(`Error converting ${file.name}`, "error")
      }
    }

    showNotification("Conversion Complete!", "success")
    setTimeout(resetConverter, 1500)
    
    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  async function convertPDFFile(file) {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    const numPages = pdf.numPages
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      
      // Use high scale for better quality
      const scale = 2.0 
      const viewport = page.getViewport({ scale })
      
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
      
      // Convert to JPG
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      
      // Filename handling for multi-page
      const fileNameBase = file.name.replace(/\.pdf$/i, "")
      a.download = `${fileNameBase}-page-${pageNum}.jpg`
      a.href = url
      a.click()
      
      URL.revokeObjectURL(url)
    }
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

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + ["Bytes", "KB", "MB", "GB"][i]
  }

  document.addEventListener("DOMContentLoaded", initPDFConverter)
})()
