/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, Video, Copy, Check, Loader2, Sparkles, RefreshCw, Wand2, Download, Settings2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePromptFromMedia, generateImageFromPrompt } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const STYLES = ['none', 'Cinematic', 'Photographic', 'Anime', 'Digital Art', '3D Render', 'Comic Book', 'Fantasy Art', 'Neon Punk'];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'generated'>('source');
  
  // Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('none');
  const [negativePrompt, setNegativePrompt] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setError(null);
    
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      setError('Please upload an image or video file.');
      return;
    }
    
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15MB limit. Please choose a smaller file.');
      return;
    }

    setFile(selectedFile);
    setActiveTab('source');
    
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleGeneratePrompt = async () => {
    if (!file) return;
    
    setIsGeneratingPrompt(true);
    setError(null);
    
    try {
      const base64Data = await fileToBase64(file);
      const generated = await generatePromptFromMedia(file.type, base64Data);
      setPrompt(generated);
    } catch (err) {
      console.error(err);
      setError('Failed to generate prompt. Please try again.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first.');
      return;
    }
    
    setIsGeneratingImage(true);
    setError(null);
    
    try {
      const imageUrl = await generateImageFromPrompt(prompt, aspectRatio, style, negativePrompt);
      setGeneratedImage(imageUrl);
      setActiveTab('generated');
    } catch (err) {
      console.error(err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetSource = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans relative overflow-hidden flex flex-col items-center p-6 md:p-12">
      {/* Atmosphere */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 bg-indigo-600 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-6xl mx-auto space-y-10 relative z-10">
        
        <header className="text-center space-y-5 mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl shadow-2xl mb-2 backdrop-blur-md"
          >
            <Sparkles className="w-7 h-7 text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
          >
            Prompt Studio
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/40 max-w-2xl mx-auto font-light"
          >
            Reverse-engineer prompts from media, or generate new images from text prompts.
          </motion.p>
        </header>

        <main className="grid lg:grid-cols-2 gap-6">
          
          {/* Left Column: Media Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col"
          >
            <div className="bg-[#0F0F11] rounded-3xl p-2 shadow-2xl border border-white/5 h-full flex flex-col min-h-[550px] backdrop-blur-xl">
              
              {/* Segmented Control */}
              <div className="flex p-1 bg-black/40 rounded-2xl mb-4 mx-4 mt-4">
                <button
                  onClick={() => setActiveTab('source')}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === 'source' 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  Source Media
                </button>
                <button
                  onClick={() => setActiveTab('generated')}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === 'generated' 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  Generated Image
                </button>
              </div>
              
              <div className="flex-1 flex flex-col px-4 pb-4">
                {activeTab === 'source' ? (
                  <>
                    {!file ? (
                      <div 
                        className={`flex-1 border border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${
                          isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept="image/*,video/*" 
                          className="hidden" 
                        />
                        <div className="flex space-x-4 mb-5 text-white/20">
                          <ImageIcon className="w-10 h-10" />
                          <Video className="w-10 h-10" />
                        </div>
                        <p className="text-white/70 font-medium text-center mb-2">Click to upload or drag and drop</p>
                        <p className="text-white/30 text-sm text-center">SVG, PNG, JPG, GIF or MP4 (max. 15MB)</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <div className="relative flex-1 bg-black/50 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px]">
                          {file.type.startsWith('video/') ? (
                            <video 
                              src={previewUrl!} 
                              controls 
                              className="max-w-full max-h-[400px] object-contain"
                            />
                          ) : (
                            <img 
                              src={previewUrl!} 
                              alt="Preview" 
                              className="max-w-full max-h-[400px] object-contain"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4 px-2">
                          <div className="flex items-center space-x-3 text-sm text-white/60 truncate pr-4">
                            <div className="p-2 bg-white/5 rounded-lg">
                              {file.type.startsWith('video/') ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                            <span className="truncate font-medium">{file.name}</span>
                          </div>
                          <button 
                            onClick={resetSource}
                            className="text-sm text-white/40 hover:text-white flex items-center space-x-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Change</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleGeneratePrompt}
                      disabled={!file || isGeneratingPrompt}
                      className={`mt-6 w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
                        !file || isGeneratingPrompt 
                          ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                          : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                      }`}
                    >
                      {isGeneratingPrompt ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Analyzing Media...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Reverse Engineer Prompt</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col">
                    {!generatedImage ? (
                      <div className="flex-1 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-white/30 bg-black/20">
                        <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-center font-medium text-white/50">No image generated yet</p>
                        <p className="text-center text-sm mt-2 max-w-xs">Enter a prompt and click "Generate Image" to see results here.</p>
                      </div>
                    ) : (
                      <div className="relative flex-1 bg-black/50 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px] group">
                        <img 
                          src={generatedImage} 
                          alt="Generated" 
                          className="max-w-full max-h-[400px] object-contain"
                        />
                        <a 
                          href={generatedImage}
                          download="generated-image.png"
                          className="absolute bottom-4 right-4 p-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl shadow-xl hover:bg-white/10 text-white transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                          title="Download Image"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Prompt Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col"
          >
            <div className="bg-[#0F0F11] rounded-3xl p-6 shadow-2xl border border-white/5 h-full flex flex-col relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">Prompt Editor</h2>
                </div>
                
                <AnimatePresence>
                  {prompt && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={copyToClipboard}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 rounded-lg text-xs font-medium transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start space-x-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex-1 relative mb-6 flex flex-col group">
                {isGeneratingPrompt && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400 space-y-4 bg-[#0F0F11]/80 backdrop-blur-sm rounded-2xl z-10 border border-white/5">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium animate-pulse">Decoding visual data...</p>
                  </div>
                )}
                <div className="absolute top-4 left-4 text-white/20 pointer-events-none">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Upload media to reverse-engineer a prompt, or type/paste a prompt here..."
                  className="w-full flex-1 min-h-[150px] pl-10 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl resize-none focus:outline-none focus:border-indigo-500/50 focus:bg-black/60 font-mono text-sm leading-relaxed text-white/80 transition-all placeholder:text-white/20"
                />
              </div>

              {/* Advanced Settings Toggle */}
              <div className="mb-6 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-4 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Settings2 className="w-4 h-4" />
                    <span>Generation Parameters</span>
                  </div>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="p-4 pt-0 space-y-4 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40 ml-1">Aspect Ratio</label>
                            <div className="relative">
                              <select 
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-indigo-500/50 appearance-none"
                              >
                                {ASPECT_RATIOS.map(ratio => (
                                  <option key={ratio} value={ratio} className="bg-[#0F0F11]">{ratio}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40 ml-1">Style Preset</label>
                            <div className="relative">
                              <select 
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-indigo-500/50 appearance-none"
                              >
                                {STYLES.map(s => (
                                  <option key={s} value={s} className="bg-[#0F0F11]">{s === 'none' ? 'None' : s}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40 ml-1">Negative Prompt</label>
                          <input 
                            type="text"
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="e.g. blurry, low quality, distorted..."
                            className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={!prompt.trim() || isGeneratingImage}
                className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
                  !prompt.trim() || isGeneratingImage 
                    ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]'
                }`}
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Synthesizing Image...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
