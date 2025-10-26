/* * =======================================================================
 * MLOPS ARCHITECTURE DOCUMENTATION (For Resume Impact)
 * =======================================================================
 * * This application currently runs the LLM pipeline client-side (in the browser).
 * * PRODUCTION ARCHITECTURE UPGRADE:
 * * 1. FRONTEND: This HTML/JS structure remains the user interface.
 * 2. BACKEND API: The LLM calls would be moved to a robust, scalable backend 
 * service (e.g., Python/FastAPI) to handle authentication, rate limiting,
 * and payload transformation, rather than exposing the API key client-side.
 * 3. CONTAINERIZATION (Docker): The FastAPI service would be containerized 
 * using Docker to ensure dependency consistency and portability.
 * 4. ORCHESTRATION: The Docker container would be deployed to a cloud platform
 * (AWS ECS/Lambda, Azure ML, or Google Cloud Run).
 * 5. DATA PIPELINE: For batch processing, an asynchronous pipeline (e.g., 
 * using queues like Redis/Kafka) would be implemented to handle thousands 
 * of reviews without browser timeouts.
 * * This code demonstrates the core LLM logic that would be moved to the backend.
 * =======================================================================
 */

// ========================================================================
// !!! IMPORTANT: LOCAL VS CODE FIX !!!
// Set this to your actual Gemini API Key (obtainable from Google AI Studio) 
// if you are running this code locally outside of the canvas environment.
// For deployment to S3 or GitHub Pages, you MUST use a serverless function
// or backend to protect this key.
// ========================================================================
const apiKey = "Api_key"; // <--- KEY INTEGRATED HERE
// ========================================================================


const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const ANALYZE_ENDPOINT = `${API_BASE_URL}/${MODEL_NAME}:generateContent?key=${apiKey}`;

// Chart instance holder
let sentimentChartInstance = null;
const CHART_COLORS = {
    POSITIVE: '#22c55e', 
    NEGATIVE: '#ef4444', 
    NEUTRAL: '#facc15',
    UNKNOWN: '#6b7280'
};

// DOM Elements
const reviewInput = document.getElementById('review-input');
const analyzeBtn = document.getElementById('analyze-btn');
const loadingDiv = document.getElementById('loading');
const resultsCard = document.getElementById('results-card');
const singleAnalysisArea = document.getElementById('single-analysis-area');
const batchSummaryArea = document.getElementById('batch-summary-area');
const batchStatusText = document.getElementById('batch-status-text');
const downloadLink = document.getElementById('download-link');
const sentimentOutput = document.getElementById('sentiment-output');
const summaryOutput = document.getElementById('summary-output');
const topicsOutput = document.getElementById('topics-output'); 
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const progressBar = document.getElementById('progress-bar');
const loadingText = document.getElementById('loading-text');
const inputModeRadios = document.querySelectorAll('input[name="input-mode"]');
const singleInputArea = document.getElementById('single-input-area');
const batchInputArea = document.getElementById('batch-input-area');
const csvFileInput = document.getElementById('csv-file-input');
const suggestResponseBtn = document.getElementById('suggest-response-btn'); 
const responseDraftOutput = document.getElementById('response-draft-output'); 
const suggestionLoading = document.getElementById('suggestion-loading');
const languageSelector = document.getElementById('language-selector');

let currentMode = 'single';
let batchResults = [];
let totalBatchItems = 0;
let processedBatchItems = 0;

// --- INPUT MODE TOGGLE ---
inputModeRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        currentMode = event.target.value;
        if (currentMode === 'single') {
            singleInputArea.classList.remove('hidden');
            batchInputArea.classList.add('hidden');
            suggestResponseBtn.classList.remove('hidden'); // Show response button in single mode
        } else {
            singleInputArea.classList.add('hidden');
            batchInputArea.classList.remove('hidden');
            suggestResponseBtn.classList.add('hidden'); // Hide response button in batch mode
        }
        resultsCard.classList.add('hidden'); // Hide results when switching mode
        batchSummaryArea.classList.add('hidden');
        singleAnalysisArea.classList.remove('hidden'); // Reset to default single view
        responseDraftOutput.classList.add('hidden'); // Reset suggestion draft
        responseDraftOutput.textContent = '';
    });
});

// Utility function to display custom messages (positioned bottom-right)
function showMessage(text, type = 'error') {
    messageText.textContent = text;
    messageBox.classList.remove('hidden', 'bg-red-900', 'text-red-300', 'bg-green-900', 'text-green-300', 'bg-accent-purple/90', 'text-text-light');
    messageBox.classList.add('opacity-100');
    
    if (type === 'error') {
        messageBox.classList.add('bg-red-900', 'text-red-300');
    } else if (type === 'success') {
        messageBox.classList.add('bg-green-900', 'text-green-300');
    } else if (type === 'info') {
        messageBox.classList.add('bg-accent-purple/90', 'text-text-light');
    }
    // Hide after 5 seconds
    setTimeout(() => {
        messageBox.classList.remove('opacity-100');
        messageBox.classList.add('hidden');
    }, 5000);
}

// --- INTERACTIVE LOADING SIMULATION ---
let progressInterval;

function startProgressSimulation() {
    let progress = 0;
    progressBar.style.width = '0%';
    
    if (currentMode === 'single') {
        loadingText.textContent = 'INITIATING LLM PIPELINE...';
    }
    
    const messages = [
        "STATE: MODEL_LOADING: Awaiting API response...",
        "STATE: PROCESSING: Structured analysis initialized...",
        "STATE: SUMMARIZING: Feature extraction complete...",
        "STATE: FINALIZING: Rendering output...",
    ];
    let messageIndex = 0;
    
    progressInterval = setInterval(() => {
        if (currentMode === 'single') {
            // Standard single-mode simulation
            if (progress < 95) {
                progress += 5 + Math.random() * 5; 
                if (progress > 95) progress = 95;
                progressBar.style.width = `${progress}%`;
                
                if (progress > 25 * (messageIndex + 1) && messageIndex < messages.length) {
                    loadingText.textContent = messages[messageIndex];
                    messageIndex++;
                }
            } else {
                progress += 0.5;
                progressBar.style.width = `${progress}%`;
            }
        } else {
            // Batch mode progress based on real-time item count
            if (totalBatchItems > 0) {
                progress = (processedBatchItems / totalBatchItems) * 100;
                progressBar.style.width = `${progress}%`;
                loadingText.textContent = `BATCH_PROGRESS: Item ${processedBatchItems} of ${totalBatchItems} processed...`;
            }
        }
    }, 500);
}

function completeProgressSimulation() {
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    loadingText.textContent = 'STATE: TASK_COMPLETE: Data received.';
}


// --- API CALL HANDLERS (Same robust logic with exponential backoff) ---

async function fetchWithRetry(url, options, maxRetries = 3) {
    // If API key is missing for local run, throw error early.
    if (!apiKey) {
        throw new Error("API Key Missing. Please insert your Gemini API Key in script.js for local VS Code testing.");
    }
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            
            if (response.status === 429 && i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Extract detailed error message from response text if available
            const errorDetails = await response.text();
            try {
                const jsonError = JSON.parse(errorDetails);
                // Enhanced error message for the 403 case
                if (response.status === 403) {
                    throw new Error("403 Forbidden: Check your API Key's validity or permissions.");
                }
                throw new Error(jsonError.error?.message || `API failed with status ${response.status}`);
            } catch (e) {
                 if (e.message.includes("403 Forbidden")) throw e;
                 throw new Error(`API failed with status ${response.status}: ${errorDetails.substring(0, 100)}...`);
            }
           
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// --- Core Prompt Construction ---
function getSystemInstructionPrefix() {
    const language = languageSelector.value;
    // Add instruction to handle language and ensure clean JSON output
    return `You are an expert text analyzer. The review is written in ${language}. Ensure the entire output is strictly valid JSON format.`;
}


// 1. Sentiment Analysis (Structured JSON)
async function getSentiment(review) {
    const sentimentSchema = {
        type: "OBJECT",
        properties: {
            "sentiment": {
                "type": "STRING",
                "description": "The overall sentiment of the review.",
                "enum": ["POSITIVE", "NEGATIVE", "NEUTRAL"]
            },
            "confidence_score": {
                "type": "NUMBER",
                "description": "A calculated confidence score (0.0 to 1.0) for the predicted sentiment."
            }
        },
        required: ["sentiment", "confidence_score"],
        propertyOrdering: ["sentiment", "confidence_score"]
    };

    const payload = {
        contents: [{ parts: [{ text: `Analyze the following customer review and determine its overall sentiment: "${review}"` }] }],
        systemInstruction: {
            parts: [{ text: getSystemInstructionPrefix() + " Your task is to classify the overall sentiment." }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: sentimentSchema
        }
    };

    const response = await fetchWithRetry(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) throw new Error("Could not extract sentiment JSON from API response.");

    return JSON.parse(jsonText);
}

// 2. Summarization (Standard Text Generation)
async function getSummary(review) {
    const payload = {
        contents: [{ parts: [{ text: `Provide a concise, 1-2 sentence summary of the following customer review: "${review}"` }] }],
        systemInstruction: {
            parts: [{ text: `You are an expert review summarization engine. The review is written in ${languageSelector.value}. Ensure the summary is highly accurate and strictly limited to two sentences.` }]
        }
    };

    const response = await fetchWithRetry(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No summary could be generated.";
}

// 3. Aspect-Based Topic Extraction (Structured JSON - ADVANCED FEATURE)
async function getAspects(review) {
    const aspectSchema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                "topic": {
                    "type": "STRING",
                    "description": "A key product aspect or topic discussed."
                },
                "sentiment": {
                    "type": "STRING",
                    "description": "The specific sentiment for this topic.",
                    "enum": ["POSITIVE", "NEGATIVE", "NEUTRAL"]
                }
            },
            required: ["topic", "sentiment"]
        }
    };

    const payload = {
        contents: [{ parts: [{ text: `Analyze the following review and extract 3 to 5 key aspects. For each aspect, provide its specific sentiment: "${review}"` }] }],
        systemInstruction: {
            parts: [{ text: getSystemInstructionPrefix() + " Your task is to extract aspects and their specific sentiment." }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: aspectSchema
        }
    };

    const response = await fetchWithRetry(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) throw new Error("Could not extract aspects JSON from API response.");
    
    try {
        const aspects = JSON.parse(jsonText);
        return Array.isArray(aspects) ? aspects : [];
    } catch (e) {
        console.warn("Failed to parse aspects array, returning empty:", jsonText);
        return [];
    }
}

// 4. Generate Customer Response (Text Generation - UTILITY FEATURE)
async function generateResponseDraft(review, sentiment) {
    const language = languageSelector.value;
    const systemInstruction = (sentiment === 'POSITIVE') 
        ? `You are a friendly customer service agent. The response must be in ${language}. Write a brief, grateful, and encouraging reply to the customer's positive review. Do not exceed 3 sentences.`
        : `You are an empathetic customer service agent. The response must be in ${language}. Write a brief, apologetic, and solution-focused reply to the customer's negative or neutral review. Mention fixing the specific issue if possible. Do not exceed 4 sentences.`;

    const userPrompt = `Draft a customer service response to the following review: "${review}"`;
    
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        }
    };

    const response = await fetchWithRetry(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate a response draft.";
}

// --- RENDER FUNCTIONS ---

function renderSentiment(sentiment, confidence) {
    const label = sentiment.toUpperCase();
    let color, icon;

    switch (label) {
        case 'POSITIVE':
            color = CHART_COLORS.POSITIVE; 
            icon = '▲';
            break;
        case 'NEGATIVE':
            color = CHART_COLORS.NEGATIVE; 
            icon = '▼';
            break;
        case 'NEUTRAL':
            color = CHART_COLORS.NEUTRAL; 
            icon = '—';
            break;
        default:
            color = CHART_COLORS.UNKNOWN; 
            icon = '❓';
    }
    
    // Apply color to the border and a powerful glow
    sentimentOutput.style.borderColor = color;
    sentimentOutput.style.boxShadow = `0 0 20px ${color}80`; 

    sentimentOutput.innerHTML = `
        <p class="text-6xl font-extrabold mb-3 leading-none" style="color: ${color};">${icon}</p>
        <h4 class="text-4xl font-extrabold tracking-widest" style="color: ${color};">${label}</h4>
        <p class="text-sm text-text-muted mt-4 font-mono">CONFIDENCE_INDEX:</p>
        <p class="text-2xl font-bold font-mono" style="color: ${color};">${(confidence * 100).toFixed(2)}%</p>
    `;
}

function renderSummary(summary) {
    summaryOutput.innerHTML = `<p class="leading-relaxed text-text-light">${summary}</p>`;
}

function getAspectColor(sentiment) {
    return CHART_COLORS[sentiment.toUpperCase()] || CHART_COLORS.UNKNOWN;
}

function renderAspects(aspects) {
    topicsOutput.innerHTML = ''; // Clear previous chips
    if (aspects.length === 0) {
        topicsOutput.innerHTML = `<p class="text-text-muted">No distinct key aspects were found.</p>`;
        return;
    }
    aspects.forEach(aspect => {
        const color = getAspectColor(aspect.sentiment);
        const chip = document.createElement('span');
        chip.className = 'topic-chip';
        chip.style.backgroundColor = `${color}30`;
        chip.style.color = color;
        chip.style.borderColor = color;
        chip.style.boxShadow = `0 0 5px ${color}40`;
        chip.textContent = `${aspect.topic} (${aspect.sentiment[0]})`;
        topicsOutput.appendChild(chip);
    });
}

function renderSentimentChart(sentimentCounts) {
    const labels = ['POSITIVE', 'NEGATIVE', 'NEUTRAL'];
    const data = labels.map(label => sentimentCounts[label] || 0);
    const colors = [CHART_COLORS.POSITIVE, CHART_COLORS.NEGATIVE, CHART_COLORS.NEUTRAL];

    // Destroy previous chart instance if it exists
    if (sentimentChartInstance) {
        sentimentChartInstance.destroy();
    }

    const ctx = document.getElementById('sentiment-chart').getContext('2d');
    sentimentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.map(c => `${c}B0`), // Semi-transparent for glow effect
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Reviews: ${context.parsed.y}`;
                        }
                    },
                    backgroundColor: '#1A1A22',
                    borderColor: '#A32DFF',
                    borderWidth: 1,
                    titleColor: '#e0e0e0',
                    bodyColor: '#e0e0e0',
                }
            },
            scales: {
                x: {
                    grid: { color: '#333333' },
                    ticks: { color: '#e0e0e0' }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#333333' },
                    ticks: { 
                        color: '#e0e0e0',
                        precision: 0 
                    }
                }
            }
        }
    });
}

// --- BATCH PROCESSING & CSV UTILITIES ---

function csvToBlob(data) {
    const csv = data.map(row => 
        row.map(cell => {
            let s = String(cell);
            // If the cell contains comma or quotes, enclose it in double quotes
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                s = s.replace(/"/g, '""'); // Escape double quotes
                return `"${s}"`;
            }
            return s;
        }).join(',')
    ).join('\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

async function processBatch(file) {
    const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, FAILED: 0 };
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const csvText = e.target.result;
                const lines = csvText.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    throw new Error("CSV must contain a header and at least one review.");
                }

                // Robustly parse header row
                const headerLine = lines[0].trim();
                const header = headerLine.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
                    .map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
                    
                const reviewColumnIndex = header.indexOf('review') !== -1 ? header.indexOf('review') : header.indexOf('text');

                if (reviewColumnIndex === -1) {
                    throw new Error("CSV file must contain a column named 'review' or 'text'.");
                }

                // Parse data rows
                const originalData = lines.slice(1).map(line => {
                    if (!line.trim()) return null;
                    const cells = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                    if (!cells) return {};

                    const values = cells.map(cell => cell.replace(/^"|"$/g, '').trim());
                    let obj = {};
                    header.forEach((h, i) => obj[h] = values[i] || "");
                    return obj;
                }).filter(obj => obj !== null);

                totalBatchItems = originalData.length;
                processedBatchItems = 0;
                // UPDATED header for aspect sentiment and error logging
                batchResults = [header.concat(['llm_sentiment', 'llm_confidence', 'llm_summary', 'llm_topics', 'llm_aspect_sentiment', 'llm_error_details'])]; 

                for (const item of originalData) {
                    const review = item[header[reviewColumnIndex]];
                    
                    // Skip if review is too short
                    if (!review || review.split(/\s+/).filter(word => word.length > 0).length < 20) {
                        batchResults.push(Object.values(item).concat(['N/A', 'N/A', 'Review too short or empty', 'N/A', 'N/A', 'Skipped: Review too short.']));
                        processedBatchItems++;
                        continue;
                    }

                    try {
                        // Run all three API calls concurrently
                        const [sentimentResult, summaryText, aspectsArray] = await Promise.all([
                            getSentiment(review),
                            getSummary(review),
                            getAspects(review) // Now gets structured aspects with sentiment
                        ]);
                        
                        // Aggregate sentiment count
                        sentimentCounts[sentimentResult.sentiment.toUpperCase()]++;

                        // Separate topics and aspect sentiments for CSV output
                        const topicsString = aspectsArray.map(a => a.topic).join('; ');
                        const aspectSentimentString = aspectsArray.map(a => `${a.topic}:${a.sentiment}`).join('; ');

                        const rowData = Object.values(item).concat([
                            sentimentResult.sentiment,
                            sentimentResult.confidence_score.toFixed(4),
                            summaryText,
                            topicsString,
                            aspectSentimentString,
                            'SUCCESS' // Log SUCCESS for good run
                        ]);
                        batchResults.push(rowData);
                    } catch (apiError) {
                        console.error("Batch item API error:", apiError);
                        sentimentCounts.FAILED++; // Track failed items
                        
                        // Capture detailed error message
                        const errorLog = String(apiError).replace(/Error: /, '').replace(/,/g, ';'); 

                        batchResults.push(Object.values(item).concat(['ERROR', '0.00', 'API analysis failed for this item.', 'ERROR', 'ERROR', errorLog]));
                    }
                    processedBatchItems++;
                }
                resolve(sentimentCounts);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}


// --- MAIN EVENT HANDLER ---

analyzeBtn.addEventListener('click', async () => {
    // Reset state
    resultsCard.classList.add('hidden');
    resultsCard.classList.remove('animate-result-show');
    loadingDiv.classList.remove('hidden');
    messageBox.classList.add('hidden');
    
    // Start the interactive progress bar
    startProgressSimulation();
    
    try {
        if (currentMode === 'single') {
            // --- SINGLE MODE EXECUTION (Sentiment, Summary, and Aspects) ---
            const review = reviewInput.value.trim();
            const wordCount = review.split(/\s+/).filter(word => word.length > 0).length;

            if (wordCount < 20) {
                completeProgressSimulation();
                loadingDiv.classList.add('hidden');
                showMessage("SYSTEM_ALERT: Minimum 20 words required for analysis.", 'error');
                return;
            }
            
            // Run three primary API calls concurrently
            const [sentimentResult, summaryText, aspectsArray] = await Promise.all([
                getSentiment(review),
                getSummary(review),
                getAspects(review)
            ]);

            completeProgressSimulation();
            renderSentiment(sentimentResult.sentiment, sentimentResult.confidence_score);
            renderSummary(summaryText);
            renderAspects(aspectsArray); // Render detailed aspects with sentiment
            
            // Store sentiment for response generation button
            suggestResponseBtn.dataset.sentiment = sentimentResult.sentiment;

            // Show single results view
            batchSummaryArea.classList.add('hidden');
            singleAnalysisArea.classList.remove('hidden');
            resultsCard.classList.remove('hidden');
            resultsCard.classList.add('animate-result-show'); 
            showMessage("TASK_COMPLETE: Analysis executed successfully.", 'success');
            
            // Reset suggestion draft state
            responseDraftOutput.classList.add('hidden');
            responseDraftOutput.textContent = '';
            suggestResponseBtn.disabled = false;
            suggestResponseBtn.textContent = 'Generate Response Draft ✨';


        } else {
            // --- BATCH MODE EXECUTION (CSV) ---
            const file = csvFileInput.files[0];
            if (!file) {
                completeProgressSimulation();
                loadingDiv.classList.add('hidden');
                showMessage("SYSTEM_ALERT: Please upload a CSV file.", 'error');
                return;
            }
            
            showMessage("BATCH_MODE: Initiating file upload and processing...", 'info');
            const sentimentCounts = await processBatch(file); // Get counts from batch processor
            completeProgressSimulation();
            
            // Render the chart
            renderSentimentChart(sentimentCounts);

            // Create Blob and link for download
            const csvBlob = csvToBlob(batchResults);
            const url = URL.createObjectURL(csvBlob);
            downloadLink.href = url;
            
            // Show batch results view
            singleAnalysisArea.classList.add('hidden');
            batchSummaryArea.classList.remove('hidden');
            
            const failedCount = sentimentCounts.FAILED;
            const successCount = totalBatchItems - failedCount;
            batchStatusText.innerHTML = `
                Analyzed: <span class="text-accent-purple font-bold">${successCount}</span>
                | Failed: <span class="text-red-400 font-bold">${failedCount}</span>
                | Total: <span class="text-text-light font-bold">${totalBatchItems}</span>
                <br>Download the annotated file below.`;

            resultsCard.classList.remove('hidden');
            resultsCard.classList.add('animate-result-show');
            showMessage("BATCH_COMPLETE: Annotated file and visualization ready.", 'success');
        }

    } catch (error) {
        console.error("Analysis Failed:", error);
        completeProgressSimulation();
        loadingDiv.classList.add('hidden');
        showMessage(`ERROR: ${error.message || 'API or processing failed.'}`, 'error');
    }
});

// --- RESPONSE SUGGESTION HANDLER (NEW) ---
suggestResponseBtn.addEventListener('click', async () => {
    const review = reviewInput.value.trim();
    const sentiment = suggestResponseBtn.dataset.sentiment;

    if (!review || review.split(/\s+/).filter(word => word.length > 0).length < 20) {
         showMessage("SYSTEM_ALERT: Analysis required before generating a response.", 'error');
         return;
    }
    
    suggestionLoading.classList.remove('hidden');
    suggestResponseBtn.disabled = true;
    responseDraftOutput.classList.add('hidden');
    responseDraftOutput.textContent = '';

    try {
        const draft = await generateResponseDraft(review, sentiment);
        responseDraftOutput.textContent = draft;
        responseDraftOutput.classList.remove('hidden');
        showMessage("RESPONSE_DRAFT: Draft generated successfully.", 'success');
    } catch (error) {
        console.error("Draft Generation Failed:", error);
        responseDraftOutput.textContent = "Error generating draft response.";
        responseDraftOutput.classList.remove('hidden');
        showMessage("ERROR: Could not generate response draft.", 'error');
    } finally {
        suggestionLoading.classList.add('hidden');
        suggestResponseBtn.disabled = false;
        suggestResponseBtn.textContent = 'Generate Response Draft ✨';
    }
});
