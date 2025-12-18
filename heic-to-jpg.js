// HEIC to JPG Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
    // This hook relies on the global showNotification in script.js if present
  }

  function initHEICConverter() {
    const dropZone = document.getElementById("heicDropZone")
    const fileInput = document.getElementById("heicFileInput")
    const convertBtn = document.getElementById("heicConvertBtn")
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
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.name.toLowerCase().endsWith(".heic") || f.name.toLowerCase().endsWith(".heif")
      )
      handleFileSelection(files)
    })

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    convertBtn.addEventListener("click", () => handleHEICtoJPGConversion())
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid HEIC/HEIF files", "error")
      return
    }
    selectedFiles = files
    updateDropZoneUI()
    displayFilesPreviews()
  }

  function updateDropZoneUI() {
    const dropZone = document.getElementById("heicDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} HEIC file${selectedFiles.length > 1 ? "s" : ""} selected`
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

  async function handleHEICtoJPGConversion() {
    if (selectedFiles.length === 0) return
    if (typeof heic2any === "undefined") {
      showNotification("Conversion library not loaded. Please check your internet.", "error")
      return
    }

    const convertBtn = document.getElementById("heicConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "PROCESSING..."
    convertBtn.disabled = true

    let successCount = 0
    
    for (const file of selectedFiles) {
      try {
        // heic2any converts the blob
        const resultBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9
        })

        // Handle multiple results if the HEIC was a container/burst
        const blobs = Array.isArray(resultBlob) ? resultBlob : [resultBlob]
        
        blobs.forEach((blob, i) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          const suffix = blobs.length > 1 ? `-${i + 1}` : ""
          a.download = file.name.replace(/\.(heic|heif)$/i, `${suffix}.jpg`)
          a.click()
          URL.revokeObjectURL(url)
        })
        
        successCount++
      } catch (err) {
        console.error("Conversion failed for " + file.name, err)
      }
    }

    if (successCount > 0) {
      showNotification(`Successfully converted ${successCount} photos!`, "success")
      setTimeout(resetConverter, 1500)
    } else {
      showNotification("Conversion failed. Ensure files are valid HEIC.", "error")
    }

    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("heicFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#heicDropZone .drop-text").textContent = "Drop HEIC files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("heicDropZone")
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

  document.addEventListener("DOMContentLoaded", initHEICConverter)
})()
