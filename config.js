// Gemini API Configuration
// Replace with your actual Gemini API key from Google AI Studio
// Get your API key at: https://makersuite.google.com/app/apikey

const CONFIG = {
    // IMPORTANT: Replace with your actual Gemini API key
    GEMINI_API_KEY: "", 

    // API endpoint for text-based analysis (e.g., analyzing uploaded food)
    GEMINI_TEXT_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent',
    
    // API endpoint for image generation using the 'nano-banana' model
    GEMINI_IMAGE_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent',
    
    // API endpoint for Text-to-Speech (TTS) generation
    GEMINI_TTS_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',

    // Enable/disable AI features (set to false to use mock data only)
    ENABLE_AI_ANALYSIS: true,
    ENABLE_AI_IMAGE_GENERATION: true,

    // Cache settings
    ENABLE_IMAGE_CACHE: true,
    MAX_CACHE_SIZE: 50,

    // Social sharing settings
    ENABLE_SOCIAL_SHARING: true,
    ENABLE_SAVE_TO_ALBUM: true
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}

