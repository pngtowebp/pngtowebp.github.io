// WebP to JPG Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
    // Assumes notification logic is globally handled or uses basic console for now
  }

  function initWebPConverter() {
    const dropZone = document.getElementById("webpDropZone")
    const fileInput = document.getElementById("webpFileInput")
    const convertBtn = document.getElementById("webpConvertBtn")
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
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "image/webp")
      handleFileSelection(files)
    })

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    convertBtn.addEventListener("click", () => handleWebPtoJPGConversion())
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid WebP files", "error")
      return
    }
    selectedFiles = files
    updateDropZoneUI()
    displayFilesPreviews()
  }

  function updateDropZoneUI() {
    const dropZone = document.getElementById("webpDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} WebP file${selectedFiles.length > 1 ? "s" : ""} selected`
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

  async function handleWebPtoJPGConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("webpConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "CONVERTING..."
    convertBtn.disabled = true

    let successCount = 0
    
    for (const file of selectedFiles) {
      try {
        await convertFile(file)
        successCount++
      } catch (err) {
        console.error("Conversion error for " + file.name, err)
      }
    }

    if (successCount > 0) {
      showNotification(`Converted ${successCount} files!`, "success")
      setTimeout(resetConverter, 1500)
    }

    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function convertFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          
          // Set white background for JPG (since WebP might have transparency)
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = file.name.replace(/\.webp$/i, ".jpg")
            a.click()
            URL.revokeObjectURL(url)
            resolve()
          }, "image/jpeg", 0.92) // 92% quality is standard high quality
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("webpFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#webpDropZone .drop-text").textContent = "Drop WebP files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("webpDropZone")
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

  document.addEventListener("DOMContentLoaded", initWebPConverter)
})()
