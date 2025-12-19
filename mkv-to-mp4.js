// MKV to MP4 Converter - Client-Side Implementation using FFmpeg.wasm

;(() => {
  let selectedFiles = []
  const { createFFmpeg, fetchFile } = FFmpeg
  const ffmpeg = createFFmpeg({ log: false })

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initMKVToMP4() {
    const dropZone = document.getElementById("mkvDropZone")
    const fileInput = document.getElementById("mkvFileInput")
    const convertBtn = document.getElementById("mkvConvertBtn")

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
        f.name.toLowerCase().endsWith(".mkv")
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
      showNotification("Please select valid MKV files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("mkvDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} MKV file${selectedFiles.length > 1 ? "s" : ""} added`
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

  async function handleConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("mkvConvertBtn")
    const progressBarContainer = document.getElementById("conversionProgress")
    const progressBar = document.getElementById("progressBar")

    convertBtn.textContent = "LOADING ENGINE..."
    convertBtn.disabled = true

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load()
    }

    progressBarContainer.classList.remove("hidden")

    for (const file of selectedFiles) {
      try {
        const { name } = file
        const outName = name.replace(/\.mkv$/i, ".mp4")
        
        convertBtn.textContent = `CONVERTING ${name.substring(0,10)}...`
        
        ffmpeg.setProgress(({ ratio }) => {
          progressBar.style.width = `${ratio * 100}%`
        })

        // Write file to FFmpeg virtual file system
        ffmpeg.FS('writeFile', name, await fetchFile(file))

        // Run FFmpeg command: -c copy means remuxing without re-encoding (lossless)
        await ffmpeg.run('-i', name, '-c', 'copy', outName)

        // Read result
        const data = ffmpeg.FS('readFile', outName)

        // Trigger Download
        const a = document.createElement("a")
        a.href = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
        a.download = outName
        a.click()

        // Clean up virtual FS
        ffmpeg.FS('unlink', name)
        ffmpeg.FS('unlink', outName)

      } catch (err) {
        console.error("MKV conversion failed:", err)
        showNotification(`Could not convert ${file.name}`, "error")
      }
    }

    showNotification("Conversion successful!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = "CONVERT TO MP4"
    convertBtn.disabled = false
    progressBarContainer.classList.add("hidden")
    progressBar.style.width = "0%"
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("mkvFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#mkvDropZone .drop-text").textContent = "Drop MKV files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("mkvDropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    }
  }

  document.addEventListener("DOMContentLoaded", initMKVToMP4)
})()
