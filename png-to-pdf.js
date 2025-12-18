// PNG to PDF Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initPNGToPDFConverter() {
    const dropZone = document.getElementById("pngToPdfDropZone")
    const fileInput = document.getElementById("pngToPdfFileInput")
    const convertBtn = document.getElementById("pngToPdfConvertBtn")
    const previewContainer = document.getElementById("previewContainer")

    if (!dropZone || !fileInput || !convertBtn) return

    dropZone.addEventListener("click", () => fileInput.click())

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-red)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle())

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "image/png")
      handleFileSelection(files)
    })

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    convertBtn.addEventListener("click", () => handlePNGtoPDFConversion())
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid PNG files", "error")
      return
    }
    // Append to existing selection
    selectedFiles = [...selectedFiles, ...files]
    updateDropZoneUI()
    displayFilesPreviews()
  }

  function updateDropZoneUI() {
    const dropZone = document.getElementById("pngToPdfDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} PNG${selectedFiles.length > 1 ? "s" : ""} added`
      dropZone.style.borderColor = "var(--color-blue)"
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

  async function handlePNGtoPDFConversion() {
    if (selectedFiles.length === 0) return
    
    const { jsPDF } = window.jspdf
    if (!jsPDF) {
      showNotification("Library Error: jsPDF not found.", "error")
      return
    }

    const convertBtn = document.getElementById("pngToPdfConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "BUILDING PDF..."
    convertBtn.disabled = true

    try {
      const doc = new jsPDF()
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const imgData = await readFileAsDataURL(file)
        
        // Load image to get actual dimensions
        const img = new Image()
        img.src = imgData
        await new Promise(resolve => img.onload = resolve)
        
        const imgWidth = img.width
        const imgHeight = img.height
        
        // A4 Paper Dimensions
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        
        // Calculate scaling
        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)
        const finalWidth = imgWidth * ratio
        const finalHeight = imgHeight * ratio
        
        // Center image on page
        const x = (pageWidth - finalWidth) / 2
        const y = (pageHeight - finalHeight) / 2

        if (i > 0) doc.addPage()
        // Embedding PNG format
        doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
      }

      doc.save("converted-png-collection.pdf")
      showNotification("PDF Created!", "success")
      setTimeout(resetConverter, 1500)
    } catch (err) {
      console.error(err)
      showNotification("Conversion Error.", "error")
    }

    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("pngToPdfFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#pngToPdfDropZone .drop-text").textContent = "Drop PNG files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("pngToPdfDropZone")
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

  document.addEventListener("DOMContentLoaded", initPNGToPDFConverter)
})()
