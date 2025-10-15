# 🧠 Knowledge Base Search Engine

A browser-based, client-side RAG (Retrieval-Augmented Generation) application that allows you to chat with your documents. Upload PDF and TXT files to create a temporary knowledge base and ask questions to get synthesized answers from Google's Gemini models.

## ✨ Features

- **Upload Multiple Files**: Supports both PDF and TXT file formats.
- **Drag & Drop**: Easy-to-use drag-and-drop interface for uploading files.
- **Client-Side Processing**: All file processing and API calls happen directly in your browser. No data is sent to a server.
- **Local Storage**: Your Google API key and uploaded document content are saved in your browser's local storage for session persistence.
- **LLM Integration**: Uses the Google Generative AI API to answer questions based on the content of your documents.
- **Model Selection**: Choose from different Gemini models (e.g., Gemini 1.5 Flash, Gemini 1.5 Pro) to tailor the response.
- **Source Citations**: The AI-generated answers are based on and cite the provided documents.
- **Responsive UI**: Built with Bootstrap for a clean and accessible interface on all devices.

## ⚙️ How It Works

This application implements a simple RAG pipeline entirely on the client-side:

1.  **Document Upload & Parsing**: When you upload a PDF or TXT file, its text content is extracted using `PDF.js` or the `FileReader` API.
2.  **Local Indexing**: The extracted text from all documents is stored in the browser's local storage, creating a searchable knowledge base.
3.  **Retrieval**: When you ask a question, the application performs a keyword-based search across all uploaded documents to find the top 3 most relevant text chunks.
4.  **Augmentation**: These relevant chunks (the "context") are combined with your original question into a detailed prompt.
5.  **Generation**: The complete prompt is sent to the selected Google Gemini model via its REST API.
6.  **Response**: The model generates a comprehensive answer based *only* on the provided context. The application then displays this answer, along with the source documents it referenced.

## 🛠️ Setup and Usage

To run this project locally, follow these steps:

1.  **Get a Google AI API Key**:
    * Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    * Create an API key.

2.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Dwijesh05/Knowledge_Base_Search_Engine.git
    cd Knowledge_Base_Search_Engine
    ```

3.  **Open the Application**:
    * Simply open the `index.html` file in your web browser (e.g., Chrome, Firefox).

4.  **Enter Your API Key**:
    * Paste your Google AI API key into the input field at the top of the page and click "Save API Key".

5.  **Start Chatting**:
    * Upload your documents and start asking questions!

## 💻 Technologies Used

-   **Frontend**: HTML5, CSS3, Vanilla JavaScript
-   **Styling**: Bootstrap 5 & Bootstrap Icons
-   **PDF Parsing**: PDF.js by Mozilla
-   **AI Model**: Google Gemini API

## Folder Structure

```
.
├── assets
│   ├── css/style.css
│   └── js/script.js
├── index.html
└── README.md

```
