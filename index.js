// Firebase config
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    input.value = input.value.toUpperCase();

    if (input.value.length === 1 && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

// Show reader function with optimized lazy loading
function showReader(pages) {
  let currentPage = 0;
  const readerDiv = document.getElementById('reader');
  const pageImage = document.getElementById('page-image');
  const pageCounter = document.getElementById('page-counter');
  const skeleton = document.getElementById('skeleton-loader');
  const closeBtn = document.getElementById('reader-close');
  const loadedImages = new Array(pages.length).fill(null);

  function preloadImages(start, count) {
    for (let i = start; i < Math.min(start + count, pages.length); i++) {
      if (!loadedImages[i]) {
        const img = new Image();
        img.src = pages[i];
        img.onload = () => {
          loadedImages[i] = img;
        };
      }
    }
  }

  function renderPage(index) {
    if (!pages || !pages.length) {
      console.error("No pages available.");
      return;
    }
    closeBtn.style.display = 'none';
    pageImage.style.display = 'none';
    skeleton.style.display = 'block';
    pageCounter.textContent = `Page ${index + 1} of ${pages.length}`;

    if (loadedImages[index]) {
      pageImage.src = loadedImages[index].src;
      skeleton.style.display = 'none';
      pageImage.style.display = 'block';
      closeBtn.style.display = "block";
    } else {
      const tempImg = new Image();
      tempImg.src = pages[index];
      tempImg.loading = "lazy";

      tempImg.onerror = () => {
        console.error("Image failed to load:", tempImg.src);
        skeleton.style.display = 'none';
        pageCounter.textContent = "⚠️ Failed to load page";
      };

      tempImg.onload = () => {
        loadedImages[index] = tempImg;
        pageImage.src = tempImg.src;
        skeleton.style.display = 'none';
        pageImage.style.display = 'block';
        closeBtn.style.display = "block";
      };
    }

    preloadImages(index + 1, 2); // Preload next 2 images
  }

  document.getElementById('next').onclick = () => {
    if (currentPage < pages.length - 1) {
      currentPage++;
      renderPage(currentPage);
    }
  };

  document.getElementById('prev').onclick = () => {
    if (currentPage > 0) {
      currentPage--;
      renderPage(currentPage);
    }
  };

  closeBtn.onclick = () => {
    readerDiv.style.display = 'none';
    pageImage.src = "";
    verifyBookCode();
  };

  preloadImages(0, 3); // Preload first 3
  renderPage(currentPage);
  readerDiv.style.display = 'flex';
}

// Close reader when clicked outside image wrapper

document.getElementById("book-code-input").addEventListener("submit", function(e) {
  e.preventDefault();
  verifyBookCode();
});

// Main verify function
async function verifyBookCode() {
  const inputIds = ['otp-input1', 'otp-input2', 'otp-input3', 'otp-input4','otp-input5','otp-input6'];
  let code = '';

  for (let id of inputIds) {
    const input = document.getElementById(id);
    if (!input || !input.value.trim().toUpperCase()) {
      document.getElementById("error-message").innerText = "Please fill all OTP fields.";
      return;
    }
    code += input.value.trim().toUpperCase();
  }
  const errorMsg = document.getElementById("error-message");

  if (!/^[A-Z0-9]{6}$/.test(code)) {
    errorMsg.textContent = "Please enter a valid 6-digit alphanumeric code.";
    return;
  }

  try {
    const docRef = db.collection("books").doc(code);
    const snapshot = await docRef.get();

    if (snapshot.exists) {
      const bookData = snapshot.data();

      document.getElementById("code-access").style.display = "none";
      const bookGallery = document.getElementById("book-gallery");
      bookGallery.style.display = "block";
      bookGallery.innerHTML = "";

      const bookCard = document.createElement("div");
      bookCard.className = "book-card";

      bookCard.addEventListener('click', () => {
        if (!bookData.pageUrls || bookData.pageUrls.length === 0) {
          alert("No pages uploaded for this book.");
          return;
        }
        showReader(bookData.pageUrls);
        bookCard.style.display = "none";
      });

      bookCard.innerHTML = `
        <img class="book-cover" src="${bookData.coverUrl || 'https://via.placeholder.com/180x240?text=No+Cover'}" alt="${bookData.bookName}" />
        <div class="book-info">
          <h3 class="book-title">${bookData.bookName}</h3>
          <p class="book-code">Code: ${code}</p>
        </div>
      `;

      bookGallery.appendChild(bookCard);
    } else {
      errorMsg.textContent = "Book not found. Please check the code.";
    }
  } catch (error) {
    errorMsg.textContent = "Error accessing Firebase. Try again.";
    console.error("Firebase error:", error);
  }
}


window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code && /^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
    const codeChars = code.toUpperCase().split('');
    const otpInputs = ['otp-input1', 'otp-input2', 'otp-input3', 'otp-input4', 'otp-input5', 'otp-input6'];

    otpInputs.forEach((id, i) => {
      const input = document.getElementById(id);
      if (input) input.value = codeChars[i];
    });

    verifyBookCode();
  }
});


const adminbtn = document.getElementById("admin-btn")

adminbtn.addEventListener("click", () => {
  window.location.href = "admin.html";
});
