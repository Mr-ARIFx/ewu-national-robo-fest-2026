import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, Download, RotateCw, ZoomIn, ZoomOut, Trash2, CheckCircle2, Info, Layout, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import getCroppedImg from './lib/cropImage';

// Constants
const FRAMES = [
  { id: 'frame1', name: 'Lightning Blue', url: '/frame1.png', color: '#00A3FF' },
  { id: 'frame2', name: 'Robo Crimson', url: '/frame2.png', color: '#DC143C' },
];

const CANVAS_SIZE = 2000;

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(e.dataTransfer.files[0]);
    }
  };

  const downloadDP = async () => {
    if (!image || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      // 1. Get the cropped image
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      if (!croppedImage) throw new Error('Failed to crop image');

      // 2. Create a high-res canvas for merging
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // 3. Load both images
      const [userImg, frameImg] = await Promise.all([
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = croppedImage;
        }),
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = selectedFrame.url;
        }),
      ]);

      // 4. Draw user image (fill the whole canvas)
      ctx.drawImage(userImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 5. Draw frame overlay (force fill to cover edges)
      ctx.drawImage(frameImg, 0, 0, frameImg.width, frameImg.height, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 6. Trigger download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `EWU_RoboFest_DP_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [selectedFrame.color, '#ffffff', '#001F3F']
      });
    } catch (error) {
      console.error('Error generating DP:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#000814]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="EWU National Robo Fest 2026 Logo" 
                className="h-full w-auto object-contain"
                onError={(e) => {
                  // Fallback if logo.svg is not found
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20"><svg class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>';
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none uppercase">EWU National Robo Fest 2026</h1>
              <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest mt-1">Official Profile Generator</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHowTo(!showHowTo)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Editor */}
          <div className="lg:col-span-7 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Layout className="w-6 h-6 text-blue-500" />
                  Create Your DP
                </h2>
                {image && (
                  <button 
                    onClick={() => setImage(null)}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Reset
                  </button>
                )}
              </div>

              {!image ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    "relative aspect-square rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-6 cursor-pointer group overflow-hidden",
                    isDragging 
                      ? "border-blue-500 bg-blue-500/10 scale-[0.99]" 
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Drop your photo here</p>
                    <p className="text-sm text-white/40">or click to browse from device</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  {/* Decorative corners */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-500/30 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-500/30 rounded-br-lg" />
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                    <Cropper
                      image={image}
                      crop={crop}
                      zoom={zoom}
                      rotation={rotation}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      onRotationChange={setRotation}
                      classes={{
                        containerClassName: "bg-black",
                        cropAreaClassName: "border-2 border-blue-500 rounded-none shadow-[0_0_0_9999px_rgba(0,0,0,0.8)]",
                        mediaClassName: "bg-black"
                      }}
                    />
                    
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <img 
                        src={selectedFrame.url} 
                        alt="Frame Preview" 
                        className="w-full h-full object-fill opacity-90"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                          <ZoomIn className="w-4 h-4" /> Zoom
                        </label>
                        <span className="text-xs font-mono text-blue-400">{Math.round(zoom * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                          <RotateCw className="w-4 h-4" /> Rotation
                        </label>
                        <span className="text-xs font-mono text-blue-400">{rotation}°</span>
                      </div>
                      <input
                        type="range"
                        value={rotation}
                        min={0}
                        max={360}
                        step={1}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Frame Selection & Actions */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">Select Frame</h2>
              <div className="grid grid-cols-2 gap-4">
                {FRAMES.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    className={cn(
                      "relative group p-4 rounded-2xl border transition-all duration-300 text-left",
                      selectedFrame.id === frame.id 
                        ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50" 
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-black/40 border border-white/5 flex items-center justify-center relative">
                      <img 
                        src={frame.url} 
                        alt={frame.name} 
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex flex-col items-center justify-center p-4 text-center">
                                <svg class="w-8 h-8 text-white/20 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span class="text-[10px] text-white/40 uppercase font-bold">Upload ${frame.id}.png to /public</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    <p className="font-semibold text-sm">{frame.name}</p>
                    {selectedFrame.id === frame.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/20 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Ready to go?</h3>
                <p className="text-white/80 text-sm">Download your high-resolution profile frame and share it on social media!</p>
              </div>
              
              <button
                disabled={!image || isProcessing}
                onClick={downloadDP}
                className={cn(
                  "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95",
                  !image || isProcessing 
                    ? "bg-white/10 text-white/40 cursor-not-allowed" 
                    : "bg-white text-blue-900 hover:bg-blue-50 shadow-lg"
                )}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download DP
                  </>
                )}
              </button>
            </section>

            {/* How to use section */}
            <AnimatePresence>
              {(showHowTo || !image) && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      How to use
                    </h3>
                    <ul className="space-y-3 text-sm text-white/60">
                      <li className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                        Upload your profile picture (JPG or PNG)
                      </li>
                      <li className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                        Adjust crop, zoom, and rotation to fit the frame
                      </li>
                      <li className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                        Click 'Download DP' to save your high-res image
                      </li>
                    </ul>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 mt-20 py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-white/40 text-sm">© 2026 East West University National Robo Fest. All rights reserved.</p>
          <div className="flex items-center justify-center gap-6">
            <a href="#" className="text-xs text-white/20 hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-white/20 hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-white/20 hover:text-blue-400 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
