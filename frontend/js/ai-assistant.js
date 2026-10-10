// =====================================================
// AGRI AI ASSISTANT - REAL GEMINI AI
// =====================================================

console.log("Agri AI Assistant loaded successfully");


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const messageInput = document.getElementById("userMessage");

    if (messageInput) {

        messageInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
            }

        });

    }

});


// =====================================================
// SEND MESSAGE TO REAL GEMINI AI
// =====================================================

function sendMessage() {

    const input = document.getElementById("userMessage");

    if (!input) {
        console.error("Message input not found");
        return;
    }

    const message = input.value.trim();

    if (message === "") {
        return;
    }


    // Show user message
    addUserMessage(message);


    // Clear input
    input.value = "";


    // Show typing indicator
    showTyping();


    // =================================================
    // CONNECT TO NODE.JS AI SERVICE
    // =================================================

    fetch("http://localhost:3000/api/chat", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: message
        })

    })

    .then(function (response) {

        if (!response.ok) {
            throw new Error(
                "AI server returned status " + response.status
            );
        }

        return response.json();

    })

    .then(function (data) {

        removeTyping();


        if (data.answer) {

            addAIMessage(data.answer);

        } else {

            addAIMessage(
                "Sorry, I could not generate an answer. Please try again."
            );

        }

    })

    .catch(function (error) {

        console.error("AI Service Error:", error);

        removeTyping();

        addAIMessage(`
            <p>⚠️ Sorry, I couldn't connect to Agri AI.</p>
            <p>Please make sure the AI service is running.</p>
        `);

    });

}


// =====================================================
// QUICK QUESTIONS
// =====================================================

function askQuickQuestion(question) {

    const input = document.getElementById("userMessage");

    if (!input) {
        return;
    }

    input.value = question;

    sendMessage();

}


// =====================================================
// ADD USER MESSAGE
// =====================================================

function addUserMessage(message) {

    const chat = document.getElementById("chatMessages");

    if (!chat) {
        return;
    }


    const messageDiv = document.createElement("div");

    messageDiv.className = "message user-message";


    messageDiv.innerHTML = `
        <div class="message-avatar">👨‍🌾</div>

        <div class="message-content">

            <span class="message-name">
                You
            </span>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;


    chat.appendChild(messageDiv);

    scrollToBottom();

}


// =====================================================
// ADD AI MESSAGE
// =====================================================

function addAIMessage(message) {

    const chat = document.getElementById("chatMessages");

    if (!chat) {
        return;
    }


    const messageDiv = document.createElement("div");

    messageDiv.className = "message ai-message";


    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>

        <div class="message-content">

            <span class="message-name">
                Agri AI
            </span>

            <div class="ai-response">
                ${formatAIResponse(message)}
            </div>

        </div>
    `;


    chat.appendChild(messageDiv);

    scrollToBottom();

}


// =====================================================
// FORMAT AI RESPONSE
// =====================================================

function formatAIResponse(message) {

    if (!message) {
        return "";
    }


    // Escape HTML first for safety
    let formatted = escapeHtml(message);


    // Convert **text** to bold
    formatted = formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    // Convert markdown bullet points
    formatted = formatted.replace(
        /^\s*[\*\-]\s+(.*)$/gm,
        "• $1"
    );


    // Convert numbered lists
    formatted = formatted.replace(
        /^\s*(\d+)\.\s+(.*)$/gm,
        "$1. $2"
    );


    // Convert line breaks
    formatted = formatted.replace(/\n/g, "<br>");


    return formatted;

}


// =====================================================
// SHOW TYPING INDICATOR
// =====================================================

function showTyping() {

    const chat = document.getElementById("chatMessages");

    if (!chat) {
        return;
    }


    // Prevent duplicate indicator
    removeTyping();


    const typing = document.createElement("div");

    typing.id = "typingIndicator";

    typing.className = "message ai-message";


    typing.innerHTML = `
        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">

            <span class="message-name">
                Agri AI
            </span>

            <p>
                Thinking... 🌱
            </p>

        </div>
    `;


    chat.appendChild(typing);

    scrollToBottom();

}


// =====================================================
// REMOVE TYPING INDICATOR
// =====================================================

function removeTyping() {

    const typing =
        document.getElementById("typingIndicator");

    if (typing) {
        typing.remove();
    }

}


// =====================================================
// SCROLL CHAT TO BOTTOM
// =====================================================

function scrollToBottom() {

    const chat =
        document.getElementById("chatMessages");

    if (!chat) {
        return;
    }


    chat.scrollTop = chat.scrollHeight;

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}