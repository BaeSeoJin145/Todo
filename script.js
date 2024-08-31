import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANJfQ3-7sQd0pcqaL9M6mXck8ybYttd-Y",
  authDomain: "todo-d0503.firebaseapp.com",
  projectId: "todo-d0503",
  storageBucket: "todo-d0503.appspot.com",
  messagingSenderId: "1089022508215",
  appId: "1:1089022508215:web:bcc5a253b8a5d3d39aa132",
  measurementId: "G-8ZQTVQHRVR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const ideasRef = collection(db, "ideas");

// Submit new idea
document.getElementById("ideaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const idea = document.getElementById("idea").value.trim();

  if (name && idea) {
    await addDoc(ideasRef, {
      name: name,
      idea: idea,
      likes: 0,
      timestamp: new Date()
    });
    document.getElementById("ideaForm").reset();
  }
});

// Display ideas and listen for changes
onSnapshot(query(ideasRef, orderBy("timestamp", "desc")), (snapshot) => {
  const ideasList = document.getElementById("ideasList");
  ideasList.innerHTML = ""; // Clear the list before updating

  snapshot.forEach(docSnapshot => {
    const ideaData = docSnapshot.data();
    const docId = docSnapshot.id;

    const listItem = document.createElement("li");
    listItem.className = "list-group-item";
    listItem.innerHTML = `
      <div>
        <strong>${escapeHTML(ideaData.name)}:</strong> ${escapeHTML(ideaData.idea)}
        <button class="btn btn-outline-primary btn-sm" data-id="${docId}">Like (${ideaData.likes})</button>

        <!-- Comment Section -->
        <div class="mt-3">
          <h6>Comments:</h6>
          <ul class="list-group" id="commentsList-${docId}">
            <!-- Comments will be appended here -->
          </ul>
          <form class="commentForm mt-2" data-id="${docId}">
            <div class="mb-2">
              <input type="text" class="form-control" placeholder="Your name" id="commentName-${docId}" required>
            </div>
            <div class="mb-2">
              <textarea class="form-control" placeholder="Your comment" id="commentText-${docId}" rows="2" required></textarea>
            </div>
            <button type="submit" class="btn btn-secondary btn-sm">Add Comment</button>
          </form>
        </div>
      </div>
    `;

    ideasList.appendChild(listItem);

    // Listen to comments for this idea
    listenToComments(docId);
  });

  // Attach event listeners to like buttons
  attachLikeButtonListeners();

  // Attach event listeners to comment forms
  attachCommentFormListeners();
});

// Function to attach like button event listeners
function attachLikeButtonListeners() {
  const likeButtons = document.querySelectorAll(".btn-outline-primary");
  likeButtons.forEach(button => {
    button.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");
      const ideaDoc = await getDoc(doc(db, "ideas", id));
      await updateDoc(doc(db, "ideas", id), {
        likes: ideaDoc.data().likes + 1
      });
    });
  });
}

// Function to handle comment submissions
function attachCommentFormListeners() {
  const commentForms = document.querySelectorAll(".commentForm");

  commentForms.forEach(form => {
    form.removeEventListener("submit", handleCommentFormSubmit); // Prevent multiple listeners
    form.addEventListener("submit", handleCommentFormSubmit);
  });
}

async function handleCommentFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const ideaId = form.getAttribute("data-id");
  const name = document.getElementById(`commentName-${ideaId}`).value.trim();
  const text = document.getElementById(`commentText-${ideaId}`).value.trim();

  if (name && text) {
    const commentsRef = collection(db, "ideas", ideaId, "comments");
    await addDoc(commentsRef, {
      name: name,
      text: text,
      timestamp: new Date()
    });
    form.reset(); // Clear the form after submission
  }
}

// Function to listen to and display comments in real-time
function listenToComments(ideaId) {
  const commentsRef = collection(db, "ideas", ideaId, "comments");
  const commentsQuery = query(commentsRef, orderBy("timestamp", "asc"));

  onSnapshot(commentsQuery, (snapshot) => {
    const commentsList = document.getElementById(`commentsList-${ideaId}`);
    commentsList.innerHTML = ""; // Clear existing comments

    snapshot.forEach(docSnapshot => {
      const commentData = docSnapshot.data();
      const listItem = document.createElement("li");
      listItem.className = "list-group-item";
      listItem.innerHTML = `
        <strong>${escapeHTML(commentData.name)}:</strong> ${escapeHTML(commentData.text)}
      `;
      commentsList.appendChild(listItem);
    });
  });
}

// Utility function to escape HTML to prevent XSS
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
