// MP3 to WAV Converter - Client-Side Implementation

;(() => {
  let selectedFiles = []

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`)
  }

  function initMP3Converter() {
    const dropZone = document.getElementById("mp3DropZone")
    const fileInput = document.getElementById("mp3FileInput")
    const convertBtn = document.getElementById("mp3ConvertBtn")
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
        f.type === "audio/mpeg" || f.type === "audio/mp3" || f.name.toLowerCase().endsWith(".mp3")
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
      showNotification("Please select valid MP3 files", "error")
      return
    }
    selectedFiles = [...selectedFiles, ...files]
    updateUI()
    displayFilesPreviews()
  }

  function updateUI() {
    const dropZone = document.getElementById("mp3DropZone")
    const dropText = dropZone.querySelector(".drop-text")
    const previewContainer = document.getElementById("previewContainer")

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
      dropZone.style.borderColor = "var(--color-green)"
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
      updateUI()
      displayFilesPreviews()
    }
  }

  async function handleConversion() {
    if (selectedFiles.length === 0) return

    const convertBtn = document.getElementById("mp3ConvertBtn")
    const originalText = convertBtn.textContent
    convertBtn.textContent = "DECODING AUDIO..."
    convertBtn.disabled = true

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    for (const file of selectedFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        
        const wavBlob = audioBufferToWav(audioBuffer)
        const url = URL.createObjectURL(wavBlob)
        
        const a = document.createElement("a")
        a.href = url
        a.download = file.name.replace(/\.mp3$/i, ".wav")
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error("Conversion failed:", err)
        showNotification(`Failed to convert ${file.name}`, "error")
      }
    }

    showNotification("Conversion complete!", "success")
    setTimeout(resetConverter, 1500)
    convertBtn.textContent = originalText
    convertBtn.disabled = false
  }

  // Helper: Encode AudioBuffer to WAV format
  function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16
    
    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample
    
    const bufferLength = buffer.length
    const dataSize = bufferLength * blockAlign
    const headerSize = 44
    const totalSize = headerSize + dataSize
    
    const arrayBuffer = new ArrayBuffer(totalSize)
    const view = new DataView(arrayBuffer)
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    /* RIFF identifier */
    writeString(0, 'RIFF')
    /* file length */
    view.setUint32(4, 36 + dataSize, true)
    /* RIFF type */
    writeString(8, 'WAVE')
    /* format chunk identifier */
    writeString(12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, format, true)
    /* channel count */
    view.setUint16(22, numChannels, true)
    /* sample rate */
    view.setUint32(24, sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true)
    /* bits per sample */
    view.setUint16(34, bitDepth, true)
    /* data chunk identifier */
    writeString(36, 'data')
    /* data chunk length */
    view.setUint32(40, dataSize, true)

    // Write PCM samples
    const offset = 44
    const channelData = []
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i))
    }

    let index = 0
    let volume = 1
    for (let i = 0; i < bufferLength; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = channelData[channel][i] * volume
        sample = Math.max(-1, Math.min(1, sample)) // Clamp
        view.setInt16(offset + index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
        index += 2
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  function resetConverter() {
    selectedFiles = []
    const fileInput = document.getElementById("mp3FileInput")
    if (fileInput) fileInput.value = ""
    document.getElementById("previewContainer")?.classList.add("hidden")
    document.querySelector("#mp3DropZone .drop-text").textContent = "Drop MP3 files here or click to upload"
    resetDropZoneStyle()
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("mp3DropZone")
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

  document.addEventListener("DOMContentLoaded", initMP3Converter)
})()
