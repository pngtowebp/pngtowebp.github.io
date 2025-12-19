// FLV to MP4 Converter - Client-Side Implementation using FFmpeg.wasm

;(() => {
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({ log: false });
  let selectedFile = null;

  function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`);
  }

  function initFLVToMP4() {
    const dropZone = document.getElementById("flvDropZone");
    const fileInput = document.getElementById("flvFileInput");
    const convertBtn = document.getElementById("flvConvertBtn");

    if (!dropZone || !fileInput || !convertBtn) return;

    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--color-orange)";
      dropZone.style.backgroundColor = "var(--color-white)";
    });

    dropZone.addEventListener("dragleave", () => resetDropZoneStyle());

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      resetDropZoneStyle();
      const file = e.dataTransfer.files[0];
      if (file && file.name.toLowerCase().endsWith(".flv")) {
        handleFileSelection(file);
      } else {
        showNotification("Please select a valid FLV file", "error");
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files[0]) handleFileSelection(e.target.files[0]);
    });

    convertBtn.addEventListener("click", () => handleConversion());
  }

  function handleFileSelection(file) {
    selectedFile = file;
    const previewContainer = document.getElementById("previewContainer");
    const filesList = document.getElementById("filesList");
    
    previewContainer.classList.remove("hidden");
    filesList.innerHTML = `
      <div class="file-item">
        <div class="file-info">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
      </div>
    `;
    
    document.querySelector(".drop-text").textContent = "Video selected!";
  }

  async function handleConversion() {
    if (!selectedFile) return;

    const convertBtn = document.getElementById("flvConvertBtn");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    convertBtn.disabled = true;
    convertBtn.textContent = "INITIALIZING ENGINE...";
    progressContainer.classList.remove("hidden");

    try {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }

      ffmpeg.setProgress(({ ratio }) => {
        const percentage = Math.round(ratio * 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
      });

      convertBtn.textContent = "CONVERTING...";
      
      // Write file to FFmpeg Virtual File System
      ffmpeg.FS('writeFile', 'input.flv', await fetchFile(selectedFile));

      // Run FFmpeg command: -c copy allows fast remuxing if codecs are compatible
      // If remuxing fails, a fallback to full transcoding could be added
      await ffmpeg.run('-i', 'input.flv', '-c', 'copy', '-y', 'output.mp4');

      // Read result
      const data = ffmpeg.FS('readFile', 'output.mp4');

      // Create download link
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedFile.name.replace(/\.flv$/i, ".mp4");
      a.click();
      
      showNotification("Conversion successful!", "success");
      setTimeout(resetConverter, 2000);

    } catch (err) {
      console.error("FFmpeg Error:", err);
      showNotification("Conversion failed. The file might be corrupted or incompatible.", "error");
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = "CONVERT TO MP4";
    }
  }

  function resetConverter() {
    selectedFile = null;
    document.getElementById("flvFileInput").value = "";
    document.getElementById("previewContainer").classList.add("hidden");
    document.getElementById("progressContainer").classList.add("hidden");
    document.getElementById("progressBar").style.width = "0%";
    document.querySelector(".drop-text").textContent = "Drop FLV video here or click to upload";
    resetDropZoneStyle();
  }

  function resetDropZoneStyle() {
    const dropZone = document.getElementById("flvDropZone");
    if (dropZone) {
      dropZone.style.borderColor = "var(--color-gray)";
      dropZone.style.backgroundColor = "var(--color-cream)";
    }
  }

  document.addEventListener("DOMContentLoaded", initFLVToMP4);
})();
