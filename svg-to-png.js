// SVG to PNG Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
    // Hook into global notification system if available
  }

  function initSVGConverter() {
    const dropZone = document.getElementById("svgDropZone")
    const fileInput = document.getElementById("svgFileInput")
    const convertBtn = document.getElementById("svgConvertBtn")
    const previewContainer = document.getElementById("previewContainer")

    if (!dropZone || !fileInput || !convertBtn) return

    dropZone.addEventListener("click", () => fileInput.click())

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-purple)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle())

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "image/svg+xml")
      handleFileSelection(files)
    })

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    convertBtn.addEventListener("click", () => handleSVGtoPNGConversion())
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid SVG files", "error")
      return
    }
    selectedFiles = files
    updateDropZoneUI()
    displayFilesPreviews()
  }

  function updateDropZoneUI() {
    const dropZone = document.getElementById("svgDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} SVG file${selectedFiles.length > 1 ? "s" : ""} selected`
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

  async function handleSVGtoPNGConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("svgConvertBtn")
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
      showNotification(`Successfully rasterized ${successCount} files!`, "success")
      setTimeout(resetConverter, 1500)
    }

    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function convertFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const svgData = e.target.result
        const img = new Image()
        
        // Handling SVG requires setting dimensions if they aren't explicitly in the image tag
        img.onload = () => {
          const canvas = document.createElement("canvas")
          // Use natural dimensions, or fallback to standard sizes if missing
          canvas.width = img.naturalWidth || 800
          canvas.height = img.naturalHeight || 800
          
          const ctx = canvas.getContext("2d")
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = file.name.replace(/\.svg$/i, ".png")
            a.click()
            URL.revokeObjectURL(url)
            resolve()
          }, "image/png")
        }
        
        img.onerror = () => reject(new Error("Failed to load SVG into image object"))
        
        // Create a blob URL for the SVG to ensure all references (like fonts/styles) are handled
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'})
        const url = URL.createObjectURL(svgBlob)
        img.src = url
      }
      reader.onerror = () => reject(new Error("File read failed"))
      reader.readAsText(file)
    })
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("svgFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#svgDropZone .drop-text").textContent = "Drop SVG files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("svgDropZone")
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

  document.addEventListener("DOMContentLoaded", initSVGConverter)
})()
