// Mock Recipe Data
const recipeData = {
    pizza: {
        title: "Homemade Pizza",
        originalImage: "assets/samples/pizza.jpg",
        steps: [
            { id: 1, title: "Preheat", image: "assets/steps/preheat.png", instruction: "Preheat oven to 450°F" },
            { id: 2, title: "Roll Dough", image: "assets/steps/dough.png", instruction: "Roll out pizza dough on floured surface" },
            { id: 3, title: "Add Sauce", image: "assets/steps/sauce.png", instruction: "Spread tomato sauce evenly" },
            { id: 4, title: "Add Cheese", image: "assets/steps/cheese.png", instruction: "Sprinkle mozzarella cheese generously" },
            { id: 5, title: "Add Toppings", image: "assets/steps/toppings.png", instruction: "Add your favorite toppings" },
            { id: 6, title: "Bake", image: "assets/steps/bake.png", instruction: "Bake for 12-15 minutes until golden" }
        ]
    },
    coffee: {
        title: "Perfect Coffee",
        originalImage: "assets/samples/coffee.jpg",
        steps: [
            { id: 1, title: "Boil Water", image: "assets/steps/boil.png", instruction: "Boil water to 200°F" },
            { id: 2, title: "Grind Beans", image: "assets/steps/grind.png", instruction: "Grind coffee beans to medium coarse" },
            { id: 3, title: "Add Coffee", image: "assets/steps/add-coffee.png", instruction: "Add ground coffee to filter" },
            { id: 4, title: "Pour & Enjoy", image: "assets/steps/pour.png", instruction: "Pour hot water slowly and enjoy" }
        ]
    },
    sandwich: {
        title: "Gourmet Sandwich",
        originalImage: "assets/samples/sandwich.jpg",
        steps: [
            { id: 1, title: "Toast Bread", image: "assets/steps/toast.png", instruction: "Toast bread slices until golden" },
            { id: 2, title: "Add Spread", image: "assets/steps/spread.png", instruction: "Apply mayo or mustard" },
            { id: 3, title: "Layer Meat", image: "assets/steps/meat.png", instruction: "Add sliced turkey or ham" },
            { id: 4, title: "Add Veggies", image: "assets/steps/veggies.png", instruction: "Layer lettuce, tomato, and cheese" },
            { id: 5, title: "Assemble", image: "assets/steps/assemble.png", instruction: "Close sandwich and cut diagonally" }
        ]
    }
};

// Mock Analysis Data
const analysisData = {
    good: {
        scores: { color: 5, texture: 4, ingredients: 5, presentation: 4, portion: 4 },
        feedback: "Excellent work! Your pizza looks delicious with perfect golden color and great cheese coverage."
    },
    okay: {
        scores: { color: 3, texture: 4, ingredients: 3, presentation: 3, portion: 4 },
        feedback: "Good effort! Try adding more cheese next time and watch the oven temperature for better color."
    },
    poor: {
        scores: { color: 2, texture: 2, ingredients: 2, presentation: 2, portion: 3 },
        feedback: "Keep practicing! The crust needs more time and try spreading ingredients more evenly."
    }
};


// Gemini API Configuration (loaded from config.js)
const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;

// Global Variables
let currentRecipe = null;
let currentAnalysis = null;
let audioPlayer = null;
let currentPlayingStep = null;
let imageCache = new Map(); // Cache for generated images

// A simple delay function to add intervals between API requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize image cache from local storage
function initializeImageCache() {
    try {
        const cachedData = localStorage.getItem('cookingImageCache');
        if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            Object.entries(parsedCache).forEach(([key, url]) => {
                imageCache.set(key, url);
            });
            console.log('Loaded', imageCache.size, 'images from local storage');
        }
    } catch (error) {
        console.log('Could not load cached images:', error);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    audioPlayer = document.getElementById('audio-player');
    initializeImageCache(); // Load cached images
    createPlaceholderAssets(); // Call this before setting up event listeners that might trigger image loads
    setupEventListeners();
}

function setupEventListeners() {
    // Upload area interactions
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const resultUploadArea = document.getElementById('result-upload-area');
    const resultFileInput = document.getElementById('result-file-input');

    // Main upload area
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Result upload area
    resultUploadArea.addEventListener('click', () => resultFileInput.click());
    resultUploadArea.addEventListener('dragover', handleDragOver);
    resultUploadArea.addEventListener('drop', handleResultDrop);
    resultFileInput.addEventListener('change', handleResultFileSelect);

    // Sample image clicks
    document.querySelectorAll('.sample-img').forEach(img => {
        img.addEventListener('click', (e) => {
            const recipe = e.target.dataset.recipe;
            loadRecipe(recipe);
        });
    });

    // Sample result clicks
    document.querySelectorAll('.sample-result').forEach(img => {
        img.addEventListener('click', (e) => {
            const quality = e.target.dataset.quality;
            analyzeResult(quality, e.target.src);
        });
    });

    // Navigation buttons
    document.getElementById('back-to-upload').addEventListener('click', () => showPage('upload-page'));
    document.getElementById('back-to-steps').addEventListener('click', () => showPage('steps-page'));
    document.getElementById('back-to-result').addEventListener('click', () => showPage('result-upload-page'));
    document.getElementById('upload-result-btn').addEventListener('click', () => showPage('result-upload-page'));
    document.getElementById('start-over').addEventListener('click', () => showPage('upload-page'));

    // Feedback button
    document.getElementById('play-feedback').addEventListener('click', playFeedback);

    // Social sharing and save buttons
    document.getElementById('share-instagram').addEventListener('click', shareToInstagram);
    document.getElementById('share-twitter').addEventListener('click', shareToTwitter);
    document.getElementById('share-facebook').addEventListener('click', shareToFacebook);
    document.getElementById('save-to-album').addEventListener('click', saveToAlbum);
    document.getElementById('download-comparison').addEventListener('click', downloadComparison);

    // Audio ended event
    audioPlayer.addEventListener('ended', () => {
        if (currentPlayingStep) {
            currentPlayingStep.classList.remove('playing');
            currentPlayingStep = null;
        }
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processImageFile(files[0]);
    }
}

function handleResultDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processResultFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function handleResultFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processResultFile(file);
    }
}

async function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    showLoading('Analyzing your image with AI...');

    try {
        const analysis = await analyzeUploadedFood(file);
        await createDynamicRecipe(analysis, file);
        hideLoading();
    } catch (error) {
        console.error('Image processing failed:', error);
        hideLoading();
        setTimeout(async () => {
            const recipes = Object.keys(recipeData);
            const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
            await loadRecipe(randomRecipe);
        }, 1000);
    }
}

async function processResultFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    showLoading('Analyzing your cooking result with AI...');

    try {
        const analysis = await analyzeResultWithGemini(file, currentRecipe);
        const reader = new FileReader();
        reader.onload = (e) => {
            analyzeResultWithData(analysis, e.target.result);
            hideLoading();
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Result processing failed:', error);
        hideLoading();
        const reader = new FileReader();
        reader.onload = (e) => {
            setTimeout(() => {
                const qualities = ['good', 'okay', 'poor'];
                const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
                analyzeResult(randomQuality, e.target.result);
                hideLoading();
            }, 1000);
        };
        reader.readAsDataURL(file);
    }
}

async function loadRecipe(recipeKey) {
    currentRecipe = JSON.parse(JSON.stringify(recipeData[recipeKey]));
    if (!currentRecipe) return;

    document.getElementById('recipe-title').textContent = currentRecipe.title;
    showLoading('Generating realistic cooking steps...');

    try {
        const ingredients = ["mock ingredient 1", "mock ingredient 2", "mock ingredient 3"]; // Mock ingredients for mock data
        const ingredientsInstruction = `Gather all ingredients: ${ingredients.join(', ')}.`;
        const ingredientsStep = { id: 0, title: "Ingredients", instruction: ingredientsInstruction };
        currentRecipe.steps.unshift(ingredientsStep); 

        const ingredientsImage = await generateImageWithGemini(`All ingredients for ${currentRecipe.title}`);
        currentRecipe.ingredientsImage = ingredientsImage;
        await delay(1000);

        const stepInstructions = currentRecipe.steps.filter(s => s.title !== "Ingredients").slice(0, 4);
        const compositePrompt = `Create a single image as a 2x2 grid detailing four cooking steps. Each quadrant should be a realistic photo. Top-left (1): ${stepInstructions[0]?.instruction}. Top-right (2): ${stepInstructions[1]?.instruction}. Bottom-left (3): ${stepInstructions[2]?.instruction}. Bottom-right (4): ${stepInstructions[3]?.instruction}. Do not include any numbers or text overlays on the image.`;
        const stepsImage = await generateImageWithGemini(compositePrompt);
        currentRecipe.compositeStepsImage = stepsImage;
        
        hideLoading();
        generateStepsGrid();
        showPage('steps-page');
    } catch (error) {
        console.error('Failed to generate images for mock recipe:', error);
        hideLoading();
        generateStepsGrid(); 
        showPage('steps-page');
    }
}


function generateStepsGrid() {
    const stepsGrid = document.getElementById('steps-grid');
    stepsGrid.innerHTML = '';
    const ingredientsDisplay = document.getElementById('ingredients-display');
    ingredientsDisplay.innerHTML = '';

    const ingredientsStep = currentRecipe.steps.find(step => step.title === "Ingredients");
    if (ingredientsStep) {
        const ingredientsCard = document.createElement('div');
        ingredientsCard.className = 'ingredients-card';
        ingredientsCard.innerHTML = `
            <img src="${currentRecipe.ingredientsImage || createRealisticStepPlaceholder('Ingredients', ingredientsStep.instruction)}" alt="${ingredientsStep.title}" class="ingredients-image">
            <div class="ingredients-title">${ingredientsStep.title}</div>
            <div class="ingredients-time">⏱️ ${ingredientsStep.timeEstimate || '5 min'}</div>
            <div class="audio-icon">🔊</div>
        `;
        ingredientsCard.addEventListener('click', (e) => playStepAudio(ingredientsStep, e.currentTarget));
        ingredientsDisplay.appendChild(ingredientsCard);
    }

    const cookingSteps = currentRecipe.steps.filter(step => step.title !== "Ingredients");
    if (cookingSteps.length > 0) {
        const allStepsCard = document.createElement('div');
        allStepsCard.className = 'all-steps-card';

        const compositeImage = document.createElement('img');
        compositeImage.src = currentRecipe.compositeStepsImage || createRealisticStepPlaceholder('Cooking Steps', 'All steps combined');
        compositeImage.alt = "All Cooking Steps";
        compositeImage.className = 'composite-step-image';
        allStepsCard.appendChild(compositeImage);

        // Clickable header to toggle instructions
        const instructionsHeader = document.createElement('h3');
        instructionsHeader.className = 'instructions-header';
        instructionsHeader.innerHTML = 'Cooking Steps <span>(Click to expand)</span>';
        
        const instructionsList = document.createElement('ol');
        instructionsList.className = 'instructions-list';
        instructionsList.style.display = 'none'; // Initially hidden

        instructionsHeader.addEventListener('click', () => {
            const isHidden = instructionsList.style.display === 'none';
            instructionsList.style.display = isHidden ? 'block' : 'none';
            instructionsHeader.querySelector('span').textContent = isHidden ? '(Click to collapse)' : '(Click to expand)';
        });
        
        allStepsCard.appendChild(instructionsHeader);


        cookingSteps.forEach(step => {
            const timeEstimate = step.timeEstimate || estimateStepTime(step.instruction, step.title);
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="step-instruction-text"><strong>Step ${step.id}:</strong> ${step.instruction}</div>
                <div class="step-details"><span class="step-time">⏱️ ${timeEstimate}</span><div class="audio-icon small">🔊</div></div>
            `;
            listItem.addEventListener('click', (e) => {
                e.stopPropagation();
                playStepAudio(step, listItem);
            });
            instructionsList.appendChild(listItem);
        });
        allStepsCard.appendChild(instructionsList);
        stepsGrid.appendChild(allStepsCard);
    }
}

function playStepAudio(step, element) {
    // Remove 'playing' class from any other element before proceeding
    if (currentPlayingStep && currentPlayingStep !== element) {
        currentPlayingStep.classList.remove('playing');
    }
    
    // If the clicked element is already playing, pause and toggle off
    if (currentPlayingStep === element && !audioPlayer.paused) {
        audioPlayer.pause();
        element.classList.remove('playing');
        currentPlayingStep = null;
        return;
    }

    currentPlayingStep = element;
    element.classList.add('playing');

    if (CONFIG.ENABLE_AI_TTS) {
        generateAndPlayTTS(step.instruction).catch(error => {
            console.error("AI TTS failed, falling back to browser TTS.", error);
            speakText(step.instruction);
        });
    } else {
        speakText(step.instruction);
    }
}


function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            if (currentPlayingStep) {
                currentPlayingStep.classList.remove('playing');
                currentPlayingStep = null;
            }
        };
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }
}

function analyzeResult(quality, imageUrl) {
    currentAnalysis = analysisData[quality];
    document.getElementById('original-image').src = currentRecipe.originalImage;
    document.getElementById('result-image').src = imageUrl;
    generateRadarChart(currentAnalysis.scores);
    generateScoreDetails(currentAnalysis.scores);
    showPage('analysis-page');
}

function generateRadarChart(scores) {
    const ctx = document.getElementById('radar-chart').getContext('2d');
    if (window.radarChart) window.radarChart.destroy();
    window.radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Color', 'Texture', 'Ingredients', 'Presentation', 'Portion'],
            datasets: [{
                label: 'Your Score',
                data: [scores.color, scores.texture, scores.ingredients, scores.presentation, scores.portion],
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
            }]
        },
        options: {
            scales: { r: { beginAtZero: true, max: 5 } },
            plugins: { legend: { display: false } }
        }
    });
}

function generateScoreDetails(scores) {
    const scoreGrid = document.getElementById('score-details');
    scoreGrid.innerHTML = '';
    Object.entries(scores).forEach(([category, score]) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        let scoreClass = score >= 4 ? 'score-excellent' : score >= 3 ? 'score-good' : 'score-poor';
        scoreItem.innerHTML = `<div class="score-label">${category.charAt(0).toUpperCase() + category.slice(1)}</div><div class="score-value ${scoreClass}">${score}/5</div>`;
        scoreGrid.appendChild(scoreItem);
    });
}

function playFeedback() {
    if (!currentAnalysis) return;
    const text = `Here is your feedback. ${currentAnalysis.feedback}`;
    if (CONFIG.ENABLE_AI_TTS) {
        generateAndPlayTTS(text).catch(error => {
            console.error("AI TTS feedback failed, falling back to browser TTS.", error);
            speakText(text);
        });
    } else {
        speakText(text);
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showLoading(text) {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

function createPlaceholderAssets() {
    const placeholderImages = {
        'assets/samples/pizza.jpg': createPlaceholderImage('🍕', 'Pizza'),
        'assets/samples/coffee.jpg': createPlaceholderImage('☕', 'Coffee'),
        'assets/samples/sandwich.jpg': createPlaceholderImage('🥪', 'Sandwich'),
        'assets/results/pizza-good.jpg': createPlaceholderImage('🍕✨', 'Great Pizza'),
        'assets/results/pizza-okay.jpg': createPlaceholderImage('🍕👍', 'Good Pizza'),
        'assets/results/pizza-poor.jpg': createPlaceholderImage('🍕😅', 'Practice Pizza')
    };
    Object.entries(placeholderImages).forEach(([path, dataUrl]) => {
        document.querySelectorAll(`img[src="${path}"]`).forEach(img => {
            img.src = dataUrl;
        });
    });
    Object.values(recipeData).forEach(recipe => {
        recipe.steps.forEach(step => {
            if (!step.image || step.image.startsWith('assets/')) {
                 step.image = createRealisticStepPlaceholder(step.title, step.instruction);
            }
        });
    });
}

function createPlaceholderImage(emoji, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, 200, 200);
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, 100, 100);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(text, 100, 150);
    return canvas.toDataURL();
}

// Gemini API Functions
async function analyzeUploadedFood(imageFile) {
    if (!CONFIG.ENABLE_AI_ANALYSIS) {
        console.log("AI analysis is disabled. Using mock data.");
        const recipes = Object.keys(recipeData);
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        return { dishName: recipeData[randomRecipe].title, ingredients: ["mock ingredient 1", "mock ingredient 2"], cookingSteps: recipeData[randomRecipe].steps };
    }
    try {
        const base64Image = await fileToBase64(imageFile);
        const prompt = `You are an expert chef. Look at this image of a food dish. Identify the most likely name of the dish. Your response must be in JSON format only. The JSON should contain: 'dishName' (a string, in English), 'ingredients' (an array of key ingredient strings), and 'cookingSteps' (an array of 4 to 6 simple step objects, each with an 'id', 'title', and 'instruction'). For example: {"dishName": "Spaghetti Carbonara", "ingredients": ["spaghetti", "eggs", "pecorino cheese", "guanciale", "black pepper"], "cookingSteps": [...]}. Only identify common, well-known dishes.`;
        const requestBody = { contents: [{ parts: [ { text: prompt }, { inline_data: { mime_type: imageFile.type, data: base64Image } } ] }] };
        const response = await fetch(`${CONFIG.GEMINI_TEXT_API_URL}?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error('Invalid JSON response from AI');
    } catch (error) {
        console.error('Food analysis failed:', error);
        const recipes = Object.keys(recipeData);
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        return { dishName: recipeData[randomRecipe].title, ingredients: ["mock ingredient 1", "mock ingredient 2"], cookingSteps: recipeData[randomRecipe].steps };
    }
}

async function generateStepImage(instruction, stepTitle) {
    if (!CONFIG.ENABLE_AI_IMAGE_GENERATION) {
        return createRealisticStepPlaceholder(stepTitle, instruction);
    }
    const cacheKey = `${stepTitle}-${instruction}`;
    if (imageCache.has(cacheKey)) {
        return imageCache.get(cacheKey);
    }
    try {
        const imagePrompt = `Generate a realistic, high-quality photograph of a cooking step: ${instruction}. Show the actual cooking process in a clean, modern kitchen. Professional food photography style with good lighting, sharp focus, and appetizing presentation. No text, labels, or overlays in the image. Focus on the hands, ingredients, and cooking tools performing the specific action described.`;
        const generatedImage = await generateImageWithGemini(imagePrompt);
        imageCache.set(cacheKey, generatedImage);
        try {
            const imageCacheData = JSON.parse(localStorage.getItem('cookingImageCache') || '{}');
            imageCacheData[cacheKey] = generatedImage;
            localStorage.setItem('cookingImageCache', JSON.stringify(imageCacheData));
        } catch (storageError) { console.log('Could not save to local storage:', storageError); }
        return generatedImage;
    } catch (error) {
        console.error(`Image generation failed for step: ${stepTitle}`, error);
        return createRealisticStepPlaceholder(stepTitle, instruction);
    }
}

async function generateImageWithGemini(prompt) {
    try {
        const payload = { 
            contents: [{ parts: [{ text: prompt }] }], 
            generationConfig: { responseModalities: ['IMAGE'] } 
        };
        const response = await fetch(`${CONFIG.GEMINI_IMAGE_API_URL}?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const errorBody = await response.text(); throw new Error(`API request failed with status ${response.status}: ${errorBody}`); }
        const result = await response.json();
        const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!base64Data) { throw new Error('No image data found in API response.'); }
        const imageUrl = `data:image/png;base64,${base64Data}`;
        console.log(`Image generated for prompt "${prompt.substring(0,30)}..."`);
        return imageUrl;
    } catch (error) {
        console.error('Image generation with Gemini failed:', error);
        return createRealisticStepPlaceholder("Error", "Could not generate image");
    }
}

async function analyzeResultWithGemini(imageFile, originalRecipe) {
     if (!CONFIG.ENABLE_AI_ANALYSIS) {
        const qualities = ['good', 'okay', 'poor'];
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        return { scores: analysisData[randomQuality].scores, feedback: analysisData[randomQuality].feedback, overall: randomQuality };
    }
    try {
        const base64Image = await fileToBase64(imageFile);
        const requestBody = { contents: [{ parts: [ { text: `Analyze this cooked dish image and rate it on a scale of 1-5 for: color, texture, ingredients, presentation, and portion. Respond ONLY in English. Also provide constructive feedback. The dish should be: ${originalRecipe.title}. Respond in JSON format: {"scores": {"color": 4, "texture": 3, "ingredients": 5, "presentation": 4, "portion": 4}, "feedback": "Your detailed feedback here", "overall": "good/okay/poor"}` }, { inline_data: { mime_type: imageFile.type, data: base64Image } } ] }] };
        const response = await fetch(`${CONFIG.GEMINI_TEXT_API_URL}?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);
        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Result analysis failed:', error);
        const qualities = ['good', 'okay', 'poor'];
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        return { scores: analysisData[randomQuality].scores, feedback: analysisData[randomQuality].feedback, overall: randomQuality };
    }
}

// --- TTS FUNCTIONS ---
async function generateAndPlayTTS(text, voice = 'Puck') {
    if (!text) return;

    const payload = {
        contents: [{ parts: [{ text: `Speak in a friendly, clear, and encouraging tone: ${text}` }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    try {
        const response = await fetch(`${CONFIG.GEMINI_TTS_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

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
            
            audioPlayer.src = audioUrl;
            audioPlayer.play();
        } else {
            throw new Error("Invalid audio data in API response.");
        }
    } catch (error) {
        console.error("Error in generateAndPlayTTS:", error);
        speakText(text);
    }
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function pcmToWav(pcmData, numChannels, sampleRate) {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
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
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }
    return new Blob([view], { type: 'audio/wav' });
}
// --- END OF TTS FUNCTIONS ---


// Helper Functions
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Dynamic Recipe Creation Functions
async function createDynamicRecipe(analysis, originalImageFile) {
    try {
        showLoading('Generating ingredients and cooking steps...');
        const dynamicRecipe = {
            title: analysis.dishName,
            originalImage: URL.createObjectURL(originalImageFile),
            steps: []
        };

        await delay(1000); // Wait after analysis before image generation

        showLoading('Generating ingredients image...');
        const ingredientsList = (analysis.ingredients || []).join(', ');
        const ingredientsPrompt = `Generate a realistic, high-quality photograph showing all the ingredients needed to make ${analysis.dishName}: ${ingredientsList}. Display ingredients neatly arranged on a clean kitchen counter or cutting board. Professional food photography style with good lighting and sharp focus. Show fresh, appetizing ingredients laid out ready for cooking. No text or labels in the image.`;
        const ingredientsImage = await generateImageWithGemini(ingredientsPrompt);
        
        dynamicRecipe.ingredientsImage = ingredientsImage;
        
        const ingredientsInstruction = `First, gather your ingredients: ${ingredientsList}.`;
        dynamicRecipe.steps.push({
            id: 0,
            title: "Ingredients",
            instruction: ingredientsInstruction,
            timeEstimate: "5 minutes"
        });
        
        await delay(1000);

        showLoading('Generating step-by-step cooking images...');
        
        const cookingSteps = analysis.cookingSteps.slice(0, 4);
        const compositePrompt = `Create a single image as a 2x2 grid detailing four cooking steps for making ${analysis.dishName}. Each quadrant should be a realistic, appetizing photo. 
        Top-left (Step 1): ${cookingSteps[0]?.instruction || ''}. 
        Top-right (Step 2): ${cookingSteps[1]?.instruction || ''}. 
        Bottom-left (Step 3): ${cookingSteps[2]?.instruction || ''}. 
        Bottom-right (Step 4): ${cookingSteps[3]?.instruction || ''}. 
        Do not include any numbers, text, or graphic overlays on the image itself.`;

        const stepsImage = await generateImageWithGemini(compositePrompt);
        dynamicRecipe.compositeStepsImage = stepsImage;
        
        dynamicRecipe.steps.push(...analysis.cookingSteps);

        currentRecipe = dynamicRecipe;
        document.getElementById('recipe-title').textContent = currentRecipe.title;
        generateStepsGrid();
        hideLoading();
        showPage('steps-page');

    } catch (error) {
        console.error('Dynamic recipe creation failed:', error);
        hideLoading();
        const recipes = Object.keys(recipeData);
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        await loadRecipe(randomRecipe);
    }
}


function analyzeResultWithData(analysis, imageUrl) {
    currentAnalysis = {
        scores: analysis.scores,
        feedback: analysis.feedback,
    };
    document.getElementById('original-image').src = currentRecipe.originalImage;
    document.getElementById('result-image').src = imageUrl;
    generateRadarChart(currentAnalysis.scores);
    generateScoreDetails(currentAnalysis.scores);
    showPage('analysis-page');
}

// Social Sharing and Save Functions
async function createComparisonImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 800);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 1180, 780);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentRecipe.title} - Cooking Analysis`, 600, 60);

    const originalImg = new Image();
    const resultImg = new Image();
    originalImg.crossOrigin = "Anonymous";
    resultImg.crossOrigin = "Anonymous";

    return new Promise((resolve) => {
        let imagesLoaded = 0;
        const checkComplete = () => {
            imagesLoaded++;
            if (imagesLoaded === 2) {
                ctx.drawImage(originalImg, 100, 100, 300, 300);
                ctx.fillStyle = '#666666';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Original Recipe', 250, 430);
                ctx.drawImage(resultImg, 800, 100, 300, 300);
                ctx.fillText('Your Result', 950, 430);
                drawRadarChartOnCanvas(ctx, currentAnalysis.scores, 600, 500, 200);
                const averageScore = Object.values(currentAnalysis.scores).reduce((a, b) => a + b, 0) / 5;
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`Overall Score: ${averageScore.toFixed(1)}/5`, 600, 750);
                resolve(canvas.toDataURL('image/png'));
            }
        };
        originalImg.onload = checkComplete;
        resultImg.onload = checkComplete;
        originalImg.onerror = () => { console.error("Error loading original image for canvas."); checkComplete(); };
        resultImg.onerror = () => { console.error("Error loading result image for canvas."); checkComplete(); };
        originalImg.src = document.getElementById('original-image').src;
        resultImg.src = document.getElementById('result-image').src;
    });
}

function drawRadarChartOnCanvas(ctx, scores, centerX, centerY, radius) {
    const categories = ['Color', 'Texture', 'Ingredients', 'Presentation', 'Portion'];
    const values = [scores.color, scores.texture, scores.ingredients, scores.presentation, scores.portion];
    const angles = categories.map((_, i) => (Math.PI * 2 * i) / categories.length - Math.PI / 2);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let r = 1; r <= 5; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius * r) / 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.strokeStyle = '#cccccc';
    angles.forEach(angle => {
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(x, y); ctx.stroke();
    });

    ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.strokeStyle = 'rgba(102, 126, 234, 1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((value, i) => {
        const angle = angles[i]; const r = (value / 5) * radius;
        const x = centerX + Math.cos(angle) * r; const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath(); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = '#666666'; ctx.font = '14px Arial'; ctx.textAlign = 'center';
    categories.forEach((category, i) => {
        const angle = angles[i];
        const x = centerX + Math.cos(angle) * (radius + 30); const y = centerY + Math.sin(angle) * (radius + 30);
        ctx.fillText(category, x, y);
    });
}

async function shareToInstagram() {
    try {
        const imageDataUrl = await createComparisonImage();
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        if (navigator.share) {
            const file = new File([blob], 'cooking-analysis.png', { type: 'image/png' });
            await navigator.share({ title: `${currentRecipe.title} - Cooking Analysis`, text: `Check out my cooking analysis! ${currentAnalysis.feedback}`, files: [file] });
        } else {
            window.open(`https://www.instagram.com/`, '_blank');
            downloadImage(imageDataUrl, 'cooking-analysis-instagram.png');
        }
    } catch (error) {
        console.error('Instagram sharing failed:', error);
        alert('Sharing not available. Image will be downloaded instead.');
        downloadComparison();
    }
}

async function shareToTwitter() {
    const averageScore = Object.values(currentAnalysis.scores).reduce((a, b) => a + b, 0) / 5;
    const scoreEmoji = averageScore >= 4 ? '🌟' : averageScore >= 3 ? '👍' : '💪';
    const text = encodeURIComponent(`Just cooked ${currentRecipe.title} and got analyzed by AI! ${scoreEmoji}\nAverage score: ${averageScore.toFixed(1)}/5\n#CookingWithAI #VisualCookingAssistant`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

async function shareToFacebook() {
    const text = encodeURIComponent(`I just used the Visual Cooking Assistant to make ${currentRecipe.title}! The AI gave me detailed feedback and scores. Check out this amazing cooking tool!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`, '_blank');
}

async function saveToAlbum() {
    try {
        const imageDataUrl = await createComparisonImage();
        downloadImage(imageDataUrl, `${currentRecipe.title.replace(/\s+/g, '-')}-cooking-analysis.png`);
        alert('Image downloaded to your Downloads folder!');
    } catch (error) {
        console.error('Save to album failed:', error);
        alert('Save failed. Please try again.');
    }
}

async function downloadComparison() {
    try {
        const imageDataUrl = await createComparisonImage();
        downloadImage(imageDataUrl, `${currentRecipe.title.replace(/\s+/g, '-')}-comparison.png`);
    } catch (error) {
        console.error('Download failed:', error);
    }
}

function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Time Estimation Function
function estimateStepTime(instruction, stepTitle) {
    const text = (instruction + " " + stepTitle).toLowerCase();
    const timeRegex = /(\d+)\s*-\s*(\d+)\s*(minutes?|hours?)|(\d+)\s*(minutes?|hours?)/;
    const match = text.match(timeRegex);
    if (match) {
        return match[0];
    }
    if (text.includes('bake') || text.includes('roast')) return '15-25 minutes';
    if (text.includes('preheat') || text.includes('boil')) return '10-15 minutes';
    if (text.includes('simmer') || text.includes('marinate')) return '30+ minutes';
    if (text.includes('chop') || text.includes('slice') || text.includes('mix')) return '3-5 minutes';
    return '5-10 minutes';
}

function createRealisticStepPlaceholder(title, instruction) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#dee2e6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, 128, 128);
    return canvas.toDataURL();
}

