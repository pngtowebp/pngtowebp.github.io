// JPG to PNG Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  // Function to show notifications
  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
    // Implement actual notification logic here if needed
  }

  // Initialize converter after DOM is loaded
  function initJPGConverter() {
    const dropZone = document.getElementById("jpgDropZone")
    const fileInput = document.getElementById("jpgFileInput")
    const convertBtn = document.getElementById("jpgConvertBtn")
    const previewContainer = document.getElementById("previewContainer")
    const filesList = document.getElementById("filesList")

    if (!dropZone || !fileInput || !convertBtn) {
      console.error("[v0] JPG to PNG converter elements not found")
      return
    }

    // Click to upload
    dropZone.addEventListener("click", () => {
      fileInput.click()
    })

    // Drag and drop events
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-blue)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => {
      resetDropZoneStyle()
    })

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "image/jpeg" || f.type === "image/jpg")
      handleFileSelection(files)
    })

    // File input change
    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files)
      handleFileSelection(files)
    })

    // Convert button click
    convertBtn.addEventListener("click", () => {
      handleJPGtoPNGConversion()
    })
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid JPG files", "error")
      return
    }

    selectedFiles = files
    updateDropZoneUI()
    displayFilesPreviews()
  }

  function updateDropZoneUI() {
    const dropZone = document.getElementById("jpgDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
      dropZone.style.borderColor = "var(--color-green)"
      dropZone.style.backgroundColor = "var(--color-white)"
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

      const fileInfo = document.createElement("div")
      fileInfo.className = "file-info"

      const fileName = document.createElement("span")
      fileName.className = "file-name"
      fileName.textContent = file.name

      const fileSize = document.createElement("span")
      fileSize.className = "file-size"
      fileSize.textContent = formatFileSize(file.size)

      fileInfo.appendChild(fileName)
      fileInfo.appendChild(fileSize)

      const removeBtn = document.createElement("button")
      removeBtn.className = "remove-file-btn"
      removeBtn.textContent = "✕"
      removeBtn.onclick = () => removeFile(index)

      fileItem.appendChild(fileInfo)
      fileItem.appendChild(removeBtn)
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

  async function handleJPGtoPNGConversion() {
    if (selectedFiles.length === 0) {
      showNotification("Please select JPG files to convert first!", "error")
      return
    }

    const convertBtn = document.getElementById("jpgConvertBtn")
    const originalText = convertBtn.textContent

    // Update button state
    convertBtn.textContent = "CONVERTING..."
    convertBtn.disabled = true
    convertBtn.style.backgroundColor = "var(--color-purple)"

    try {
      let successCount = 0
      let failCount = 0

      for (const file of selectedFiles) {
        try {
          await convertJPGtoPNG(file)
          successCount++
        } catch (error) {
          console.error(`[v0] Failed to convert ${file.name}:`, error)
          failCount++
        }
      }

      // Show results
      if (successCount > 0) {
        showNotification(`Successfully converted ${successCount} file(s) to PNG!`, "success")
      }

      if (failCount > 0) {
        showNotification(`Failed to convert ${failCount} file(s)`, "error")
      }

      // Reset after successful conversion
      setTimeout(() => {
        resetConverter()
      }, 1000)
    } catch (error) {
      showNotification(`Conversion failed: ${error.message}`, "error")
    } finally {
      // Reset button state
      convertBtn.textContent = originalText
      convertBtn.disabled = false
      convertBtn.style.backgroundColor = "var(--color-green)"
    }
  }

  function convertJPGtoPNG(file) {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (file.type !== "image/jpeg" && file.type !== "image/jpg") {
        reject(new Error(`${file.name} is not a JPG file`))
        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()

        img.onload = () => {
          try {
            // Create canvas with image dimensions
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height

            // Draw image on canvas
            const ctx = canvas.getContext("2d")
            ctx.drawImage(img, 0, 0)

            // Convert to PNG blob
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to create PNG"))
                  return
                }

                // Generate filename
                const originalName = file.name.replace(/\.(jpg|jpeg)$/i, "")
                const newFileName = `${originalName}.png`

                // Download the file
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = newFileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                resolve()
              },
              "image/png",
              1.0, // Maximum quality for PNG
            )
          } catch (error) {
            reject(error)
          }
        }

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${file.name}`))
        }

        img.src = e.target.result
      }

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`))
      }

      reader.readAsDataURL(file)
    })
  }

  function resetConverter() {
    const dropZone = document.getElementById("jpgDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const fileInput = document.getElementById("jpgFileInput")
    const previewContainer = document.getElementById("previewContainer")

    dropText.textContent = "Drop JPG files here or click to upload"
    resetDropZoneStyle()

    if (fileInput) {
      fileInput.value = ""
    }

    if (previewContainer) {
      previewContainer.classList.add("hidden")
    }

    selectedFiles = []
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("jpgDropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initJPGConverter)
  } else {
    initJPGConverter()
  }
})()
