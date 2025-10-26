LLM Review Analyzer // MLOps Pipeline Dashboard

This project is an advanced, production-ready web application designed for real-time analysis of customer reviews. It leverages the Google Gemini API to perform a suite of complex NLP tasks, presenting the results in a high-tech, responsive dashboard.

The entire application runs client-side (HTML, CSS, JS) and is designed to be a prime portfolio piece demonstrating skills in Full-Stack Development, LLM Integration, and MLOps principles.

(Note: Replace this with a screenshot of your running application)

🚀 Core Features

This dashboard provides a comprehensive toolkit for product, support, and data science teams:

Dual Input Modes: Analyze reviews one-by-one via a Single Text Input or process thousands at once with Batch CSV Upload.

Real-Time Visualization: The Batch mode provides an immediate Sentiment Distribution Bar Chart (using Chart.js) for quick data aggregation.

Multi-Language Globalization: Features a language selector to accurately process reviews in multiple languages (e.g., English, Spanish, Tamil, Japanese, etc.).

Multi-Faceted LLM Analysis:

Sentiment Analysis: Classifies review sentiment (Positive, Negative, Neutral) with a confidence score.

LLM Summarization: Generates a concise, 1-2 sentence summary of the review.

Aspect-Based Sentiment Analysis (ABSA): Extracts key topics (e.g., "Battery Life," "Price") and assigns a specific sentiment to each, providing deep, actionable insights.

Generative Action: Includes a "Generate Response Draft" feature to create an empathetic customer service reply on-demand.

Robust MLOps Pipeline (Batch Mode):

Client-Side CSV Parsing: Reads and processes CSV files directly in the browser.

Data Annotation: Generates a new, downloadable CSV with all the LLM analysis (summary, sentiment, aspects) appended as new columns.

Advanced Error Logging: Captures and includes detailed API error messages in a dedicated llm_error_details column for easy debugging.

🛠️ Tech Stack

Frontend: HTML5, Tailwind CSS (via CDN)

Logic: Modern JavaScript (ES6+)

AI/LLM: Google Gemini API (for all NLP tasks)

Visualization: Chart.js (via CDN)

Dev Environment: VS Code + Live Server

📦 Local Setup & Installation

To run this project on your local machine, follow these steps:

Clone the Repository (or download files):

git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
cd YOUR_REPO_NAME


File Structure:
Ensure both index.html and script.js are in the same root directory.

Get Your API Key:

Create a Google Gemini API Key at Google AI Studio.

Configure script.js:

Open script.js in VS Code.

Find the const LOCAL_API_KEY variable near the top of the file.

Paste your Gemini API Key into the empty string:

// --- CONFIGURATION ---
// PASTE YOUR GEMINI API KEY HERE FOR LOCAL TESTING
const LOCAL_API_KEY = "AIzaSy...YOUR_KEY_HERE"; 
// ---------------------


Run with Live Server:

In VS Code, install the Live Server extension (by Ritwick Dey).

Right-click on index.html and select "Open with Live Server".

Your browser will open the application, and all API calls will now be authenticated.

☁️ Deployment

This application is fully client-side and can be hosted as a static website.

Platforms: Vercel, Netlify, or GitHub Pages are excellent free alternatives for deployment.
