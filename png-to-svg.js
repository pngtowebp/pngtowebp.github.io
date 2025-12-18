// PNG to SVG Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initPNGConverter() {
    const dropZone = document.getElementById("pngDropZone")
    const fileInput = document.getElementById("pngFileInput")
    const convertBtn = document.getElementById("pngConvertBtn")
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
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "image/png")
      handleFileSelection(files)
    })

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    convertBtn.addEventListener("click", () => handlePNGtoSVGConversion())
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid PNG files", "error")
      return
    }
    selectedFiles = files
    updateDropZoneUI()
    displayFilesPreviews()
  }

  function updateDropZoneUI() {
    const dropZone = document.getElementById("pngDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} PNG file${selectedFiles.length > 1 ? "s" : ""} ready`
      dropZone.style.borderColor = "var(--color-purple)"
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

  async function handlePNGtoSVGConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("pngConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "CONVERTING..."
    convertBtn.disabled = true

    let successCount = 0
    
    for (const file of selectedFiles) {
      try {
        await convertFile(file)
        successCount++
      } catch (err) {
        console.error("Conversion failed for " + file.name, err)
      }
    }

    if (successCount > 0) {
      showNotification(`Successfully converted ${successCount} files!`, "success")
      setTimeout(resetConverter, 1500)
    }

    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function convertFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        const img = new Image()
        
        img.onload = () => {
          const width = img.naturalWidth
          const height = img.naturalHeight
          
          // Create SVG content with embedded base64 image
          const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
              <image width="${width}" height="${height}" xlink:href="${dataUrl}" />
            </svg>
          `.trim()
          
          const blob = new Blob([svgContent], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = file.name.replace(/\.png$/i, ".svg")
          a.click()
          URL.revokeObjectURL(url)
          resolve()
        }
        
        img.onerror = () => reject(new Error("Image processing failed"))
        img.src = dataUrl
      }
      reader.onerror = () => reject(new Error("File reading failed"))
      reader.readAsDataURL(file)
    })
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("pngFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#pngDropZone .drop-text").textContent = "Drop PNG files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("pngDropZone")
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

  document.addEventListener("DOMContentLoaded", initPNGConverter)
})()
