// AVI to MP4 Converter - Client-Side Implementation using FFmpeg.wasm

;(() => {
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({ log: false });
  let selectedFiles = [];
  let isFFmpegLoaded = false;

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`);
  }

  async function initVideoConverter() {
    const dropZone = document.getElementById("aviDropZone");
    const fileInput = document.getElementById("aviFileInput");
    const convertBtn = document.getElementById("aviConvertBtn");
    const statusLabel = document.getElementById("statusLabel");

    if (!dropZone || !fileInput || !convertBtn) return;

    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--color-purple)";
    });

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle());

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      resetDropZoneStyle();
      const files = Array.from(e.dataTransfer.files).filter((f) => f.name.toLowerCase().endsWith(".avi"));
      handleFileSelection(files);
    });

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    });

    convertBtn.addEventListener("click", () => handleConversion());
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid AVI files", "error");
      return;
    }
    selectedFiles = files;
    updateUI();
    displayFilesPreviews();
  }

  function updateUI() {
    const dropZone = document.getElementById("aviDropZone");
    const dropText = dropZone.querySelector(".drop-text");
    const previewContainer = document.getElementById("previewContainer");

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} AVI video${selectedFiles.length > 1 ? "s" : ""} selected`;
      previewContainer.classList.remove("hidden");
    }
  }

  function displayFilesPreviews() {
    const filesList = document.getElementById("filesList");
    if (!filesList) return;
    filesList.innerHTML = "";

    selectedFiles.forEach((file, index) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";
      fileItem.innerHTML = `
        <div class="file-info">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
        <button class="remove-file-btn" data-index="${index}">✕</button>
      `;
      fileItem.querySelector(".remove-file-btn").onclick = (e) => {
        e.stopPropagation();
        removeFile(index);
      }
      filesList.appendChild(fileItem);
    });
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);
    if (selectedFiles.length === 0) {
      resetConverter();
    } else {
      updateUI();
      displayFilesPreviews();
    }
  }

  async function handleConversion() {
    if (selectedFiles.length === 0) return;

    const convertBtn = document.getElementById("aviConvertBtn");
    const statusLabel = document.getElementById("statusLabel");
    
    convertBtn.disabled = true;
    
    if (!isFFmpegLoaded) {
      statusLabel.textContent = "Loading core engine (first time only)...";
      await ffmpeg.load();
      isFFmpegLoaded = true;
    }

    for (const file of selectedFiles) {
      statusLabel.textContent = `Converting: ${file.name}...`;
      
      const inputName = 'input.avi';
      const outputName = 'output.mp4';
      
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));
      
      // Run ffmpeg command: -c:v libx264 for high compatibility
      await ffmpeg.run('-i', inputName, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22', '-c:a', 'aac', outputName);
      
      const data = ffmpeg.FS('readFile', outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.avi$/i, ".mp4");
      a.click();
      
      // Cleanup
      ffmpeg.FS('unlink', inputName);
      ffmpeg.FS('unlink', outputName);
      URL.revokeObjectURL(url);
    }

    statusLabel.textContent = "Conversion Complete!";
    setTimeout(resetConverter, 2000);
  }

  function resetConverter() {
    selectedFiles = [];
    const fileInput = document.getElementById("aviFileInput");
    if (fileInput) fileInput.value = "";
    document.getElementById("previewContainer")?.classList.add("hidden");
    document.getElementById("statusLabel").textContent = "";
    document.querySelector("#aviDropZone .drop-text").textContent = "Drop AVI files here or click to upload";
    const convertBtn = document.getElementById("aviConvertBtn");
    if (convertBtn) convertBtn.disabled = false;
    resetDropZoneStyle();
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("aviDropZone");
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)";
    }
  }

  document.addEventListener("DOMContentLoaded", initVideoConverter);
})()
