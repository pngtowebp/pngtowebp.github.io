// PNG to ICO Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initPNGToICO() {
    const dropZone = document.getElementById("pngDropZone")
    const fileInput = document.getElementById("pngFileInput")
    const convertBtn = document.getElementById("pngConvertBtn")

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
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.name.toLowerCase().endsWith(".png") || f.type === "image/png"
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
      showNotification("Please select valid PNG files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("pngDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} PNG file${selectedFiles.length > 1 ? "s" : ""} added`
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

  async function convertPngToIco(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = async () => {
          try {
            const sizes = [16, 24, 32, 48, 64, 128, 256] // Common ICO sizes
            const images = []

            for (const size of sizes) {
              const canvas = document.createElement('canvas')
              canvas.width = size
              canvas.height = size
              const ctx = canvas.getContext('2d')
              
              // Draw image centered and scaled
              const aspectRatio = img.width / img.height
              let drawWidth = size
              let drawHeight = size
              let offsetX = 0
              let offsetY = 0

              if (aspectRatio > 1) { // Wider than tall
                drawHeight = size / aspectRatio
                offsetY = (size - drawHeight) / 2
              } else if (aspectRatio < 1) { // Taller than wide
                drawWidth = size * aspectRatio
                offsetX = (size - drawWidth) / 2
              }
              
              ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
              
              const imageData = ctx.getImageData(0, 0, size, size)
              images.push({ width: size, height: size, imageData: imageData.data.buffer })
            }
            
            const icoBlob = await ICO.create(images) // ico.js creates the ICO blob
            
            resolve({
              blob: icoBlob,
              fileName: file.name.replace(/\.png$/i, ".ico")
            })

          } catch (err) {
            reject(new Error("Failed to create ICO from PNG: " + err.message))
          }
        }
        img.onerror = () => reject(new Error("Failed to load PNG image"))
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error("File read failed"))
      reader.readAsDataURL(file)
    })
  }

  async function handleConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("pngConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "GENERATING ICO..."
    convertBtn.disabled = true

    for (const file of selectedFiles) {
      try {
        const { blob, fileName } = await convertPngToIco(file)
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
      } catch (err) {
        console.error("PNG to ICO conversion failed:", err)
        showNotification(`Could not convert ${file.name}`, "error")
      }
    }

    showNotification("Conversion complete!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = originalText
    convertBtn.disabled = false
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

  document.addEventListener("DOMContentLoaded", initPNGToICO)
})()
