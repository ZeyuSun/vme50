// Gemini API Configuration
// Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API key from Google AI Studio
// Get your API key at: https://makersuite.google.com/app/apikey

const CONFIG = {
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY', // Replace with your actual API key
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',

    // OpenAI API for realistic image generation (optional)
    OPENAI_API_KEY: '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', // Replace with your OpenAI API key for DALL-E 3

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
