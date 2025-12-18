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
    dropText.textContent = `${selectedFiles.length} file(s) selected`
    dropZone.style.borderColor = "var(--color-green)"
    dropZone.style.backgroundColor = "var(--color-white)"
  }
}

// Handle conversion (placeholder - actual conversion would require backend)
function handleConversion() {
  if (selectedFiles.length === 0) {
    alert("Please select files to convert first!")
    return
  }

  const outputFormat = document.getElementById("outputFormat").value
  const convertBtn = document.getElementById("convertBtn")

  // Animate button
  const originalText = convertBtn.textContent
  convertBtn.textContent = "CONVERTING..."
  convertBtn.disabled = true
  convertBtn.style.backgroundColor = "var(--color-purple)"

  // Simulate conversion process
  setTimeout(() => {
    alert(
      `Conversion to ${outputFormat.toUpperCase()} complete! \n\nNote: This is a demo. Actual file conversion would require backend processing.`,
    )

    // Reset button
    convertBtn.textContent = originalText
    convertBtn.disabled = false
    convertBtn.style.backgroundColor = "var(--color-green)"

    // Reset drop zone
    const dropZone = document.getElementById("dropZone")
    const dropText = dropZone.querySelector(".drop-text")
    dropText.textContent = "Drop files here or click to upload"
    dropZone.style.borderColor = "var(--color-gray)"
    dropZone.style.backgroundColor = "var(--color-cream)"

    selectedFiles = []
  }, 2000)
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
  console.log("[v0] Page load time:", loadTime + "ms")
})
