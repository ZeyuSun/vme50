// Mock Recipe Data
const recipeData = {
    pizza: {
        title: "Homemade Pizza",
        originalImage: "assets/samples/pizza.jpg",
        steps: [
            {
                id: 1,
                title: "Preheat",
                image: "assets/steps/preheat.png",
                audio: "assets/audio/preheat.mp3",
                instruction: "Preheat oven to 450°F"
            },
            {
                id: 2,
                title: "Roll Dough",
                image: "assets/steps/dough.png",
                audio: "assets/audio/roll-dough.mp3",
                instruction: "Roll out pizza dough on floured surface"
            },
            {
                id: 3,
                title: "Add Sauce",
                image: "assets/steps/sauce.png",
                audio: "assets/audio/add-sauce.mp3",
                instruction: "Spread tomato sauce evenly"
            },
            {
                id: 4,
                title: "Add Cheese",
                image: "assets/steps/cheese.png",
                audio: "assets/audio/add-cheese.mp3",
                instruction: "Sprinkle mozzarella cheese generously"
            },
            {
                id: 5,
                title: "Add Toppings",
                image: "assets/steps/toppings.png",
                audio: "assets/audio/add-toppings.mp3",
                instruction: "Add your favorite toppings"
            },
            {
                id: 6,
                title: "Bake",
                image: "assets/steps/bake.png",
                audio: "assets/audio/bake.mp3",
                instruction: "Bake for 12-15 minutes until golden"
            }
        ]
    },
    coffee: {
        title: "Perfect Coffee",
        originalImage: "assets/samples/coffee.jpg",
        steps: [
            {
                id: 1,
                title: "Boil Water",
                image: "assets/steps/boil.png",
                audio: "assets/audio/boil-water.mp3",
                instruction: "Boil water to 200°F"
            },
            {
                id: 2,
                title: "Grind Beans",
                image: "assets/steps/grind.png",
                audio: "assets/audio/grind-beans.mp3",
                instruction: "Grind coffee beans to medium coarse"
            },
            {
                id: 3,
                title: "Add Coffee",
                image: "assets/steps/add-coffee.png",
                audio: "assets/audio/add-coffee.mp3",
                instruction: "Add ground coffee to filter"
            },
            {
                id: 4,
                title: "Pour & Enjoy",
                image: "assets/steps/pour.png",
                audio: "assets/audio/pour-enjoy.mp3",
                instruction: "Pour hot water slowly and enjoy"
            }
        ]
    },
    sandwich: {
        title: "Gourmet Sandwich",
        originalImage: "assets/samples/sandwich.jpg",
        steps: [
            {
                id: 1,
                title: "Toast Bread",
                image: "assets/steps/toast.png",
                audio: "assets/audio/toast-bread.mp3",
                instruction: "Toast bread slices until golden"
            },
            {
                id: 2,
                title: "Add Spread",
                image: "assets/steps/spread.png",
                audio: "assets/audio/add-spread.mp3",
                instruction: "Apply mayo or mustard"
            },
            {
                id: 3,
                title: "Layer Meat",
                image: "assets/steps/meat.png",
                audio: "assets/audio/layer-meat.mp3",
                instruction: "Add sliced turkey or ham"
            },
            {
                id: 4,
                title: "Add Veggies",
                image: "assets/steps/veggies.png",
                audio: "assets/audio/add-veggies.mp3",
                instruction: "Layer lettuce, tomato, and cheese"
            },
            {
                id: 5,
                title: "Assemble",
                image: "assets/steps/assemble.png",
                audio: "assets/audio/assemble.mp3",
                instruction: "Close sandwich and cut diagonally"
            }
        ]
    }
};

// Mock Analysis Data
const analysisData = {
    good: {
        scores: { color: 5, texture: 4, ingredients: 5, presentation: 4, portion: 4 },
        feedback: "Excellent work! Your pizza looks delicious with perfect golden color and great cheese coverage.",
        audioFile: "assets/audio/feedback-excellent.mp3"
    },
    okay: {
        scores: { color: 3, texture: 4, ingredients: 3, presentation: 3, portion: 4 },
        feedback: "Good effort! Try adding more cheese next time and watch the oven temperature for better color.",
        audioFile: "assets/audio/feedback-good.mp3"
    },
    poor: {
        scores: { color: 2, texture: 2, ingredients: 2, presentation: 2, portion: 3 },
        feedback: "Keep practicing! The crust needs more time and try spreading ingredients more evenly.",
        audioFile: "assets/audio/feedback-practice.mp3"
    }
};

// Gemini API Configuration (loaded from config.js)
const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
const GEMINI_API_URL = CONFIG.GEMINI_API_URL;

// Global Variables
let currentRecipe = null;
let currentAnalysis = null;
let audioPlayer = null;
let currentPlayingStep = null;
let imageCache = new Map(); // Cache for generated images

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    audioPlayer = document.getElementById('audio-player');
    setupEventListeners();
    createPlaceholderAssets();
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
        // Use Gemini to analyze the uploaded food image
        const analysis = await analyzeUploadedFood(file);

        // Create dynamic recipe from AI analysis
        await createDynamicRecipe(analysis, file);

        hideLoading();
    } catch (error) {
        console.error('Image processing failed:', error);
        // Fallback to mock behavior
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
        // Use Gemini to analyze the result
        const analysis = await analyzeResultWithGemini(file, currentRecipe);

        const reader = new FileReader();
        reader.onload = function(e) {
            analyzeResultWithData(analysis, e.target.result);
            hideLoading();
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Result processing failed:', error);
        // Fallback to mock behavior
        const reader = new FileReader();
        reader.onload = function(e) {
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
    currentRecipe = recipeData[recipeKey];
    if (!currentRecipe) return;

    document.getElementById('recipe-title').textContent = currentRecipe.title;

    // Show loading while generating realistic step images
    showLoading('Generating realistic cooking steps...');

    try {
        // Generate realistic images for each step
        for (let i = 0; i < currentRecipe.steps.length; i++) {
            const step = currentRecipe.steps[i];
            const stepImage = await generateStepImage(step.instruction, step.title);
            currentRecipe.steps[i].image = stepImage;
        }

        hideLoading();
        generateStepsGrid();
        showPage('steps-page');
    } catch (error) {
        console.error('Failed to generate step images:', error);
        // Fallback to original behavior with realistic placeholders
        currentRecipe.steps.forEach(step => {
            step.image = createRealisticStepPlaceholder(step.title, step.instruction);
        });
        hideLoading();
        generateStepsGrid();
        showPage('steps-page');
    }
}

function generateStepsGrid() {
    const stepsGrid = document.getElementById('steps-grid');
    stepsGrid.innerHTML = '';

    currentRecipe.steps.forEach((step, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'step-card';
        stepCard.innerHTML = `
            <div class="step-number">${step.id}</div>
            <img src="${step.image}" alt="${step.title}" class="step-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNjY3ZWVhIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3RlcCAke3N0ZXAuaWR9PC90ZXh0Pgo8L3N2Zz4K'">
            <div class="step-title">${step.title}</div>
            <div class="audio-icon">🔊</div>
        `;

        stepCard.addEventListener('click', () => playStepAudio(step, stepCard));
        stepsGrid.appendChild(stepCard);
    });
}

function playStepAudio(step, stepCard) {
    // Stop current audio if playing
    if (currentPlayingStep) {
        currentPlayingStep.classList.remove('playing');
        audioPlayer.pause();
    }

    // Set new playing step
    currentPlayingStep = stepCard;
    stepCard.classList.add('playing');

    // Try to play audio file, fallback to speech synthesis
    audioPlayer.src = step.audio;
    audioPlayer.play().catch(() => {
        // Fallback to text-to-speech
        speakText(step.instruction);
    });
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        utterance.onend = () => {
            if (currentPlayingStep) {
                currentPlayingStep.classList.remove('playing');
                currentPlayingStep = null;
            }
        };

        speechSynthesis.speak(utterance);
    } else {
        // If no speech synthesis, just show visual feedback
        setTimeout(() => {
            if (currentPlayingStep) {
                currentPlayingStep.classList.remove('playing');
                currentPlayingStep = null;
            }
        }, 2000);
    }
}

function analyzeResult(quality, imageUrl) {
    currentAnalysis = analysisData[quality];

    // Set comparison images
    document.getElementById('original-image').src = currentRecipe.originalImage;
    document.getElementById('result-image').src = imageUrl;

    // Generate radar chart
    generateRadarChart(currentAnalysis.scores);

    // Generate score details
    generateScoreDetails(currentAnalysis.scores);

    showPage('analysis-page');
}

function generateRadarChart(scores) {
    const ctx = document.getElementById('radar-chart').getContext('2d');

    // Destroy existing chart if it exists
    if (window.radarChart) {
        window.radarChart.destroy();
    }

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
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function generateScoreDetails(scores) {
    const scoreGrid = document.getElementById('score-details');
    scoreGrid.innerHTML = '';

    Object.entries(scores).forEach(([category, score]) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';

        let scoreClass = 'score-poor';
        if (score >= 4) scoreClass = 'score-excellent';
        else if (score >= 3) scoreClass = 'score-good';

        scoreItem.innerHTML = `
            <div class="score-label">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            <div class="score-value ${scoreClass}">${score}/5</div>
        `;

        scoreGrid.appendChild(scoreItem);
    });
}

function playFeedback() {
    if (!currentAnalysis) return;

    // Try to play audio file, fallback to speech synthesis
    audioPlayer.src = currentAnalysis.audioFile;
    audioPlayer.play().catch(() => {
        speakText(currentAnalysis.feedback);
    });
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
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
    // Create placeholder images using data URLs for demo
    const placeholderImages = {
        'assets/samples/pizza.jpg': createPlaceholderImage('🍕', 'Pizza'),
        'assets/samples/coffee.jpg': createPlaceholderImage('☕', 'Coffee'),
        'assets/samples/sandwich.jpg': createPlaceholderImage('🥪', 'Sandwich'),
        'assets/results/pizza-good.jpg': createPlaceholderImage('🍕✨', 'Great Pizza'),
        'assets/results/pizza-okay.jpg': createPlaceholderImage('🍕👍', 'Good Pizza'),
        'assets/results/pizza-poor.jpg': createPlaceholderImage('🍕😅', 'Practice Pizza')
    };

    // Update image sources
    Object.entries(placeholderImages).forEach(([path, dataUrl]) => {
        document.querySelectorAll(`img[src="${path}"]`).forEach(img => {
            img.src = dataUrl;
        });
    });

    // Update recipe data with placeholder images
    Object.values(recipeData).forEach(recipe => {
        recipe.steps.forEach(step => {
            step.image = createStepPlaceholder(step.title, step.id);
        });
    });
}

function createPlaceholderImage(emoji, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, 200, 200);

    // Emoji
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, 100, 100);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(text, 100, 150);

    return canvas.toDataURL();
}

function createStepPlaceholder(title, stepNumber) {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, 80, 80);

    // Step number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(stepNumber, 40, 35);

    // Title
    ctx.font = '10px Arial';
    ctx.fillText(title, 40, 55);

    return canvas.toDataURL();
}

// Utility function to handle image loading errors
function handleImageError(img) {
    img.src = createPlaceholderImage('🖼️', 'Image');
}

// Gemini API Functions
async function analyzeUploadedFood(imageFile) {
    try {
        const base64Image = await fileToBase64(imageFile);

        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: "Analyze this food image and identify the dish. Provide a JSON response with: dishName (string), confidence (0-1), and cookingSteps (array of 4-6 step objects with id, title, and instruction). Focus on common, recognizable dishes. Example format: {\"dishName\": \"Pizza\", \"confidence\": 0.9, \"cookingSteps\": [{\"id\": 1, \"title\": \"Preheat\", \"instruction\": \"Preheat oven to 450°F\"}, ...]}"
                    },
                    {
                        inline_data: {
                            mime_type: imageFile.type,
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;

        // Parse JSON response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Food analysis failed:', error);
        // Fallback to random recipe
        const recipes = Object.keys(recipeData);
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        return {
            dishName: recipeData[randomRecipe].title,
            confidence: 0.5,
            cookingSteps: recipeData[randomRecipe].steps
        };
    }
}

async function generateStepImage(instruction, stepTitle) {
    try {
        // Check cache first
        const cacheKey = `${stepTitle}-${instruction}`;
        if (imageCache.has(cacheKey)) {
            return imageCache.get(cacheKey);
        }

        // Use Gemini to generate realistic cooking step images
        const imagePrompt = `Generate a realistic, high-quality photograph of a cooking step: ${instruction}. Show the actual cooking process in a clean, modern kitchen. Professional food photography style with good lighting, sharp focus, and appetizing presentation. No text, labels, or overlays in the image. Focus on the hands, ingredients, and cooking tools performing the specific action described.`;

        const generatedImage = await generateImageWithGemini(imagePrompt);

        // Cache the result
        imageCache.set(cacheKey, generatedImage);
        return generatedImage;

    } catch (error) {
        console.error('Image generation failed:', error);
        // Fallback to realistic placeholder without text
        return createRealisticStepPlaceholder(stepTitle, instruction);
    }
}

async function generateImageWithGemini(prompt) {
    try {
        // Note: Gemini doesn't currently support image generation
        // Using alternative methods for realistic cooking images

        // Try OpenAI DALL-E 3 if API key is available
        if (CONFIG.OPENAI_API_KEY && CONFIG.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY') {
            console.log('Attempting DALL-E 3 image generation...');
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024",
                    quality: "standard"
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('DALL-E 3 image generated successfully');
                return data.data[0].url;
            } else {
                console.log('DALL-E 3 failed:', response.status, response.statusText);
            }
        } else {
            console.log('OpenAI API key not configured, skipping DALL-E 3');
        }

        // Try Unsplash API for realistic food photography
        console.log('Attempting Unsplash API...');
        const unsplashQuery = extractFoodKeywords(prompt);

        // Use a more reliable Unsplash access key (you should replace this with your own)
        const unsplashResponse = await fetch(`https://api.unsplash.com/photos/random?query=${unsplashQuery}&orientation=square`, {
            headers: {
                'Authorization': 'Client-ID 8XJLd4k_4VI6HVKyKUfF7w7_JbqNVqbR8QK8V8mHNms'
            }
        });

        if (unsplashResponse.ok) {
            const data = await unsplashResponse.json();
            console.log('Unsplash image retrieved successfully');
            return data.urls.regular;
        } else {
            console.log('Unsplash failed:', unsplashResponse.status, unsplashResponse.statusText);
        }

        // If all external APIs fail, throw error to use fallback placeholder
        throw new Error('All image generation methods failed');
    } catch (error) {
        console.error('Image generation failed:', error);
        throw error;
    }
}

async function generateRealisticImage(prompt) {
    try {
        // First try OpenAI DALL-E 3 if API key is available
        if (CONFIG.OPENAI_API_KEY && CONFIG.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY') {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024",
                    quality: "standard"
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.data[0].url;
            }
        }

        // Fallback: Use Unsplash API for food photography
        const unsplashQuery = extractFoodKeywords(prompt);
        const unsplashResponse = await fetch(`https://api.unsplash.com/photos/random?query=${unsplashQuery}&orientation=square&client_id=demo`);

        if (unsplashResponse.ok) {
            const data = await unsplashResponse.json();
            return data.urls.regular;
        }

        throw new Error('All image generation methods failed');
    } catch (error) {
        console.error('Realistic image generation failed:', error);
        throw error;
    }
}

function extractFoodKeywords(prompt) {
    // Extract relevant food/cooking keywords from the prompt
    const foodKeywords = ['cooking', 'food', 'kitchen', 'ingredients', 'recipe', 'chef', 'preparation'];
    const words = prompt.toLowerCase().split(' ');
    const relevantWords = words.filter(word =>
        word.length > 3 &&
        (foodKeywords.some(keyword => word.includes(keyword)) ||
         ['bake', 'cook', 'prep', 'mix', 'chop', 'slice', 'dice', 'sauté', 'boil', 'fry'].includes(word))
    );
    return relevantWords.slice(0, 3).join(',') || 'cooking,food,kitchen';
}

function createRealisticStepPlaceholder(title, instruction) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Create a realistic kitchen/cooking background
    const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 200);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(0.3, '#e9ecef');
    gradient.addColorStop(0.7, '#dee2e6');
    gradient.addColorStop(1, '#adb5bd');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);

    // Add realistic kitchen counter texture
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 400;
        const y = Math.random() * 400;
        const size = Math.random() * 3 + 1;
        ctx.fillRect(x, y, size, size);
    }

    // Add subtle wood grain effect
    ctx.strokeStyle = 'rgba(0,0,0,0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * 400);
        ctx.lineTo(400, Math.random() * 400);
        ctx.stroke();
    }

    // Create cooking-related visual elements based on instruction (no text)
    const inst = instruction.toLowerCase();

    // Draw abstract cooking shapes/elements
    ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';

    if (inst.includes('oven') || inst.includes('bake')) {
        // Draw oven-like rectangle
        ctx.fillRect(150, 150, 100, 80);
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(150, 150, 100, 80);
    } else if (inst.includes('water') || inst.includes('boil')) {
        // Draw pot/water circles
        ctx.beginPath();
        ctx.arc(200, 200, 60, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    } else if (inst.includes('cut') || inst.includes('slice')) {
        // Draw cutting board rectangle
        ctx.fillRect(120, 180, 160, 40);
        ctx.strokeRect(120, 180, 160, 40);
    } else if (inst.includes('mix') || inst.includes('stir')) {
        // Draw bowl circle
        ctx.beginPath();
        ctx.arc(200, 200, 50, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    } else {
        // Default cooking surface
        ctx.fillRect(100, 180, 200, 40);
        ctx.strokeRect(100, 180, 200, 40);
    }

    // Add subtle highlight to make it look more realistic
    const highlight = ctx.createLinearGradient(0, 0, 400, 400);
    highlight.addColorStop(0, 'rgba(255,255,255,0.1)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = highlight;
    ctx.fillRect(0, 0, 400, 400);

    return canvas.toDataURL();
}

async function analyzeResultWithGemini(imageFile, originalRecipe) {
    try {
        const base64Image = await fileToBase64(imageFile);

        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `Analyze this cooked dish image and rate it on a scale of 1-5 for: color, texture, ingredients, presentation, and portion. Also provide constructive feedback. The dish should be: ${originalRecipe.title}. Respond in JSON format: {"scores": {"color": 4, "texture": 3, "ingredients": 5, "presentation": 4, "portion": 4}, "feedback": "Your detailed feedback here", "overall": "good/okay/poor"}`
                    },
                    {
                        inline_data: {
                            mime_type: imageFile.type,
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;

        // Parse JSON response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Result analysis failed:', error);
        // Fallback to random analysis
        const qualities = ['good', 'okay', 'poor'];
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        return {
            scores: analysisData[randomQuality].scores,
            feedback: analysisData[randomQuality].feedback,
            overall: randomQuality
        };
    }
}

// Helper Functions
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function createEnhancedStepPlaceholder(title, instruction) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 200);

    // Add cooking-related emoji based on instruction
    let emoji = '🍳';
    if (instruction.toLowerCase().includes('oven') || instruction.toLowerCase().includes('bake')) emoji = '🔥';
    if (instruction.toLowerCase().includes('water') || instruction.toLowerCase().includes('boil')) emoji = '💧';
    if (instruction.toLowerCase().includes('cut') || instruction.toLowerCase().includes('slice')) emoji = '🔪';
    if (instruction.toLowerCase().includes('mix') || instruction.toLowerCase().includes('stir')) emoji = '🥄';
    if (instruction.toLowerCase().includes('cheese')) emoji = '🧀';
    if (instruction.toLowerCase().includes('sauce')) emoji = '🍅';

    // Draw emoji
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, 100, 100);

    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(title, 100, 140);

    // Draw instruction (truncated)
    ctx.font = '12px Arial';
    const truncatedInstruction = instruction.length > 30 ? instruction.substring(0, 30) + '...' : instruction;
    ctx.fillText(truncatedInstruction, 100, 165);

    return canvas.toDataURL();
}

// Dynamic Recipe Creation Functions
async function createDynamicRecipe(analysis, originalImageFile) {
    try {
        showLoading('Generating cooking steps...');

        // Create recipe object from AI analysis
        const dynamicRecipe = {
            title: analysis.dishName,
            originalImage: URL.createObjectURL(originalImageFile),
            steps: []
        };

        // Generate enhanced step images for each cooking step
        for (let i = 0; i < analysis.cookingSteps.length; i++) {
            const step = analysis.cookingSteps[i];
            const stepImage = await generateStepImage(step.instruction, step.title);

            dynamicRecipe.steps.push({
                id: step.id,
                title: step.title,
                image: stepImage,
                audio: `assets/audio/${step.title.toLowerCase().replace(/\s+/g, '-')}.mp3`,
                instruction: step.instruction
            });
        }

        // Set as current recipe and display
        currentRecipe = dynamicRecipe;
        document.getElementById('recipe-title').textContent = currentRecipe.title;
        generateStepsGrid();
        showPage('steps-page');

    } catch (error) {
        console.error('Dynamic recipe creation failed:', error);
        // Fallback to static recipe
        const recipes = Object.keys(recipeData);
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        loadRecipe(randomRecipe);
    }
}

function analyzeResultWithData(analysis, imageUrl) {
    // Create analysis object compatible with existing system
    currentAnalysis = {
        scores: analysis.scores,
        feedback: analysis.feedback,
        audioFile: `assets/audio/feedback-${analysis.overall}.mp3`
    };

    // Set comparison images
    document.getElementById('original-image').src = currentRecipe.originalImage;
    document.getElementById('result-image').src = imageUrl;

    // Generate radar chart
    generateRadarChart(currentAnalysis.scores);

    // Generate score details
    generateScoreDetails(currentAnalysis.scores);

    showPage('analysis-page');
}

// Social Sharing and Save Functions
async function createComparisonImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentRecipe.title} - Cooking Analysis`, 400, 50);

    // Load and draw images
    const originalImg = new Image();
    const resultImg = new Image();

    return new Promise((resolve) => {
        let imagesLoaded = 0;

        const checkComplete = () => {
            imagesLoaded++;
            if (imagesLoaded === 2) {
                // Draw original image
                ctx.drawImage(originalImg, 50, 100, 200, 200);
                ctx.fillStyle = 'white';
                ctx.font = '18px Arial';
                ctx.fillText('Original Recipe', 150, 320);

                // VS text
                ctx.font = 'bold 24px Arial';
                ctx.fillText('VS', 400, 200);

                // Draw result image
                ctx.drawImage(resultImg, 550, 100, 200, 200);
                ctx.font = '18px Arial';
                ctx.fillText('Your Result', 650, 320);

                // Add scores
                ctx.font = '20px Arial';
                ctx.fillText('Your Scores:', 400, 380);

                let y = 410;
                Object.entries(currentAnalysis.scores).forEach(([category, score]) => {
                    ctx.fillText(`${category}: ${score}/5`, 400, y);
                    y += 30;
                });

                // Add feedback
                ctx.font = '16px Arial';
                const words = currentAnalysis.feedback.split(' ');
                let line = '';
                y = 550;

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > 700 && n > 0) {
                        ctx.fillText(line, 400, y);
                        line = words[n] + ' ';
                        y += 20;
                        if (y > 590) break;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, 400, y);

                resolve(canvas.toDataURL());
            }
        };

        originalImg.onload = checkComplete;
        resultImg.onload = checkComplete;

        originalImg.src = document.getElementById('original-image').src;
        resultImg.src = document.getElementById('result-image').src;
    });
}

async function shareToInstagram() {
    try {
        const imageDataUrl = await createComparisonImage();

        // Convert to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();

        if (navigator.share) {
            // Use Web Share API if available
            const file = new File([blob], 'cooking-analysis.png', { type: 'image/png' });
            await navigator.share({
                title: `${currentRecipe.title} - Cooking Analysis`,
                text: `Check out my cooking analysis! ${currentAnalysis.feedback}`,
                files: [file]
            });
        } else {
            // Fallback: Open Instagram web
            const text = encodeURIComponent(`Check out my cooking analysis for ${currentRecipe.title}! 🍳✨`);
            window.open(`https://www.instagram.com/`, '_blank');

            // Also trigger download so user can manually upload
            downloadImage(imageDataUrl, 'cooking-analysis-instagram.png');
        }
    } catch (error) {
        console.error('Instagram sharing failed:', error);
        alert('Instagram sharing not available. Image will be downloaded instead.');
        downloadComparison();
    }
}

async function shareToTwitter() {
    try {
        const averageScore = Object.values(currentAnalysis.scores).reduce((a, b) => a + b, 0) / 5;
        const scoreEmoji = averageScore >= 4 ? '🌟' : averageScore >= 3 ? '👍' : '💪';

        const text = encodeURIComponent(
            `Just cooked ${currentRecipe.title} and got analyzed by AI! ${scoreEmoji}\n` +
            `Average score: ${averageScore.toFixed(1)}/5\n` +
            `${currentAnalysis.feedback.substring(0, 100)}...\n` +
            `#CookingWithAI #VisualCookingAssistant #FoodTech`
        );

        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    } catch (error) {
        console.error('Twitter sharing failed:', error);
        alert('Twitter sharing failed. Please try again.');
    }
}

async function shareToFacebook() {
    try {
        const text = encodeURIComponent(
            `I just used the Visual Cooking Assistant to make ${currentRecipe.title}! ` +
            `The AI gave me detailed feedback and scores. Check out this amazing cooking tool!`
        );

        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`, '_blank');
    } catch (error) {
        console.error('Facebook sharing failed:', error);
        alert('Facebook sharing failed. Please try again.');
    }
}

async function saveToAlbum() {
    try {
        const imageDataUrl = await createComparisonImage();

        // Use the File System Access API if available
        if ('showSaveFilePicker' in window) {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: `${currentRecipe.title.replace(/\s+/g, '-')}-cooking-analysis.png`,
                types: [{
                    description: 'PNG Images',
                    accept: { 'image/png': ['.png'] }
                }]
            });

            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            alert('Image saved to your selected location!');
        } else {
            // Fallback: trigger download
            downloadImage(imageDataUrl, `${currentRecipe.title.replace(/\s+/g, '-')}-cooking-analysis.png`);
            alert('Image downloaded to your Downloads folder!');
        }
    } catch (error) {
        console.error('Save to album failed:', error);
        alert('Save failed. Image will be downloaded instead.');
        downloadComparison();
    }
}

async function downloadComparison() {
    try {
        const imageDataUrl = await createComparisonImage();
        downloadImage(imageDataUrl, `${currentRecipe.title.replace(/\s+/g, '-')}-comparison.png`);
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
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
