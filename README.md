# 📚 eBookonl – Version 1

Welcome to the **eBookonl**, a powerful web-based platform that allows authenticated admins to upload, manage, and share eBooks securely using Firebase as the backbone.

> _“A vault of knowledge wrapped in code,  
> Where admins walk the writer’s road.  
> Secure, swift, and finely tuned—  
> The future of books is here, and soon.”_

---

## 🚀 Features

### 🔐 Admin Authentication
- Login system via Firebase Authentication.
- Two types of admins:
  - **Normal Admins** – Can upload and manage books.
  - **Super Admins** – Can also invite other admins using one-time tokens.

### 📘 Book Management
- Upload books with:
  - Book name
  - Number of copies
  - Cover image
  - Multiple page images
- Images are compressed to **WebP** before upload to save storage & speed up loading.

### 📤 Firebase Firestore & Storage
- All book metadata is saved in Firestore.
- Images are stored under structured paths in Firebase Storage.

### 📎 Shareable Access
- Each book generates a unique 6-digit alphanumeric code.
- The public can view books by accessing `/index.html?code=XXXXXX`.

### ✉️ Email Notification
- Admin receives an email confirmation on successful book upload using **EmailJS**.

### 🧹 Delete with Confirmation
- Admins can delete books after a confirmation modal.

### 👤 Admin Info Panel
- Toggleable panel at top-right shows the current logged-in admin and logout button.

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend (Cloud)**: Firebase Firestore, Firebase Storage
- **Auth**: Firebase Authentication
- **Email Service**: [EmailJS](https://www.emailjs.com/)


---

## 🧾 Setup Instructions

### 1. Clone the Repository

git clone https://github.com/shreyansh0727/ebookonl.git
cd ebookonl

### 2. Configure Firebase
Go to Firebase Console

Create a project.

Enable Authentication, Firestore, and Storage.


   const firebaseConfig = {
   apiKey: "YOUR_API_KEY",
   authDomain: "...",
   projectId: "...",
   ...
   };

### 3. Set Up Firestore Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{bookId} {
      allow read, write: if request.auth != null;
    }
    match /admins/{adminId} {
      allow read, write: if request.auth != null;
    }
  }
}

### 4. Set Up EmailJS
Create an EmailJS account.

Add your service ID and template ID in the script.

    emailjs.send("your_service_id", "your_template_id", {...});


### 📌 Usage Guide
Visit the /admin.html page.

Log in using a registered Firebase account.

Upload books using the form.

View all your uploaded books in the dashboard.

Use the book code to access it via /index.html?code=ABC123.

### 🛡️ Admin Roles Explained
Role	      Can Upload Books  	Can Add Admins
Normal  Admin	   ✅ Yes	       ❌ No
Super   Admin	   ✅ Yes	       ✅ Yes

To add a new admin, a super admin can generate a one-time registration link with a selected role.

### 🌌 Credits & Creator
Built by Shreyansh with Chatgpts help!!


### 📄 License
This project is open-source under the MIT License.


```bash

“Books once bound in leather and thread,
Now fly as pixels, stories spread.
I've built the gate — now guard it well,
For knowledge thrives where makers dwell.”