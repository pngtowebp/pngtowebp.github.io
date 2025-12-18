// ICO to PNG Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initICOToPNG() {
    const dropZone = document.getElementById("icoDropZone")
    const fileInput = document.getElementById("icoFileInput")
    const convertBtn = document.getElementById("icoConvertBtn")

    if (!dropZone || !fileInput || !convertBtn) return

    dropZone.addEventListener("click", () => fileInput.click())

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-green)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle())

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.name.toLowerCase().endsWith(".ico")
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
      showNotification("Please select valid ICO files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("icoDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} ICO file${selectedFiles.length > 1 ? "s" : ""} added`
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

  async function convertIcoToPng(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const img = ICO.parse(e.target.result)
          
          if (!img || img.length === 0) {
            reject(new Error("No images found in ICO file"))
            return
          }

          // Find the largest image or first available
          const largestImage = img.sort((a,b) => (b.width * b.height) - (a.width * a.height))[0];
          
          const canvas = document.createElement('canvas')
          canvas.width = largestImage.width
          canvas.height = largestImage.height
          const ctx = canvas.getContext('2d')
          
          // Create an ImageData object from the pixel data
          const imageData = ctx.createImageData(largestImage.width, largestImage.height)
          
          // Fill imageData with RGBA data from ICO.js
          for (let i = 0; i < largestImage.imageData.length; i++) {
              imageData.data[i] = largestImage.imageData[i];
          }

          ctx.putImageData(imageData, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({
                blob: blob,
                fileName: file.name.replace(/\.ico$/i, ".png")
              })
            } else {
              reject(new Error("Canvas to Blob failed"))
            }
          }, 'image/png')

        } catch (err) {
          reject(new Error("Failed to parse ICO file: " + err.message))
        }
      }
      reader.onerror = () => reject(new Error("File read failed"))
      reader.readAsArrayBuffer(file)
    })
  }

  async function handleConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("icoConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "CONVERTING..."
    convertBtn.disabled = true

    for (const file of selectedFiles) {
      try {
        const { blob, fileName } = await convertIcoToPng(file)
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
      } catch (err) {
        console.error("ICO to PNG conversion failed:", err)
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
    const fileInput = document.getElementById("icoFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#icoDropZone .drop-text").textContent = "Drop ICO files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("icoDropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    }
  }

  document.addEventListener("DOMContentLoaded", initICOToPNG)
})()
