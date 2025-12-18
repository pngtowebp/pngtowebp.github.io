// Load HTML components
async function loadHTMLComponent(containerId, filePath) {
  try {
    const response = await fetch(filePath)
    if (!response.ok) throw new Error(`Failed to load ${filePath}`)
    const html = await response.text()
    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = html
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error)
  }
}

// Initialize page components
async function initializeComponents() {
  await Promise.all([
    loadHTMLComponent("header-container", "header.html"),
    loadHTMLComponent("footer-container", "footer.html"),
    loadHTMLComponent("sidebar-container", "sidebar.html"),
    loadHTMLComponent("alltools-container", "alltools.html"),
  ])

  // Initialize event listeners after components are loaded
  initializeEventListeners()
}

// Initialize all event listeners
function initializeEventListeners() {
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById("mobileMenuToggle")
  const mobileMenu = document.getElementById("mobileMenu")

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("active")

      // Animate hamburger icon
      const spans = mobileMenuToggle.querySelectorAll("span")
      spans[0].style.transform = mobileMenu.classList.contains("active") ? "rotate(45deg) translate(6px, 6px)" : "none"
      spans[1].style.opacity = mobileMenu.classList.contains("active") ? "0" : "1"
      spans[2].style.transform = mobileMenu.classList.contains("active")
        ? "rotate(-45deg) translate(6px, -6px)"
        : "none"
    })

    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll(".mobile-nav-link")
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("active")
        const spans = mobileMenuToggle.querySelectorAll("span")
        spans[0].style.transform = "none"
        spans[1].style.opacity = "1"
        spans[2].style.transform = "none"
      })
    })
  }

  // File upload functionality
  const dropZone = document.getElementById("dropZone")
  const fileInput = document.getElementById("fileInput")
  const convertBtn = document.getElementById("convertBtn")

  if (dropZone && fileInput) {
    // Click to upload
    dropZone.addEventListener("click", () => {
      fileInput.click()
    })

    // Drag and drop
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-blue)"
      dropZone.style.backgroundColor = "var(--color-white)"
    })

    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"
    })

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      dropZone.style.borderColor = "var(--color-gray)"
      dropZone.style.backgroundColor = "var(--color-cream)"

      const files = e.dataTransfer.files
      handleFiles(files)
    })

    // File input change
    fileInput.addEventListener("change", (e) => {
      const files = e.target.files
      handleFiles(files)
    })
  }

  // Convert button
  if (convertBtn) {
    convertBtn.addEventListener("click", () => {
      handleConversion()
    })
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href")
      if (href !== "#" && href.length > 1) {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      }
    })
  })

  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in")
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Observe tool cards
  document.querySelectorAll(".tool-card, .feature-card, .step-card").forEach((card) => {
    observer.observe(card)
  })
}

// Handle file selection
let selectedFiles = []

function handleFiles(files) {
  selectedFiles = Array.from(files)
  const dropZone = document.getElementById("dropZone")
  const dropText = dropZone.querySelector(".drop-text")

  if (selectedFiles.length > 0) {
    const fileNames = selectedFiles.map((f) => f.name).join(", ")
    dropText.textContent =
      selectedFiles.length === 1 ? `Selected: ${fileNames}` : `${selectedFiles.length} files selected`
    dropZone.style.borderColor = "var(--color-green)"
    dropZone.style.backgroundColor = "var(--color-white)"
  }
}

async function handleConversion() {
  if (selectedFiles.length === 0) {
    showNotification("Please select files to convert first!", "error")
    return
  }

  const outputFormat = document.getElementById("outputFormat").value
  const convertBtn = document.getElementById("convertBtn")

  // Animate button
  const originalText = convertBtn.textContent
  convertBtn.textContent = "CONVERTING..."
  convertBtn.disabled = true
  convertBtn.style.backgroundColor = "var(--color-purple)"

  try {
    // Convert each file
    for (const file of selectedFiles) {
      await convertImage(file, outputFormat)
    }

    showNotification(
      `Successfully converted ${selectedFiles.length} file(s) to ${outputFormat.toUpperCase()}!`,
      "success",
    )

    // Reset state
    resetConverter()
  } catch (error) {
    showNotification(`Conversion failed: ${error.message}`, "error")
  } finally {
    // Reset button
    convertBtn.textContent = originalText
    convertBtn.disabled = false
    convertBtn.style.backgroundColor = "var(--color-green)"
  }
}

async function convertImage(file, outputFormat) {
  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      reject(new Error(`${file.name} is not an image file`))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height

          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0)

          // Convert to desired format
          const mimeType = getMimeType(outputFormat)
          const quality = outputFormat === "webp" || outputFormat === "jpg" ? 0.92 : 1

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to convert image"))
                return
              }

              // Download the converted file
              const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
              const newFileName = `${originalName}.${outputFormat}`

              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = newFileName
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)

              resolve()
            },
            mimeType,
            quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${file.name}`))
      }

      img.src = e.target.result
    }

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`))
    }

    reader.readAsDataURL(file)
  })
}

function getMimeType(format) {
  const mimeTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
  }
  return mimeTypes[format.toLowerCase()] || "image/png"
}

function showNotification(message, type = "info") {
  // Remove existing notifications
  const existing = document.querySelector(".notification")
  if (existing) {
    existing.remove()
  }

  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  document.body.appendChild(notification)

  // Trigger animation
  setTimeout(() => {
    notification.classList.add("show")
  }, 10)

  // Remove after 4 seconds
  setTimeout(() => {
    notification.classList.remove("show")
    setTimeout(() => {
      notification.remove()
    }, 300)
  }, 4000)
}

function resetConverter() {
  const dropZone = document.getElementById("dropZone")
  const dropText = dropZone.querySelector(".drop-text")
  const fileInput = document.getElementById("fileInput")

  dropText.textContent = "Drop files here or click to upload"
  dropZone.style.borderColor = "var(--color-gray)"
  dropZone.style.backgroundColor = "var(--color-cream)"

  if (fileInput) {
    fileInput.value = ""
  }

  selectedFiles = []
}

// Track page views (placeholder for analytics)
function trackPageView() {
  console.log("[v0] Page view tracked:", window.location.pathname)
}

// Initialize on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeComponents()
    trackPageView()
  })
} else {
  initializeComponents()
  trackPageView()
}

// Add scroll progress indicator
window.addEventListener("scroll", () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
  const scrolled = (winScroll / height) * 100

  // You can use this value to show a progress bar if needed
  console.log("[v0] Scroll progress:", scrolled.toFixed(2) + "%")
})

// Performance monitoring
window.addEventListener("load", () => {
  const loadTime = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
  console.log("Page load time:", loadTime + "ms")
})
