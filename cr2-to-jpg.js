// CR2 to JPG Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initCR2ToJPG() {
    const dropZone = document.getElementById("cr2DropZone")
    const fileInput = document.getElementById("cr2FileInput")
    const convertBtn = document.getElementById("cr2ConvertBtn")

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
        f.name.toLowerCase().endsWith(".cr2")
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
      showNotification("Please select valid CR2 files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("cr2DropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} Raw file${selectedFiles.length > 1 ? "s" : ""} added`
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
          <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
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

  async function convertCr2(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const view = new DataView(e.target.result);
        
        // This is a simplified local extraction of the JPEG preview embedded in CR2
        // Professional tools would use a WASM-based dcraw, but this is fast for CSR
        let offset = 0;
        let found = false;
        
        // Search for the Start of Image (SOI) marker for the embedded preview
        while (offset < view.byteLength - 2) {
            if (view.getUint16(offset) === 0xFFD8) {
                // Potential JPEG start found, usually the largest preview is later in the file
                const subBuffer = e.target.result.slice(offset);
                const blob = new Blob([subBuffer], { type: 'image/jpeg' });
                resolve({
                    blob: blob,
                    fileName: file.name.replace(/\.cr2$/i, ".jpg")
                });
                found = true;
                break;
            }
            offset++;
        }
        
        if (!found) reject(new Error("No preview found in CR2"));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  async function handleConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("cr2ConvertBtn")
    convertBtn.textContent = "DEVELOPING RAW..."
    convertBtn.disabled = true

    for (const file of selectedFiles) {
      try {
        const result = await convertCr2(file);
        
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement("a")
        a.href = url
        a.download = result.fileName
        a.click()
        URL.revokeObjectURL(url)
        
      } catch (err) {
        console.error("CR2 conversion failed:", err)
        showNotification(`Could not convert ${file.name}`, "error")
      }
    }

    showNotification("Conversion complete!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = "CONVERT TO JPG"
    convertBtn.disabled = false
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("cr2FileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#cr2DropZone .drop-text").textContent = "Drop CR2 files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("cr2DropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    }
  }

  document.addEventListener("DOMContentLoaded", initCR2ToJPG)
})()
