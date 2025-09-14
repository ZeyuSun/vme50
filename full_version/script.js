// --- GLOBAL STATE ---
let stagedFile = null;
let currentMode = null; // 'make' or 'find'
let currentItemProtocol = null;
let currentAnalysis = null;
let audioPlayer = null;
let currentPlayingStepElement = null;
const audioCache = new Map();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    audioPlayer = document.getElementById('audio-player');
    setupEventListeners();
});

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Page 1: Upload
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', (e) => e.currentTarget.classList.remove('dragover'));
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files));

    // Page 2: Choice
    document.getElementById('back-to-upload').addEventListener('click', () => showPage('upload-page'));
    document.getElementById('make-it-btn').addEventListener('click', handleMakeIt);
    document.getElementById('find-it-btn').addEventListener('click', handleFindIt);

    // Page 3: Steps
    document.getElementById('back-to-choice').addEventListener('click', () => showPage('choice-page'));
    document.getElementById('upload-result-btn').addEventListener('click', () => {
         // Create a file input dynamically
        const resultFileInput = document.createElement('input');
        resultFileInput.type = 'file';
        resultFileInput.accept = 'image/*';
        resultFileInput.style.display = 'none';
        resultFileInput.addEventListener('change', (e) => processResultFile(e.target.files[0]));
        document.body.appendChild(resultFileInput);
        resultFileInput.click();
        document.body.removeChild(resultFileInput);
    });
    document.getElementById('save-protocol-btn').addEventListener('click', saveProtocolToFile);

    // Page 4: Analysis
    document.getElementById('back-to-steps').addEventListener('click', () => showPage('steps-page'));
    document.getElementById('start-over').addEventListener('click', () => showPage('upload-page'));
    document.getElementById('play-feedback').addEventListener('click', playFeedback);
    
    document.getElementById('share-instagram').addEventListener('click', shareToInstagram);
    document.getElementById('share-twitter').addEventListener('click', shareToTwitter);
    document.getElementById('share-facebook').addEventListener('click', shareToFacebook);
    document.getElementById('download-image').addEventListener('click', downloadComparison);

    audioPlayer.addEventListener('ended', () => {
        if (currentPlayingStepElement) {
            currentPlayingStepElement.classList.remove('playing');
            currentPlayingStepElement = null;
        }
    });
}

// --- PAGE NAVIGATION & UI ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showLoading(text) {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// --- FILE HANDLING ---
function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    handleFileSelect(e.dataTransfer.files);
}

function handleFileSelect(files) {
    if (files.length > 0) {
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        stagedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('choice-image-preview').src = e.target.result;
            showPage('choice-page');
        };
        reader.readAsDataURL(file);
    }
}

// --- CORE LOGIC FLOWS ---
async function handleMakeIt() {
    currentMode = 'make';
    if (!stagedFile) return;
    showLoading('Analyzing your image...');
    
    if (!CONFIG.ENABLE_AI_FEATURES) {
        // Fallback for when AI is disabled
        console.warn("AI is disabled. Cannot proceed with 'Make It' flow.");
        hideLoading();
        alert("AI features are disabled in the configuration.");
        return;
    }

    try {
        const analysis = await analyzeUploadedItemForMaking(stagedFile);
        await createDynamicProtocol(analysis, stagedFile);
    } catch (error) {
        console.error('Make It flow failed:', error);
        alert('Could not generate a protocol for this image. Please try another one.');
    } finally {
        hideLoading();
    }
}

async function handleFindIt() {
    currentMode = 'find';
    if (!stagedFile) return;
    showLoading('Locating item source...');

    if (!CONFIG.ENABLE_AI_FEATURES) {
        // Fallback for when AI is disabled
        console.warn("AI is disabled. Cannot proceed with 'Find It' flow.");
        hideLoading();
        alert("AI features are disabled in the configuration.");
        return;
    }

    try {
        const analysis = await analyzeUploadedItemForFinding(stagedFile);
        await createDynamicFindingSteps(analysis, stagedFile);
    } catch (error) {
        console.error('Find It flow failed:', error);
        alert('Could not find this item. Please try another one.');
    } finally {
        hideLoading();
    }
}

async function processResultFile(file) {
    if (!file) return;
    showLoading('Analyzing your result...');
    
    try {
        const analysis = await analyzeResultWithGemini(file, currentItemProtocol, currentMode);
        const reader = new FileReader();
        reader.onload = (e) => {
            displayAnalysis(analysis, e.target.result);
            hideLoading();
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Result processing failed:', error);
        hideLoading();
        alert('Analysis failed. Please try again.');
    }
}


// --- DYNAMIC CONTENT GENERATION ---
async function createDynamicProtocol(analysis, originalImageFile) {
    showLoading('Generating materials & steps...');
    currentItemProtocol = {
        title: analysis.itemName,
        itemName: analysis.itemName, // Ensure itemName is set
        originalImage: URL.createObjectURL(originalImageFile),
        steps: []
    };
    
    // 1. Generate Materials Image
    showLoading('Generating materials image...');
    const materialsList = (analysis.materials || []).join(', ');
    const materialsPrompt = `Generate a realistic, high-quality photograph showing all the materials needed to make ${analysis.itemName}: ${materialsList}. Display materials neatly arranged on a clean, neutral background. Professional product photography style. No text.`;
    const materialsImage = await generateImageWithGemini(materialsPrompt);
    
    currentItemProtocol.materialsImage = materialsImage;
    const materialsInstruction = `First, gather your materials: ${materialsList}.`;
    currentItemProtocol.steps.push({ id: 0, title: "Materials", instruction: materialsInstruction });

    // 2. Generate Steps Image
    showLoading('Generating step-by-step images...');
    const makingSteps = analysis.makingSteps;
    const compositePrompt = `Create a single image as a 2x2 grid detailing four steps for making ${analysis.itemName}. Each quadrant should be a realistic photo. 
    Top-left (Step 1): ${makingSteps[0]?.instruction || ''}. 
    Top-right (Step 2): ${makingSteps[1]?.instruction || ''}. 
    Bottom-left (Step 3): ${makingSteps[2]?.instruction || ''}. 
    Bottom-right (Step 4): ${makingSteps[3]?.instruction || ''}. 
    No numbers, text, or graphic overlays on the image.`;

    const stepsCompositeImage = await generateImageWithGemini(compositePrompt);
    const slicedImageUrls = await sliceCompositeImage(stepsCompositeImage);

    makingSteps.forEach((step, index) => {
        if (slicedImageUrls[index]) step.image = slicedImageUrls[index];
    });

    currentItemProtocol.steps.push(...makingSteps);

    // 3. Render the UI
    document.getElementById('protocol-title').textContent = currentItemProtocol.title;
    renderStepsGrid();
    showPage('steps-page');

    // 4. Preload Audio
    preloadAllStepAudio();
}

async function createDynamicFindingSteps(analysis, originalImageFile) {
    showLoading('Generating acquisition steps...');
    currentItemProtocol = {
        title: analysis.findType === 'landmark' ? `How to visit ${analysis.itemName}` : `How to get ${analysis.itemName}`,
        itemName: analysis.itemName,
        findType: analysis.findType,
        originalImage: URL.createObjectURL(originalImageFile),
        steps: [] // This will hold either methods for product or info for landmark
    };

    if (analysis.findType === 'landmark') {
        const imagePrompt = `A beautiful, artistic, high-quality photograph of ${analysis.itemName} in ${analysis.location}.`;
        const landmarkImage = await generateImageWithGemini(imagePrompt);
        currentItemProtocol.steps.push({
            id: 1,
            title: analysis.location,
            instruction: analysis.description,
            image: landmarkImage
        });
    } else { // 'product'
        const imagePromises = analysis.methods.map(method => {
            const prompt = `A clear, attractive icon or photo representing the concept of finding "${analysis.itemName}" via this method: "${method.title}". For example, for a restaurant, show a storefront. For delivery, show a delivery person or app logo.`;
            return generateImageWithGemini(prompt);
        });
        const imageUrls = await Promise.all(imagePromises);
        analysis.methods.forEach((method, i) => {
            currentItemProtocol.steps.push({
                id: i + 1,
                title: method.title,
                instruction: method.description,
                image: imageUrls[i]
            });
        });
    }

    document.getElementById('protocol-title').textContent = currentItemProtocol.title;
    renderStepsGrid();
    showPage('steps-page');
    preloadAllStepAudio();
}


function renderStepsGrid() {
    const materialsDisplay = document.getElementById('materials-display');
    const stepsGrid = document.getElementById('steps-grid');
    materialsDisplay.innerHTML = '';
    stepsGrid.innerHTML = '';

    // Default states
    materialsDisplay.style.display = 'none';
    stepsGrid.style.display = 'grid';

    if (currentMode === 'make') {
        materialsDisplay.style.display = 'block';
        const materialsStep = currentItemProtocol.steps.find(step => step.title === "Materials");
        if (materialsStep) {
            const card = document.createElement('div');
            card.className = 'ingredients-card bg-white p-4 rounded-xl shadow-md flex flex-col items-center';
            card.innerHTML = `
                <img src="${currentItemProtocol.materialsImage}" alt="Materials" class="w-full h-[32rem] object-cover rounded-lg mb-3">
                <h3 class="text-lg font-semibold">${materialsStep.title}</h3>
                <p class="text-sm text-gray-500">Click to hear list</p>
                <div class="audio-icon mt-auto text-2xl text-gray-400">🔊</div>
            `;
            card.addEventListener('click', () => playStepAudio(materialsStep, card));
            materialsDisplay.appendChild(card);
        }
    } else if (currentMode === 'find' && currentItemProtocol.findType === 'landmark') {
        materialsDisplay.style.display = 'block';
        stepsGrid.style.display = 'none'; // Only show the big card
        const landmarkStep = currentItemProtocol.steps[0];
        if(landmarkStep) {
            const card = document.createElement('div');
            card.className = 'ingredients-card bg-white p-4 rounded-xl shadow-md flex flex-col items-center';
            card.innerHTML = `
                <img src="${landmarkStep.image}" alt="${currentItemProtocol.itemName}" class="w-full h-[32rem] object-cover rounded-lg mb-3">
                <h3 class="text-xl font-bold">${currentItemProtocol.itemName}</h3>
                <p class="text-md text-gray-600 font-semibold">${landmarkStep.title}</p>
                <p class="text-sm text-gray-500 mt-2">Click to hear details</p>
                <div class="audio-icon mt-auto text-2xl text-gray-400">🔊</div>
            `;
            card.addEventListener('click', () => playStepAudio(landmarkStep, card));
            materialsDisplay.appendChild(card);
        }
        return; // Stop here for landmarks
    }

    const itemSteps = currentMode === 'make' 
        ? currentItemProtocol.steps.filter(step => step.title !== "Materials")
        : currentItemProtocol.steps;

    itemSteps.forEach(step => {
        const card = document.createElement('div');
        card.className = 'step-card bg-white p-4 rounded-xl shadow-md flex flex-col text-center';
        card.innerHTML = `
            <div class="relative">
                <img src="${step.image}" alt="${step.title}" class="w-full h-40 object-cover rounded-lg mb-3">
                ${currentMode === 'make' ? `<div class="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full">${step.id}</div>` : ''}
            </div>
            <h3 class="text-md font-semibold">${step.title}</h3>
            <div class="audio-icon mt-auto text-xl text-gray-400">🔊</div>
        `;
        card.addEventListener('click', () => playStepAudio(step, card));
        stepsGrid.appendChild(card);
    });
}


// --- ANALYSIS & RESULTS ---
function displayAnalysis(analysis, resultImageUrl) {
    currentAnalysis = analysis;
    document.getElementById('original-image').src = currentItemProtocol.originalImage;
    document.getElementById('result-image').src = resultImageUrl;
    
    let radarLabels, scores;
    
    if (currentMode === 'make') {
        radarLabels = ['Shape', 'Color', 'Details', 'Integrity', 'Match'];
        scores = [analysis.scores.shapeFidelity, analysis.scores.colorAccuracy, analysis.scores.detailComplexity, analysis.scores.structuralIntegrity, analysis.scores.overallMatch];
    } else { // find mode
        if (currentItemProtocol.findType === 'landmark') {
            radarLabels = ['Accuracy', 'Quality', 'Composition', 'Context', 'Impression'];
            scores = [analysis.scores.landmarkAccuracy, analysis.scores.photoQuality, analysis.scores.composition, analysis.scores.context, analysis.scores.overallImpression];
        } else { // product
            radarLabels = ['Accuracy', 'Quality', 'Presentation', 'Context', 'Similarity'];
            scores = [analysis.scores.itemAccuracy, analysis.scores.quality, analysis.scores.presentation, analysis.scores.context, analysis.scores.overallSimilarity];
        }
    }

    generateRadarChart(radarLabels, scores);
    generateScoreDetails(analysis.scores);
    showPage('analysis-page');
    // Preload feedback audio
    if (currentAnalysis && currentAnalysis.feedback) {
        generateAndCacheTTS(`Here is your feedback. ${currentAnalysis.feedback}`, 'feedback');
    }
}


function generateRadarChart(labels, data) {
    const ctx = document.getElementById('radar-chart').getContext('2d');
    if (window.radarChart) window.radarChart.destroy();
    window.radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Your Score',
                data: data,
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: { r: { beginAtZero: true, max: 5, pointLabels: { font: { size: 14 } } } },
            plugins: { legend: { display: false } }
        }
    });
}

function generateScoreDetails(scores) {
    const scoreGrid = document.getElementById('score-details');
    scoreGrid.innerHTML = '';
    Object.entries(scores).forEach(([category, score]) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item p-2';
        let colorClass = score >= 4 ? 'text-green-600' : score >= 3 ? 'text-yellow-600' : 'text-red-600';
        // Simple camelCase to Title Case conversion
        const label = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        scoreItem.innerHTML = `
            <div class="text-sm font-medium text-gray-500">${label}</div>
            <div class="text-2xl font-bold ${colorClass}">${score}/5</div>`;
        scoreGrid.appendChild(scoreItem);
    });
}


// --- AUDIO & TTS ---
async function playStepAudio(step, element) {
    if (currentPlayingStepElement && currentPlayingStepElement !== element) {
        currentPlayingStepElement.classList.remove('playing');
    }
    
    if (currentPlayingStepElement === element && !audioPlayer.paused) {
        audioPlayer.pause();
        element.classList.remove('playing');
        currentPlayingStepElement = null;
        return;
    }

    currentPlayingStepElement = element;
    element.classList.add('playing');
    
    try {
        const audioUrl = await getAudioForText(step.instruction, `step-${step.id}`);
        audioPlayer.src = audioUrl;
        audioPlayer.play();
    } catch (error) {
         console.error("Audio playback failed.", error);
        alert("Could not play audio. Please ensure your browser allows autoplay.");
        element.classList.remove('playing');
    }
}

async function playFeedback() {
    if (!currentAnalysis) return;
    try {
        const audioUrl = await getAudioForText(`Here is your feedback. ${currentAnalysis.feedback}`, 'feedback');
        audioPlayer.src = audioUrl;
        audioPlayer.play();
    } catch (error) {
        console.error("Feedback audio failed.", error)
    }
}

function preloadAllStepAudio() {
    if (!currentItemProtocol || !currentItemProtocol.steps) return;
    console.log("Preloading all step audio...");
    currentItemProtocol.steps.forEach(step => {
        generateAndCacheTTS(step.instruction, `step-${step.id}`);
    });
}

async function getAudioForText(text, cacheKey) {
    if (audioCache.has(cacheKey)) {
        return audioCache.get(cacheKey);
    }
    return await generateAndCacheTTS(text, cacheKey);
}

async function generateAndCacheTTS(text, cacheKey, voice = 'Puck') {
    if (!text) return;
    try {
        const payload = {
            contents: [{ parts: [{ text: `Speak in a friendly, clear, and encouraging tone: ${text}` }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
            },
            model: "gemini-2.5-flash-preview-tts"
        };
        const response = await fetch(`${CONFIG.GEMINI_TTS_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`TTS API request failed: ${response.status}`);
        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType?.startsWith("audio/")) {
            const sampleRateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
            const pcmData = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmData);
            const wavBlob = pcmToWav(pcm16, 1, sampleRate);
            const audioUrl = URL.createObjectURL(wavBlob);
            audioCache.set(cacheKey, audioUrl); // Cache the result
            console.log(`Audio cached for key: ${cacheKey}`);
            return audioUrl;
        } else {
            throw new Error("Invalid audio data in API response.");
        }
    } catch (error) {
        console.error(`Failed to generate TTS for key ${cacheKey}:`, error);
        throw error; // Propagate error
    }
}


// --- SHARING & SAVING ---
async function createComparisonImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 1200; // Square canvas
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`My "${currentItemProtocol.itemName}" Quest`, canvas.width / 2, 80);

    // Images
    const originalImg = document.getElementById('original-image');
    const resultImg = document.getElementById('result-image');
    
    return new Promise((resolve) => {
        const img1 = new Image();
        const img2 = new Image();
        img1.crossOrigin = "Anonymous";
        img2.crossOrigin = "Anonymous";
        
        let loaded = 0;
        const onLoaded = () => {
            loaded++;
            if (loaded === 2) {
                // Draw Original Image
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 24px Inter, sans-serif';
                ctx.fillText('Original', canvas.width / 4 + 50, 180);
                ctx.drawImage(img1, 50, 210, 500, 500);

                // Draw Your Result Image
                ctx.fillText('My Result', canvas.width * 0.75 - 50, 180);
                ctx.drawImage(img2, 650, 210, 500, 500);

                // Draw Radar Chart
                drawRadarChartOnCanvas(ctx, currentAnalysis.scores, canvas.width / 2, 950, 180);
                
                resolve(canvas.toDataURL('image/png'));
            }
        };
        img1.onload = onLoaded;
        img2.onload = onLoaded;
        img1.onerror = () => { console.error("Error loading original image for canvas."); onLoaded(); };
        img2.onerror = () => { console.error("Error loading result image for canvas."); onLoaded(); };
        img1.src = originalImg.src;
        img2.src = resultImg.src;
    });
}

function drawRadarChartOnCanvas(ctx, scores, centerX, centerY, radius) {
    let radarLabels;
     if (currentMode === 'make') {
        radarLabels = ['Shape', 'Color', 'Details', 'Integrity', 'Match'];
    } else { // find mode
        if (currentItemProtocol.findType === 'landmark') {
            radarLabels = ['Accuracy', 'Quality', 'Composition', 'Context', 'Impression'];
        } else { // product
            radarLabels = ['Accuracy', 'Quality', 'Presentation', 'Context', 'Similarity'];
        }
    }
    const values = Object.values(scores);
    const angleStep = (Math.PI * 2) / radarLabels.length;

    // Draw grid lines
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    for (let r = 1; r <= 5; r++) {
        ctx.beginPath();
        for (let i = 0; i <= radarLabels.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const r_scaled = (radius * r) / 5;
            const x = centerX + Math.cos(angle) * r_scaled;
            const y = centerY + Math.sin(angle) * r_scaled;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#9ca3af';
    for (let i = 0; i < radarLabels.length; i++) {
        const angle = i * angleStep - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
    }

    // Draw data polygon
    ctx.beginPath();
    values.forEach((value, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r_scaled = (value / 5) * radius;
        const x = centerX + Math.cos(angle) * r_scaled;
        const y = centerY + Math.sin(angle) * r_scaled;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(79, 70, 229, 0.3)';
    ctx.fill();

    // Draw labels
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Inter, sans-serif';
    radarLabels.forEach((label, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius + 25);
        const y = centerY + Math.sin(angle) * (radius + 25);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    });
}


async function universalShare(platform) {
    showLoading('Generating shareable image...');
    try {
        const imageDataUrl = await createComparisonImage();
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'quest-analysis.png', { type: 'image/png' });
        const shareData = {
            title: `${currentItemProtocol.title} - My Quest Analysis`,
            text: `Check out my results for the "${currentItemProtocol.title}" quest!`,
            files: [file],
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return { shared: true };
        } else if (platform) {
             // Fallback for desktop browsers
             let shareUrl;
             const text = encodeURIComponent(shareData.text);
             const url = encodeURIComponent(window.location.href);
             if (platform === 'twitter') {
                 shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
             } else if (platform === 'facebook') {
                 shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
             }
             if (shareUrl) {
                window.open(shareUrl, '_blank');
                return { shared: true, fallback: true };
             }
        }
       return { shared: false };
    } catch (error) {
        console.error('Error sharing:', error);
        return { shared: false, error: error };
    } finally {
        hideLoading();
    }
}

async function shareToInstagram() {
    const result = await universalShare();
    if (!result.shared) {
        alert("Sharing to Instagram is best from a mobile device. On desktop, please download the image and upload it manually.");
    }
}

async function shareToTwitter() {
    await universalShare('twitter');
}

async function shareToFacebook() {
    await universalShare('facebook');
}

async function downloadComparison() {
    showLoading('Generating image for download...');
    try {
        const imageDataUrl = await createComparisonImage();
        downloadFile(imageDataUrl, `${currentItemProtocol.itemName.replace(/\s+/g, '-')}-analysis.png`);
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
    } finally {
        hideLoading();
    }
}

function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- HELPER FUNCTIONS ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function sliceCompositeImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const quadW = img.width / 2, quadH = img.height / 2;
            const images = [];
            for (let i = 0; i < 4; i++) {
                const canvas = document.createElement('canvas');
                canvas.width = quadW; canvas.height = quadH;
                const ctx = canvas.getContext('2d');
                const sx = (i % 2) * quadW, sy = Math.floor(i / 2) * quadH;
                ctx.drawImage(img, sx, sy, quadW, quadH, 0, 0, quadW, quadH);
                images.push(canvas.toDataURL());
            }
            resolve(images);
        };
        img.onerror = () => reject(new Error('Failed to load composite image for slicing.'));
        img.src = imageUrl;
    });
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
}

function pcmToWav(pcmData, numChannels, sampleRate) {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
    const writeString = (view, offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2 * numChannels, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
    for (let i = 0; i < pcmData.length; i++) view.setInt16(44 + i * 2, pcmData[i], true);
    return new Blob([view], { type: 'audio/wav' });
}

function saveProtocolToFile() {
    if (!currentItemProtocol) return alert('No protocol to save!');
    
    let stepsHtml;
    let mainContent;

    if(currentItemProtocol.findType === 'landmark') {
        const landmarkStep = currentItemProtocol.steps[0];
        mainContent = `<h2>${landmarkStep.title}</h2><img src="${landmarkStep.image}" alt="${currentItemProtocol.itemName}"><p>${landmarkStep.instruction}</p>`
        stepsHtml = `<!-- No steps for landmarks -->`;
    } else {
        const materialsStep = currentMode === 'make' ? currentItemProtocol.steps.find(s => s.title === "Materials") : null;
        mainContent = materialsStep ? `<h2>Materials</h2><img src="${currentItemProtocol.materialsImage}" alt="Materials"><p>${materialsStep.instruction}</p>` : '';
        const itemSteps = currentMode === 'make' ? currentItemProtocol.steps.filter(s => s.title !== "Materials") : currentItemProtocol.steps;
        stepsHtml = itemSteps.map(step => `
            <div class="step">
                <h3>${step.title}</h3>
                <img src="${step.image}" alt="${step.title}">
                <p>${step.instruction}</p>
            </div>
        `).join('');
    }


    const fileContent = `
    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Protocol: ${currentItemProtocol.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;padding:2rem;background:#f9fafb;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}h1,h2{color:#111827;}img{max-width:100%;border-radius:8px;margin-bottom:1rem;}.steps-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem;}.step{background:white;padding:1rem;border-radius:8px;border:1px solid #e5e7eb;}</style></head><body>
    <h1>${currentItemProtocol.title}</h1>
    ${mainContent}
    ${stepsHtml ? `<h2>Steps</h2><div class="steps-grid">${stepsHtml}</div>` : ''}
    </body></html>`;

    const blob = new Blob([fileContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `protocol-${currentItemProtocol.title.toLowerCase().replace(/\s+/g, '-')}.html`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

// --- GEMINI API CALLS ---
async function analyzeUploadedItemForMaking(imageFile) {
    const base64Image = await fileToBase64(imageFile);
    const prompt = `You are an expert maker. Look at this image. Identify the item. Your response must be in JSON format only. The JSON should contain: 'itemName' (a string, in English), 'materials' (an array of key material strings), and 'makingSteps' (an array of exactly 4 simple step objects, each with an 'id', 'title', and 'instruction'). For example: {"itemName": "Lego Starship", "materials": ["150 assorted Lego bricks", "Lego minifigure"], "makingSteps": [{"id":1, "title":"Build Body", "instruction":"Assemble the main body of the ship."}, ...]}.`;
    const requestBody = { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: imageFile.type, data: base64Image } }] }] };
    const response = await fetch(`${CONFIG.GEMINI_TEXT_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse.match(/\{[\s\S]*\}/)[0]);
}

async function analyzeUploadedItemForFinding(imageFile) {
    const base64Image = await fileToBase64(imageFile);
    const prompt = `You are a world-class scout. Analyze the image.
1. Identify the primary subject.
2. Determine if the subject is a general "product" (e.g., pizza, coffee, laptop) or a specific "landmark" (e.g., Eiffel Tower, Golden Gate Bridge).
3. Respond in JSON format ONLY with no other text.

- If it is a "product", provide up to 4 distinct methods for acquiring it. The JSON must be:
  {"itemName": "Name of Item", "findType": "product", "methods": [ {"title": "Method 1", "description": "Description of method 1."}, {"title": "Method 2", "description": "Description of method 2."} ]}
  Example for a pizza: {"itemName": "Pepperoni Pizza", "findType": "product", "methods": [{"title": "Restaurant", "description": "Visit a local pizzeria or a chain like Domino's."}, {"title": "Delivery App", "description": "Order for delivery through an app like Uber Eats or DoorDash."}, {"title": "Grocery Store", "description": "Buy a frozen pizza from the supermarket."}]}

- If it is a "landmark", provide its location and a brief description. The JSON must be:
  {"itemName": "Name of Landmark", "findType": "landmark", "location": "City, Country", "description": "A brief, interesting fact or description about the landmark."}
  Example for the Golden Gate Bridge: {"itemName": "Golden Gate Bridge", "findType": "landmark", "location": "San Francisco, USA", "description": "An iconic suspension bridge that is a symbol of California."}`;
    const requestBody = { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: imageFile.type, data: base64Image } }] }] };
    const response = await fetch(`${CONFIG.GEMINI_TEXT_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse.match(/\{[\s\S]*\}/)[0]);
}

async function analyzeResultWithGemini(imageFile, originalItem, mode) {
    const base64Image = await fileToBase64(imageFile);
    let prompt;
    if (mode === 'make') {
        prompt = `You are a meticulous inspector. Compare this user-submitted image of a creation with the original concept of a ${originalItem.title}. Rate the submission on a scale of 1-5 for the following criteria: shapeFidelity, colorAccuracy, detailComplexity, structuralIntegrity, and overallMatch. Also provide constructive feedback. Respond ONLY in JSON format: {"scores": {"shapeFidelity": 4, "colorAccuracy": 3, "detailComplexity": 5, "structuralIntegrity": 4, "overallMatch": 4}, "feedback": "Your detailed feedback here"}`;
    } else { // find mode
        if (originalItem.findType === 'landmark') {
            const location = originalItem.steps[0].title;
            prompt = `You are a photography critic. A user was tasked to visit the ${originalItem.itemName} in ${location} and took this photo. Compare the user's photo to the concept of the landmark. Rate it on a scale of 1-5 for: landmarkAccuracy (is it the right place?), photoQuality (clarity, lighting), composition (is it a well-framed shot?), context (does it capture the atmosphere?), and overallImpression. Provide constructive feedback. Respond ONLY in JSON format: {"scores": {"landmarkAccuracy": 5, "photoQuality": 4, "composition": 3, "context": 4, "overallImpression": 4}, "feedback": "Your detailed feedback here"}`;
        } else { // product
            prompt = `You are an authenticator. A user was tasked to acquire a ${originalItem.itemName} and submitted this photo. Compare it to the general concept of this product. Rate it on a scale of 1-5 for: itemAccuracy (is it the correct item?), quality (does it look fresh/well-made?), presentation (is it well-presented?), context (is it in a plausible place for this item?), and overallSimilarity. Provide constructive feedback. Respond ONLY in JSON format: {"scores": {"itemAccuracy": 5, "quality": 4, "presentation": 5, "context": 3, "overallSimilarity": 4}, "feedback": "Your detailed feedback here"}`;
        }
    }
    const requestBody = { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: imageFile.type, data: base64Image } }] }] };
    const response = await fetch(`${CONFIG.GEMINI_TEXT_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);
    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse.match(/\{[\s\S]*\}/)[0]);
}

async function generateImageWithGemini(prompt) {
    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['IMAGE'] }
        };
        const response = await fetch(`${CONFIG.GEMINI_IMAGE_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        const result = await response.json();
        const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!base64Data) throw new Error('No image data in response.');
        return `data:image/png;base64,${base64Data}`;
    } catch (error) {
        console.error('Image generation failed:', error);
        // Fallback placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#9ca3af'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Image Failed to Load', 128, 128);
        return canvas.toDataURL();
    }
}

