# VME50: Vision Means Everything in 50% Scenario

**VME50** is an image-to-image search and interaction platform built for situations where text is too complex, urgent, or hard to describe. Instead of typing, users simply upload a picture and explore results directly through vision.

---

## 🚀 Features
- **Where to Find It** – Identify the object or scene in an image and locate it (e.g., landmarks, products, places).  
- **How to Make It** – Break down the image into components with step-by-step visual instructions.  
- **Audio Guidance** – Each step includes an audio button with text-to-speech playback for accessibility.  
- **Vision Alignment Score** – Upload your own recreation photo and get a similarity score compared to the original.  
- **Social Sharing** – Share your results and scores for fun, competition, or collaboration.  
- **Accessible Design** – Minimal typing required, optimized for users who prefer to show rather than tell.  

---

## 🥇 How to Use
1. **Upload an Image**  
   - Choose your own picture or a sample image (e.g., landmark, food, object).  
   - Click **“Where to Find It”** to identify what and where it is.  

2. **Learn How to Recreate It**  
   - Click **“How to Make It”** to view visual step-by-step instructions.  
   - Play audio guidance for hands-free accessibility.  

3. **Recreate and Compare**  
   - Upload your version (e.g., a dish, DIY item, or Lego model).  
   - Receive a **vision alignment score** with radar-style analysis.  
   - Share the score with friends or on social media.  

---

## 🎬 Demo Flow
1. Upload a photo of the **bridge outside the venue**  
2. Click **“Where to Find It”** → system identifies the bridge and location  
3. Click **“How to Make It”** → system explains structural components and steps  
4. Highlight **audio button** (no need to play during demo)  
5. Upload a **Lego bridge sample** → system generates similarity score  

---

## ⚙️ Technical Notes
- **Advanced AI** – Do visual recognition and analysis in smooth work flow
- **Text-to-Speech** – Browser speech synthesis for audio steps  
- **Radar Chart Scoring** – Visual feedback for alignment score  
- **Responsive UI** – Works across desktop and mobile  
- **Progressive Enhancement** – Accessible with fallbacks  

---

## 📂 File Structure
```
full_version/
├── index.html # Main app
├── style.css # Styling
├── script.js # Core logic
└── README.md # This file
```

---

## ▶️ How to Run
In the `full_version/` directory, start a local server with:

```bash
cd full_version
python -m http.server 8000
```

Then open http://localhost:8000
 in your browser.

## 🌐 Browser Support

- ✅ Chrome / Edge – Full support

- ✅ Firefox – Full support

- ✅ Safari – Full support

- ✅ Mobile browsers – Optimized

## 🔮 Future Enhancements

- User accounts & saved searches

- Social leaderboard for vision alignment scores

- Multi-language & offline audio support

# ✨ VME50 makes search visual, accessible, and creative.