# 🦸‍♂️ Superhero AR Arcade & HUD

<div align="center">
  <h3>✨ Interactive Augmented Reality Experience for Education & Fun ✨</h3>
  <p>
    An immersive web-based AR platform powered by <strong>MediaPipe</strong> and <strong>React Three Fiber</strong>.
    <br />
    Turn your browser into a magical mirror that lets you interact with virtual elements using just your hands and body!
  </p>
</div>

---

## 🎮 Game Modes & Features

This project features a collection of interactive AR experiences designed to be both educational and entertaining.

### 🩻 **X-Ray / Anatomy Scanner**
- **Educational Tool**: Explore the human body!
- **How it works**: Uses body tracking to map internal organs (Brain, Heart, Lungs) onto your video feed.
- **Interaction**: Hover your hand over an organ to "scan" it and learn facts or watch educational videos.

### 🌋 **The Floor is Lava**
- **Action Game**: Jump and move to avoid the rising virtual lava!
- **Tech**: Full-body pose detection tracks your elevation.

### 🎹 **Musical Instruments**
- **Piano & Music Games**: Play virtual instruments in the air.
- **Hand Tracking**: Precision hand tracking detects finger taps on virtual keys.

### 🦖 **Dinosaur & Claw Games**
- **Interactive Fun**: Control game elements using hand gestures.
- **The Claw**: Use hand pinching gestures to grab virtual prizes.

---

## 🛠️ Technology Stack

Built with cutting-edge web technologies for high-performance real-time computer vision.

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **3D Engine**: [Three.js](https://threejs.org/) via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **Computer Vision**: [Google MediaPipe](https://developers.google.com/mediapipe) (Hand & Pose Detection)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

---

## 💻 System Requirements

For the best experience, ensure your system meets these minimum requirements:

| Component | Requirement |
|-----------|-------------|
| **Browser** | Modern Chrome, Edge, Safari, or Firefox (must support WebGL 2) |
| **Camera** | Webcam required (1280x720 recommended) |
| **Processor** | Intel i5 (6th Gen) or equivalent / Apple Silicon (M1+) |
| **Graphics** | GPU with WebGL 2 hardware acceleration support |
| **RAM** | 4GB Minimum (8GB+ Recommended) |

> **Note**: This application is heavy on GPU usage due to real-time AI and 3D rendering. It runs best on Desktop PCs/Laptops and high-end mobile devices.

---

## 🚀 Getting Started

Follow these steps to run the project locally:

### 1. Installation
Clone the repository and install dependencies:

```bash
# Install dependencies
npm install
```

### 2. Run Development Server
Start the local server. This will launch the application in your default browser.

```bash
# Start dev server
npm run dev
```

### 3. Grant Permissions
When the app opens, your browser will ask for **Camera Permission**. Click **Allow** to enable the AR features.

---

## 📂 Project Structure

- `components/ARPlayground/`: Core AR logic (VisionManager, Camera handling).
- `components/XRayGame.tsx`: Implementation of the Anatomy/X-Ray game.
- `components/VisionManager.tsx`: Manages MediaPipe (Hand/Pose) initialization and loops.
- `public/videos/`: Assets for the educational content.

---

<div align="center">
  <sub>Built by Erol Külüşlü</sub>
</div>
