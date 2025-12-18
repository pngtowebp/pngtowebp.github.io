// JSON to CSV Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initJSONConverter() {
    const dropZone = document.getElementById("jsonDropZone")
    const fileInput = document.getElementById("jsonFileInput")
    const convertBtn = document.getElementById("jsonConvertBtn")

    if (!dropZone || !fileInput || !convertBtn) return

    dropZone.addEventListener("click", () => fileInput.click())

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-orange)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle())

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.name.toLowerCase().endsWith(".json")
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
      showNotification("Please select valid JSON files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("jsonDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} JSON file${selectedFiles.length > 1 ? "s" : ""} added`
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

  function flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = typeof obj[k] === 'object' ? JSON.stringify(obj[k]) : obj[k];
      }
      return acc;
    }, {});
  }

  async function handleConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("jsonConvertBtn")
    convertBtn.textContent = "FLATTENING..."
    convertBtn.disabled = true

    for (const file of selectedFiles) {
      try {
        const text = await file.text()
        let jsonData = JSON.parse(text)
        
        // Ensure data is an array
        if (!Array.isArray(jsonData)) jsonData = [jsonData]
        
        const flattenedData = jsonData.map(item => flattenObject(item))
        
        // Extract headers
        const headers = Array.from(new Set(flattenedData.flatMap(item => Object.keys(item))))
        
        // Create CSV rows
        const csvRows = [
          headers.join(','),
          ...flattenedData.map(row => headers.map(header => {
            const val = row[header] === undefined ? '' : row[header]
            return `"${String(val).replace(/"/g, '""')}"`
          }).join(','))
        ]
        
        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement("a")
        a.href = url
        a.download = file.name.replace(/\.json$/i, ".csv")
        a.click()
        URL.revokeObjectURL(url)
        
      } catch (err) {
        console.error("JSON conversion failed:", err)
        showNotification(`Invalid JSON in ${file.name}`, "error")
      }
    }

    showNotification("JSON converted successfully!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = "CONVERT TO CSV"
    convertBtn.disabled = false
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("jsonFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#jsonDropZone .drop-text").textContent = "Drop JSON files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("jsonDropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    }
  }

  document.addEventListener("DOMContentLoaded", initJSONConverter)
})()
