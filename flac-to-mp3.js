// FLAC to MP3 Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initFLACConverter() {
    const dropZone = document.getElementById("flacDropZone")
    const fileInput = document.getElementById("flacFileInput")
    const convertBtn = document.getElementById("flacConvertBtn")

    if (!dropZone || !fileInput || !convertBtn) return

    dropZone.addEventListener("click", () => fileInput.click())

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-blue)"
    })

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle())

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      resetDropZoneStyle()
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.name.toLowerCase().endsWith(".flac") || f.type.includes("flac")
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
      showNotification("Please select valid FLAC files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("flacDropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} FLAC file${selectedFiles.length > 1 ? "s" : ""} selected`
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

    const convertBtn = document.getElementById("flacConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "ENCODING MP3..."
    convertBtn.disabled = true

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    for (const file of selectedFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        // Browsers can natively decode FLAC into AudioBuffers
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        
        const mp3Blob = encodeToMp3(audioBuffer)
        const url = URL.createObjectURL(mp3Blob)
        
        const a = document.createElement("a")
        a.href = url
        a.download = file.name.replace(/\.flac$/i, ".mp3")
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error("Conversion failed:", err)
        showNotification(`Could not convert ${file.name}`, "error")
      }
    }

    showNotification("Encoding complete!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  function encodeToMp3(audioBuffer) {
    const channels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128)
    const mp3Data = []

    const sampleBlockSize = 1152
    const left = audioBuffer.getChannelData(0)
    const right = channels > 1 ? audioBuffer.getChannelData(1) : left
    
    // Float32 to Int16 Conversion
    const leftInt = new Int16Array(left.length)
    const rightInt = new Int16Array(right.length)
    for (let i = 0; i < left.length; i++) {
      leftInt[i] = left[i] < 0 ? left[i] * 0x8000 : left[i] * 0x7FFF
      rightInt[i] = right[i] < 0 ? right[i] * 0x8000 : right[i] * 0x7FFF
    }

    for (let i = 0; i < leftInt.length; i += sampleBlockSize) {
      const leftChunk = leftInt.subarray(i, i + sampleBlockSize)
      const rightChunk = rightInt.subarray(i, i + sampleBlockSize)
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
      if (mp3buf.length > 0) mp3Data.push(mp3buf)
    }

    const finish = mp3encoder.flush()
    if (finish.length > 0) mp3Data.push(finish)

    return new Blob(mp3Data, { type: 'audio/mp3' })
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("flacFileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#flacDropZone .drop-text").textContent = "Drop FLAC files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("flacDropZone")
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)"
    }
  }

  document.addEventListener("DOMContentLoaded", initFLACConverter)
})()
