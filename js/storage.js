const STORAGE_KEYS = {
   writingTask: "writingTask",
   currentUser: "currentUser",
   writingDraft: "writingDraft",
   lastSubmission: "lastSubmission",
};

function saveToStorage(key, value) {
   localStorage.setItem(key, JSON.stringify(value));
}

function getFromStorage(key) {
   const data = localStorage.getItem(key);
   try { return data ? JSON.parse(data) : null; } catch { return null; }
}

function removeFromStorage(key) {
   localStorage.removeItem(key);
}