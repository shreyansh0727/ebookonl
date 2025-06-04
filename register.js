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

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
  alert("❌ No token provided.");
  location.href = "/";
}

let role;

async function validateTokenAndLoadForm() {
  const doc = await db.collection("admin_invites").doc(token).get();

  if (!doc.exists || doc.data().used) {
    alert("❌ Invalid or already used token.");
    return;
  }

  const data = doc.data();
  const now = new Date();
  if (data.expiresAt.toDate() < now) {
    alert("❌ Token expired.");
    return;
  }

  role = data.role || "normal";
  document.getElementById("registerForm").style.display = "block";
}

validateTokenAndLoadForm();


document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await db.collection("admins").doc(user.uid).set({
      email,
      type: role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await db.collection("admin_invites").doc(token).update({ used: true });

    alert("✅ Admin created!");
    window.location.href = "admin.html";
  } catch (err) {
    alert("❌ " + err.message);
  }
});

