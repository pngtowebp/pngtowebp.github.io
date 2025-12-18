// JPG to PDF Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initJPGToPDFConverter() {
    const dropZone = document.getElementById("jpgToPdfDropZone")
    const fileInput = document.getElementById("jpgToPdfFileInput")
    const convertBtn = document.getElementById("jpgToPdfConvertBtn")
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
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.type === "image/jpeg" || f.type === "image/jpg"
      )
      handleFileSelection(files)
    })

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    convertBtn.addEventListener("click", () => handleJPGtoPDFConversion())
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid JPG files", "error")
      return
    }
    // Append new files to allow multiple selections
    selectedFiles = [...selectedFiles, ...files]
    updateDropZoneUI()
    displayFilesPreviews()
  }

  function updateDropZoneUI() {
    const dropZone = document.getElementById("jpgToPdfDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} Image${selectedFiles.length > 1 ? "s" : ""} added`
      dropZone.style.borderColor = "var(--color-green)"
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

  async function handleJPGtoPDFConversion() {
    if (selectedFiles.length === 0) return
    
    const { jsPDF } = window.jspdf
    if (!jsPDF) {
      showNotification("PDF Library not loaded correctly.", "error")
      return
    }

    const convertBtn = document.getElementById("jpgToPdfConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "GENERATING PDF..."
    convertBtn.disabled = true

    try {
      const doc = new jsPDF()
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const imgData = await readFileAsDataURL(file)
        
        // Add image properties to handle sizing
        const img = new Image()
        img.src = imgData
        await new Promise(resolve => img.onload = resolve)
        
        const imgWidth = img.width
        const imgHeight = img.height
        
        // Calculate dimensions to fit in A4
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)
        const finalWidth = imgWidth * ratio
        const finalHeight = imgHeight * ratio
        
        // Center image
        const x = (pageWidth - finalWidth) / 2
        const y = (pageHeight - finalHeight) / 2

        if (i > 0) doc.addPage()
        doc.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight)
      }

      doc.save("converted-images.pdf")
      showNotification("PDF generated successfully!", "success")
      setTimeout(resetConverter, 1500)
    } catch (err) {
      console.error(err)
      showNotification("An error occurred during PDF generation.", "error")
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
    const fileInput = document.getElementById("jpgToPdfFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#jpgToPdfDropZone .drop-text").textContent = "Drop JPG files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("jpgToPdfDropZone")
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

  document.addEventListener("DOMContentLoaded", initJPGToPDFConverter)
})()
