// ✅ Updated Logout function
function logout() {
    // This clears the user and any pending booking data
    sessionStorage.clear();

    // Redirect to login
    window.location.href = "login.html";
}