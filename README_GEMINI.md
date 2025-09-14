# Visual Cooking Assistant with Gemini AI Integration

This enhanced version of the Visual Cooking Assistant now includes **Gemini 2.5 Flash (Nano Banana)** integration for dynamic food recognition and recipe generation.

## 🚀 New AI Features

### 1. **Smart Food Recognition**
- Upload any food image and Gemini AI will identify the dish
- Automatically generates custom cooking steps based on the identified food
- Works with a wide variety of dishes beyond the sample recipes

### 2. **Dynamic Recipe Generation**
- AI-powered step-by-step cooking instructions
- Enhanced visual placeholders with context-aware emojis
- Personalized cooking guidance based on your uploaded image

### 3. **Intelligent Result Analysis**
- Upload your finished dish for AI-powered feedback
- Detailed scoring across 5 categories (color, texture, ingredients, presentation, portion)
- Constructive feedback to improve your cooking skills

## 🔧 Setup Instructions

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 2: Configure the Application

1. Open `config.js` in your project directory
2. Replace `'YOUR_GEMINI_API_KEY'` with your actual API key:

```javascript
const CONFIG = {
    GEMINI_API_KEY: 'your-actual-api-key-here', // Replace this
    // ... other settings
};
```

### Step 3: Run the Application

Choose one of these methods:

**Option 1: Python Server (Recommended)**
```bash
python3 -m http.server 8000
```
Then open: http://localhost:8000

**Option 2: Node.js Server**
```bash
npx serve .
```

**Option 3: Direct File Access**
Simply open `index.html` in any modern browser

## 🎯 How to Use the AI Features

### Upload Food Images
1. Click the upload area or drag & drop a food image
2. Gemini AI will analyze and identify the dish
3. Get custom cooking steps generated specifically for your dish
4. Click on step cards to hear audio instructions

### Analyze Your Results
1. After following the cooking steps, click "Upload Your Result"
2. Upload a photo of your finished dish
3. Gemini AI will analyze your cooking performance
4. View detailed scores and get constructive feedback
5. Click "Hear Feedback" for audio analysis

## ⚙️ Configuration Options

In `config.js`, you can customize:

```javascript
const CONFIG = {
    GEMINI_API_KEY: 'your-api-key',

    // Enable/disable AI features
    ENABLE_AI_ANALYSIS: true,        // Food recognition & result analysis
    ENABLE_AI_IMAGE_GENERATION: true, // Enhanced step images

    // Cache settings
    ENABLE_IMAGE_CACHE: true,        // Cache generated images
    MAX_CACHE_SIZE: 50              // Maximum cached items
};
```

## 🔄 Fallback Behavior

The app is designed to work seamlessly even if:
- No API key is provided
- API requests fail
- Network is unavailable

In these cases, it automatically falls back to the original mock behavior with sample recipes.

## 🎨 Enhanced Features

### Smart Step Images
- Context-aware emoji selection based on cooking instructions
- Gradient backgrounds for better visual appeal
- Instruction text overlay for clarity

### Improved Loading States
- "Analyzing your image with AI..." for food recognition
- "Generating cooking steps..." for recipe creation
- "Analyzing your cooking result with AI..." for result analysis

### Caching System
- Generated images are cached to reduce API calls
- Improves performance for repeated operations
- Configurable cache size limits

## 🚨 Troubleshooting

### API Key Issues
- **Error**: "API request failed: 403"
- **Solution**: Check that your API key is correct and has proper permissions

### Network Issues
- **Error**: "Failed to fetch"
- **Solution**: Check internet connection; app will fall back to mock data

### Image Upload Issues
- **Error**: "Please select an image file"
- **Solution**: Ensure you're uploading JPG, PNG, or other image formats

## 📊 API Usage & Costs

- **Food Recognition**: ~1 API call per uploaded image
- **Result Analysis**: ~1 API call per result upload
- **Image Generation**: Currently uses enhanced placeholders (no API calls)

Gemini 2.5 Flash is cost-effective for this use case. Monitor your usage at [Google AI Studio](https://makersuite.google.com/).

## 🔮 Future Enhancements

- **Real Image Generation**: When Gemini adds image generation capabilities
- **Multi-language Support**: Recipe instructions in different languages
- **Recipe Saving**: Save and share your AI-generated recipes
- **Advanced Analysis**: More detailed cooking feedback and tips

## 🏆 Demo Tips

For presentations and demos:
1. Use high-quality food images for best AI recognition
2. Try various dishes to showcase AI versatility
3. Upload both good and poor cooking results to show analysis range
4. Emphasize the accessibility features (audio, visual-first design)

## 📝 Technical Notes

- Uses Gemini 2.5 Flash model for optimal speed and cost
- Implements robust error handling and fallbacks
- Maintains backward compatibility with original features
- Progressive enhancement approach for AI features

---

**Ready to cook with AI? 🍳✨**

Your Visual Cooking Assistant is now powered by cutting-edge AI technology, making cooking more accessible, interactive, and educational than ever before!
