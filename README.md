⚙️ LLM Review Analyzer // MLOps Pipeline Dashboard

A real-time, AI-powered review intelligence system — combining LLM-driven text analysis, data visualization, and MLOps automation in one sleek dashboard.

🌐 Overview

LLM Review Analyzer is a fully client-side web app that performs real-time multilingual analysis of customer reviews using Google Gemini API.
It delivers sentiment analytics, LLM summarization, and aspect-based insights — all visualized through an interactive dashboard.

Built as a portfolio-grade project, it demonstrates skills across:

🧠 Full-Stack Web Development

🤖 Large Language Model (LLM) Integration

⚡ MLOps Workflow Automation

🖼️ Preview

(Replace this section with a screenshot or a short GIF of your running application)


🚀 Core Features
🧩 Dual Input Modes

📝 Single Text Mode: Instantly analyze individual reviews.

📂 Batch CSV Upload: Process thousands of reviews with one click.

📊 Real-Time Visualization

Interactive Sentiment Distribution Bar Chart built with Chart.js.

Immediate insights on overall customer sentiment.

🌍 Multi-Language Globalization

Supports languages like English, Spanish, Tamil, Japanese, and more.

Accurate multilingual NLP powered by Gemini.

🧠 Multi-Faceted LLM Analysis
Feature	Description
💬 Sentiment Analysis	Classifies text as Positive / Negative / Neutral with confidence scores
🪶 LLM Summarization	Generates a concise 1–2 sentence review summary
🔍 Aspect-Based Sentiment (ABSA)	Detects topics (e.g., “Battery Life”, “Price”) and rates each individually
✉️ Generate Response Draft	Creates an empathetic, brand-aligned customer reply automatically
🧰 Robust MLOps Pipeline (Batch Mode)

📑 Client-Side CSV Parsing: No backend required — runs directly in your browser.

🏷️ Data Annotation: Automatically appends LLM outputs (summary, sentiment, aspects) into a downloadable CSV.

🧾 Error Logging: Adds llm_error_details column for transparent debugging and monitoring.

🧱 Tech Stack
Layer	Technology
🎨 Frontend	HTML5, Tailwind CSS (via CDN)
⚙️ Logic	Modern JavaScript (ES6+)
🧠 AI / LLM	Google Gemini API
📊 Visualization	Chart.js
🧩 Dev Tools	VS Code + Live Server
💻 Local Setup & Installation
1️⃣ Clone the Repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

2️⃣ Project Structure
📦 YOUR_REPO_NAME
 ┣ 📜 index.html
 ┣ 📜 script.js
 ┗ 📂 assets/ (optional: screenshots, icons)

3️⃣ Configure API Key

Open script.js and insert your Google Gemini API Key:

// --- CONFIGURATION ---
const LOCAL_API_KEY = "AIzaSy...YOUR_KEY_HERE";
// ---------------------

4️⃣ Run Locally

Open index.html in VS Code

Right-click → “Open with Live Server”

Your browser will auto-launch the app.

☁️ Deployment Options

Since the app is 100% client-side, you can deploy easily on:

🔗 Vercel

🌐 Netlify

🧱 GitHub Pages

No backend. No servers. Just plug & play.

🧭 Future Enhancements

🧩 Add user authentication for API key management.

💬 Integrate voice-to-text for spoken reviews.

📈 Include time-series analytics for trends across datasets.

🧠 Support custom fine-tuned LLMs (Gemini or OpenAI models).

🏁 Project Summary
Skill Area	Description
💻 Full-Stack	Built end-to-end with HTML, Tailwind, and JavaScript
🧠 AI Integration	Integrated Gemini API for NLP and LLM tasks
📊 Data Visualization	Dynamic, real-time sentiment dashboards
⚙️ MLOps Principles	Automated data pipeline with error tracking and export
