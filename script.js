// let's first get this input value and then add it as message element in the chat list

const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

// api configuration
const API_KEY = "AIzaSyBcam6dNMt66jLPnCmdC4nAzMGW3WhhouU";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () =>{
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    // apply the stored theme
        document.body.classList.toggle("light_mode" , isLightMode );
        toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

        // restore saved chats
        chatList.innerHTML = savedChats || "";
        document.body.classList.toggle("hide-header", savedChats);

        
        chatList.scrollTo(0, chatList.scrollHeight); // scrool to the bottom
} 

loadLocalstorageData();

// create a new message element and return it
const createMessageElement = (content, ...classes) =>{
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(()=>{
        //append each word to the text element with space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        // if allwords are displayed
        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); // save chats to local storgae
        }
        chatList.scrollTo(0, chatList.scrollHeight);
    },75);
}

// fetch response fromthe api based on user message
const generateAPIResponse = async (incomingMessageDiv) =>{
    const textElement = incomingMessageDiv.querySelector(".text"); // get text 
    // send a post request ro the api with the user message
try {
    const response = await fetch(API_URL, {
        method: "POST" ,
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify({
            contents: [{
                role: "user", 
                parts:[{text: userMessage }]
            }]
        })
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.error.message);

    // get the api response text
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
} catch (error){
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
}finally{
    incomingMessageDiv.classList.remove("loading");
}
}

// show a loading animation while waiting for the api response
const showLoadingAnimation = () => {
     const html =  `<div class="message-content">
                <img src="images/gemini.svg" alt="gemini image" class="avatar">
                <p class = "text"></p>
                    <div class="loading-indicator">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                    </div>
            </div>
            <span onclick= "copyMessage(this)" class="icon material-symbols-rounded">content_copy  </span>`;

         const incomingMessageDiv = createMessageElement(html, "outgoing", "loading");
         chatList.appendChild(incomingMessageDiv);

         generateAPIResponse(incomingMessageDiv);
}

// copy message text to yhr clipboard
const copyMessage = (copyIcon)=>{
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; // shok tick icon
    setTimeout(()=>copyIcon.innerText = "content_copy", 1000); // revert icon after 1 second
}
// handle sending outgoing chat message
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return; // exit if there is no message

    isResponseGenerating = true;

    // let's create a message element of entered text and add it to the chat list
    const html =  `<div class="message-content">
                <img src="images/user.jpg" alt="user image" class="avatar">
                <p class = "text"></p>
            </div>`;

         const outgoingMessageDiv = createMessageElement(html, "outgoing");
         outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;
         chatList.appendChild(outgoingMessageDiv);

         typingForm.reset(); // clear input fiels
         chatList.scrollTo(0, chatList.scrollHeight);// scroll to the bottom
         document.body.classList.add("hide-header"); // hide the header once the start
         setTimeout(showLoadingAnimation, 500); // show leading animation after a delay
    
}

// set usermessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// toggle between light and dark themes
toggleThemeButton.addEventListener("click", ()=> {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// delete all the chats when you tap on delete button
deleteChatButton.addEventListener("click", ()=> {
    if(confirm("Are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
});

// prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e)=>{
    e.preventDefault();

    handleOutgoingChat();

});


