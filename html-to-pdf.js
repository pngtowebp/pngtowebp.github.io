// HTML to PDF Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initHTMLToPDF() {
    const dropZone = document.getElementById("htmlDropZone")
    const fileInput = document.getElementById("htmlFileInput")
    const convertBtn = document.getElementById("htmlConvertBtn")

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
        f.name.toLowerCase().endsWith(".html") || f.name.toLowerCase().endsWith(".htm")
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
      showNotification("Please select valid HTML files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("htmlDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} HTML file${selectedFiles.length > 1 ? "s" : ""} added`
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

  async function handleConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("htmlConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "PREPARING PDF..."
    convertBtn.disabled = true

    for (const file of selectedFiles) {
      try {
        const htmlContent = await file.text()
        
        // Create a hidden iframe to render the HTML
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '100%'
        iframe.style.bottom = '100%'
        iframe.style.width = '1024px' // Standard width for rendering
        document.body.appendChild(iframe)
        
        const doc = iframe.contentWindow.document
        doc.open()
        doc.write(htmlContent)
        doc.close()

        // Give the browser time to parse CSS and Layout
        iframe.contentWindow.onload = () => {
          iframe.contentWindow.print()
          // Cleanup after print dialog is closed
          setTimeout(() => {
            document.body.removeChild(iframe)
          }, 1000)
        }
        
      } catch (err) {
        console.error("HTML conversion failed:", err)
        showNotification(`Could not process ${file.name}`, "error")
      }
    }

    showNotification("Conversion ready!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("htmlFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#htmlDropZone .drop-text").textContent = "Drop HTML files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("htmlDropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    }
  }

  document.addEventListener("DOMContentLoaded", initHTMLToPDF)
})()
