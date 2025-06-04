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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Form elements
const form = document.getElementById('bookForm');
const bookNameInput = document.getElementById('bookName');
const copiesInput = document.getElementById('copies');
const coverImageInput = document.getElementById('coverImage');
const pageImagesInput = document.getElementById('pageImages');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const bookListDiv = document.getElementById('bookList');
const deleteModal = document.getElementById("deleteModal");
const deleteMessage = document.getElementById("deleteMessage");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("✅ Logged in successfully!");
      loadBooks(); // load books after login
    })
    .catch(error => {
      alert("❌ Login failed: " + error.message);
    });
});
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;

  const adminRef = db.collection("admins").doc(user.uid);
  const adminDoc = await adminRef.get();

  if (!adminDoc.exists) {
    // Check if user was invited
    const pending = await db.collection("pendingAdmins")
      .where("email", "==", user.email)
      .limit(1)
      .get();

    if (!pending.empty) {
      const data = pending.docs[0].data();

      // Register user as admin
      await adminRef.set({
        email: user.email,
        type: data.type,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      await db.collection("pendingAdmins").doc(pending.docs[0].id).delete();

      alert("🎉 You’ve been added as an admin!");
    } else {
      alert("⛔ Access denied. You’re not an admin.");
      firebase.auth().signOut();
      return;
    }
  }

  // ✅ Now safe to access admin type
  const adminData = (await adminRef.get()).data(); // re-fetch or reuse adminDoc
  const type = adminData.type;

  const doc = await db.collection("admins").doc(user.uid).get();
    const role = doc.exists ? doc.data().type : "Unknown";
    document.getElementById("adminRole").textContent = role;
    document.getElementById("adminEmail").textContent = user.email;
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('loginPage').style.display = 'none';

  // Show/hide super admin UI
  document.getElementById('superAdminControls').style.display =
    type === "super" ? "block" : "none";

  loadBooks(); // Proceed with loading books
});





document.getElementById('logoutBtn').addEventListener('click', () => {
  const confirmLogout = confirm("⚠️ Are you sure you want to log out?");
  if (confirmLogout) {
    firebase.auth().signOut().then(() => {
      alert("👋 You’ve been logged out.");
       document.getElementById('loginPage').style.display = 'block';
       document.getElementById('dashboard').style.display = 'none';
       document.getElementById('superAdminControls').style.display = 'none';
       // optional redirect
    }).catch(error => {
      console.error("Logout error:", error);
      alert("❌ Failed to log out. Try again.");
    });
  }
});


// Assuming this is called when Super Admin submits a form to add another admin
async function addAdmin(newAdminEmail, type = "normal") {
  try {
    // First check if current user is a super admin
    const currentUser = firebase.auth().currentUser;
    const currentAdminDoc = await db.collection("admins").doc(currentUser.uid).get();

    if (!currentAdminDoc.exists || currentAdminDoc.data().type !== "super") {
      alert("❌ You are not authorized to add new admins.");
      return;
    }

    // Add the new admin with placeholder UID (to be filled after login)
    const newAdminDoc = await db.collection("pendingAdmins").add({
      email: newAdminEmail,
      type: type,
      invitedBy: currentUser.email,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`✅ ${type.toUpperCase()} admin invite sent to ${newAdminEmail}`);
  } catch (err) {
    console.error("Error adding admin:", err);
    alert("❌ Failed to add admin.");
  }
}



async function loadBooks() {
  const user = firebase.auth().currentUser;
  if (!user) {
    bookListDiv.innerHTML = "❌ Please login to see your books.";
    return;
  }

  bookListDiv.innerHTML = "Loading your books... 📖";

  try {
    const snapshot = await db.collection('books')
      .where('uploadedBy', '==', user.uid)
      .get();

    if (snapshot.empty) {
      bookListDiv.innerHTML = "No books uploaded yet.";
      return;
    }

    bookListDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const book = doc.data();
      const code = doc.id;
      const bookItem = document.createElement('div');

      bookItem.innerHTML = `
        <strong>📘 ${book.bookName}</strong><br>
        <img src="${book.coverUrl}" alt="cover" width="100" /><br>
        <span id="code" onclick="copyText()">${window.location.origin}/index.html?code=${code}</span><br>
        <button data-code="${code}">🗑️ Delete</button>
        

      `;
bookItem.style = `
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 8px;
  max-width: 200px;
  flex: 1 1 calc(25% - 16px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
  background: #f9f9f9;
`;
      bookListDiv.appendChild(bookItem);

      const deleteBtn = bookItem.querySelector("button");
      deleteBtn.addEventListener('click', () => deleteBook(code, book));
    });

  } catch (error) {
    console.error("Error loading books:", error);
    bookListDiv.innerHTML = "❌ Failed to load books.";
  }
}





function deleteBook(code, book) {
  selectedBookCode = code;
  selectedBookElement = book;

  deleteMessage.textContent = `Are you sure you want to delete "${book.bookName}" (${code})?`;
  deleteModal.style.display = "flex";
}


// Load books when admin panel loads
loadBooks();

function generateBookCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function compressImageToWebP(file, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function uploadImage(file, path, index, total) {
  return new Promise((resolve, reject) => {
    const storageRef = storage.ref(path);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
      snapshot => {
        const percent = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(0);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `Uploading ${index}/${total} → ${percent}%`;
      },
      error => reject(error),
      async () => {
        const url = await uploadTask.snapshot.ref.getDownloadURL();
        resolve(url);
      }
    );
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const bookName = bookNameInput.value;
  const copies = Number(copiesInput.value);
  const coverImage = coverImageInput.files[0];
  const pageFiles = pageImagesInput.files;

  if (!bookName || !copies || !coverImage || !pageFiles.length) {
    alert('📘 Please fill all required fields.');
    return;
  }

  const code = generateBookCode();
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = 'Starting upload...';

  try {
    const compressedCover = await compressImageToWebP(coverImage);
    const coverUrl = await uploadImage(compressedCover, `books/${code}/cover.webp`, 0, pageFiles.length + 1);

    const pageUrls = [];
    for (let i = 0; i < pageFiles.length; i++) {
      const compressedPage = await compressImageToWebP(pageFiles[i]);
      const pageUrl = await uploadImage(compressedPage, `books/${code}/pages/page${i + 1}.webp`, i + 1, pageFiles.length + 1);
      pageUrls.push(pageUrl);
    }
    const user = firebase.auth().currentUser;
    await db.collection('books').doc(code).set({
  code,
  bookName,
  copies,
  coverUrl,
  pageUrls,
  uploadedBy: user.uid, // 🔐 Save admin UID
  timestamp: firebase.firestore.FieldValue.serverTimestamp()
});
  emailjs.send("service_v95ykqa", "template_4spudql", {
  to_email: firebase.auth().currentUser.email,
  to_name: firebase.auth().currentUser.displayName || "Dear Admin",
  book_name: bookName,
  book_code: code

}).then(() => {
  console.log("📨 Success email sent!");
  console.log(firebase.auth().currentUser.email)
}).catch(err => {
  console.error("❌ Email sending failed:", err);
});

    progressText.textContent = `✅ Book uploaded successfully! Code: ${code}`;
    setTimeout(() => {
      progressContainer.style.display = 'none';
      form.reset();
    }, 3000);
     loadBooks()
  } catch (error) {
    console.error('Upload failed:', error);
    progressText.textContent = '⚠️ Upload failed. Please try again.';
  }
});






confirmDeleteBtn.addEventListener("click", async () => {
  deleteModal.style.display = "none";

  try {
    const getPathFromUrl = (url) => {
      const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
      const bucketName = firebaseConfig.storageBucket;
      const prefix = `${baseUrl}${bucketName}/o/`;
      const suffixIndex = url.indexOf("?alt=media");
      return decodeURIComponent(url.slice(prefix.length, suffixIndex));
    };

    await storage.ref(getPathFromUrl(selectedBookElement.coverUrl)).delete();

    for (let url of selectedBookElement.pageUrls) {
      await storage.ref(getPathFromUrl(url)).delete();
    }

    await db.collection("books").doc(selectedBookCode).delete();

    alert(`✅ Book "${selectedBookElement.bookName}" deleted successfully.`);
    loadBooks(); // Refresh book list
  } catch (err) {
    console.error("Error deleting book:", err);
    alert("❌ Failed to delete the book.");
  }
});

cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.style.display = "none";
});


function copyText() {
    const text = document.getElementById("code").innerText;

    navigator.clipboard.writeText(text).then(() => {
      alert("Copied: " + text);
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  }
 
  function copytext() {
    const text = document.getElementById("inviteLinkOutput").innerText;

    navigator.clipboard.writeText(text).then(() => {
      alert("Copied: " + text);
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  }
 


  document.getElementById('addAdminForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('newAdminEmail').value;
  const type = document.getElementById('adminType').value;
  addAdmin(email, type);
});


const h3 = document.getElementById("h3");

h3.addEventListener('click', () => {
  const form = document.getElementById("addAdminForm");
  form.style.display = (form.style.display === "none" || form.style.display === "") 
    ? "block" 
    : "none";
});


function toggleAdminPanel() {
  const panel = document.getElementById('adminPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

const inviteh3 = document.getElementById('invite-h3')

inviteh3.addEventListener('click', () => {
  const form = document.getElementById("invite-div");
  form.style.display = (form.style.display === "none" || form.style.display === "") 
    ? "block" 
    : "none";
});




function generateRandomToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function createOneTimeAdminToken(role = 'normal') {
  const token = generateRandomToken();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // expires in 15 minutes

  await db.collection("admin_invites").doc(token).set({
    role,
    used: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt)
  });

  const link = `${window.location.origin}/register.html?token=${token}`;
  return link;
}

document.getElementById("generateInviteBtn").addEventListener("click", async () => {
  const role = document.getElementById("inviteRole").value;
  const link = await createOneTimeAdminToken(role);
  document.getElementById("inviteLinkOutput").innerText = link;
});
