// MP4 to WebM Converter - Client-Side FFmpeg Implementation

;(() => {
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({ log: true });
  let selectedFile = null;

  function showNotification(message, type) {
    console.log(`[${type}] ${message}`);
  }

  function initMP4ToWebM() {
    const dropZone = document.getElementById("mp4DropZone");
    const fileInput = document.getElementById("mp4FileInput");
    const convertBtn = document.getElementById("mp4ConvertBtn");

    if (!dropZone || !fileInput || !convertBtn) return;

    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--color-green)";
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "var(--color-gray)";
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === "video/mp4") handleFile(file);
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    });

    convertBtn.addEventListener("click", () => startConversion());
  }

  function handleFile(file) {
    selectedFile = file;
    document.getElementById("previewContainer").classList.remove("hidden");
    document.getElementById("filesList").innerHTML = `
      <div class="file-item">
        <span>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
      </div>
    `;
  }

  async function startConversion() {
    if (!selectedFile) return;

    const convertBtn = document.getElementById("mp4ConvertBtn");
    const progressWrapper = document.getElementById("progressWrapper");
    const progressBar = document.getElementById("progressBar");
    const statusText = document.getElementById("statusText");

    convertBtn.disabled = true;
    progressWrapper.classList.remove("hidden");

    try {
      if (!ffmpeg.isLoaded()) {
        statusText.textContent = "Loading engine...";
        await ffmpeg.load();
      }

      statusText.textContent = "Starting Transcoding...";
      ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(selectedFile));

      ffmpeg.setProgress(({ ratio }) => {
        const percent = (ratio * 100).toFixed(0);
        progressBar.style.width = `${percent}%`;
        statusText.textContent = `Processing: ${percent}%`;
      });

      // Execute conversion: Constant Quality mode for WebM
      await ffmpeg.run('-i', 'input.mp4', '-c:v', 'libvpx', '-crf', '10', '-b:v', '1M', '-c:a', 'libvorbis', 'output.webm');

      statusText.textContent = "Finishing...";
      const data = ffmpeg.FS('readFile', 'output.webm');

      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/webm' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.name.replace('.mp4', '.webm');
      a.click();

      showNotification("Success!", "success");
      statusText.textContent = "Conversion Complete!";
    } catch (err) {
      console.error(err);
      statusText.textContent = "Error during conversion.";
      showNotification("Conversion failed", "error");
    } finally {
      convertBtn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", initMP4ToWebM);
})();
