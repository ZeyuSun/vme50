# Visual Cooking Assistant

A hackathon webapp that provides visual, audio-guided cooking instructions with AI-powered result analysis.

## Features

- **Visual Recipe Steps**: Upload food images to get step-by-step visual cooking instructions
- **Audio Guidance**: Click on any step to hear audio instructions (uses text-to-speech)
- **Result Analysis**: Upload your finished dish to get a radar chart analysis comparing your result
- **Mobile-Friendly**: Responsive design optimized for all devices
- **No Text Required**: Designed for accessibility - minimal text, maximum visual/audio feedback

## How to Use

### 1. Get Cooking Instructions
- Upload a food image or click on sample images (Pizza, Coffee, Sandwich)
- View visual step-by-step instructions
- Click on any step card to hear audio instructions

### 2. Analyze Your Results
- After cooking, upload a photo of your finished dish
- Get instant analysis with radar chart showing scores for:
  - Color
  - Texture
  - Ingredients
  - Presentation
  - Portion
- Click "Hear Feedback" for audio analysis

## Demo Flow

1. **Start**: Click on Pizza sample image
2. **Steps**: Click through cooking steps to hear instructions
3. **Cook**: (Simulate cooking the dish)
4. **Upload Result**: Click "Upload Your Result" and try sample results
5. **Analysis**: View radar chart and click "Hear Feedback"

## Technical Features

- **Mock AI**: Simulates image recognition and analysis
- **Text-to-Speech**: Fallback audio using browser's speech synthesis
- **Radar Charts**: Visual performance analysis using Chart.js
- **Responsive Design**: Works on desktop and mobile
- **Progressive Enhancement**: Graceful fallbacks for all features

## File Structure

```
visual-cooking-assistant/
├── index.html          # Main application
├── style.css           # Visual-first styling
├── script.js           # Core functionality
└── README.md           # This file
```

## Browser Compatibility

- Chrome/Edge: Full functionality
- Firefox: Full functionality
- Safari: Full functionality
- Mobile browsers: Optimized experience

## Demo Tips

- Use sample images for reliable demo experience
- Audio works best in Chrome/Edge
- Mobile responsive - test on different screen sizes
- Loading animations simulate AI processing time

## Hackathon Ready

This webapp is designed for hackathon presentations:
- Quick setup (no dependencies)
- Reliable demo flow
- Visual impact
- Clear value proposition
- Accessibility focus

## Future Enhancements

- Real AI integration (OpenAI Vision API)
- Real audio files for better quality
- User accounts and recipe saving
- Social sharing features
- Multi-language support
