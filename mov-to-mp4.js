// MOV to MP4 Converter - Client-Side Implementation

;(() => {
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({ log: false });
  let selectedFiles = [];
  let ffmpegLoaded = false;

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`);
  }

  function initMOVConverter() {
    const dropZone = document.getElementById("movDropZone");
    const fileInput = document.getElementById("movFileInput");
    const convertBtn = document.getElementById("movConvertBtn");
    const statusLabel = document.getElementById("conversionStatus");

    if (!dropZone || !fileInput || !convertBtn) return;

    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--color-red)";
      dropZone.style.backgroundColor = "var(--color-white)";
    });

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle());

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      resetDropZoneStyle();
      const files = Array.from(e.dataTransfer.files).filter((f) => 
        f.name.toLowerCase().endsWith(".mov") || f.name.toLowerCase().endsWith(".qt")
      );
      handleFileSelection(files);
    });

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    });

    convertBtn.addEventListener("click", () => handleMOVtoMP4Conversion());
  }

  function handleFileSelection(files) {
    if (files.length === 0) {
      showNotification("Please select valid MOV files", "error");
      return;
    }
    selectedFiles = files;
    updateUI();
    displayFilesPreviews();
  }

  function updateUI() {
    const dropZone = document.getElementById("movDropZone");
    const dropText = dropZone.querySelector(".drop-text");
    const previewContainer = document.getElementById("previewContainer");

    if (selectedFiles.length > 0) {
      dropText.textContent = `${selectedFiles.length} MOV file${selectedFiles.length > 1 ? "s" : ""} selected`;
      previewContainer.classList.remove("hidden");
    }
  }

  function displayFilesPreviews() {
    const filesList = document.getElementById("filesList");
    if (!filesList) return;
    filesList.innerHTML = "";

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
    selectedFiles.splice(index, 1);
    if (selectedFiles.length === 0) {
      resetConverter();
    } else {
      updateUI();
      displayFilesPreviews();
    }
  }

  async function handleMOVtoMP4Conversion() {
    if (selectedFiles.length === 0) return;

    const convertBtn = document.getElementById("movConvertBtn");
    const statusLabel = document.getElementById("conversionStatus");
    
    convertBtn.disabled = true;

    if (!ffmpegLoaded) {
      statusLabel.textContent = "Loading core engine (approx 25MB)...";
      try {
        await ffmpeg.load();
        ffmpegLoaded = true;
      } catch (err) {
        statusLabel.textContent = "Error loading engine. Refresh and try again.";
        convertBtn.disabled = false;
        return;
      }
    }

    for (const file of selectedFiles) {
      statusLabel.textContent = `Converting: ${file.name}...`;
      
      const inName = 'input_file.mov';
      const outName = 'output_file.mp4';

      ffmpeg.FS('writeFile', inName, await fetchFile(file));

      // Conversion Command
      await ffmpeg.run('-i', inName, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22', '-c:a', 'aac', '-b:a', '128k', outName);

      const data = ffmpeg.FS('readFile', outName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.(mov|qt)$/i, ".mp4");
      a.click();

      // Cleanup
      ffmpeg.FS('unlink', inName);
      ffmpeg.FS('unlink', outName);
      URL.revokeObjectURL(url);
    }

    statusLabel.textContent = "All conversions complete!";
    setTimeout(resetConverter, 2000);
  }

  function resetConverter() {
    selectedFiles = [];
    const fileInput = document.getElementById("movFileInput");
    if (fileInput) fileInput.value = "";
    document.getElementById("previewContainer")?.classList.add("hidden");
    document.getElementById("conversionStatus").textContent = "";
    document.querySelector("#movDropZone .drop-text").textContent = "Drop MOV files here or click to upload";
    const convertBtn = document.getElementById("movConvertBtn");
    if (convertBtn) convertBtn.disabled = false;
    resetDropZoneStyle();
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("movDropZone");
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)";
      dropZone.style.backgroundColor = "var(--color-cream)";
    }
  }

  document.addEventListener("DOMContentLoaded", initMOVConverter);
})()
