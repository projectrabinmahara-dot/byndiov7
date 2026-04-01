@import "tailwindcss";

@theme {
  --font-sans: "Segoe UI", Arial, ui-sans-serif, system-ui, sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #F5F5F5;
  color: #212121;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Smooth page transitions */
main {
  animation: fadeIn 0.18s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #aaa; }

/* Ticker Animation */
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Hide scrollbar for category nav */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Focus styles */
input:focus, textarea:focus, select:focus {
  outline: none;
}
button:focus-visible {
  outline: 2px solid #1565C0;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Smooth transitions globally */
a, button {
  transition-property: color, background-color, border-color, opacity, transform, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: ease;
}

/* Image placeholder shimmer */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite;
}

/* Toast / badge pop */
@keyframes popIn {
  0%   { transform: scale(0.8); opacity: 0; }
  60%  { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.pop-in { animation: popIn 0.25s ease-out; }

/* Spin utility for loading indicators */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin { animation: spin 0.8s linear infinite; }
