
import React, { useState, useRef } from 'react';
import { BookOpen, Edit3, List, ChevronLeft, ChevronRight, Info, CheckCircle, Search, RefreshCw, Volume2, Loader2, Eye, EyeOff, Globe } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { WFD_DATA } from './data';
import { Sentence, AppMode } from './types';

// 音频解码辅助函数
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

type Accent = 'US' | 'UK';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LEARN);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [accent, setAccent] = useState<Accent>('US');
  
  // 显隐控制
  const [isEnglishVisible, setIsEnglishVisible] = useState(true);
  const [isChineseVisible, setIsChineseVisible] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentSentence = WFD_DATA[currentIndex];

  const handleNext = () => {
    if (currentIndex < WFD_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetState();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetState();
    }
  };

  const resetState = () => {
    setUserInput('');
    setShowResult(false);
    setShowTips(false);
    setIsSpeaking(false);
  };

  const checkAnswer = () => {
    setShowResult(true);
  };

  const speak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // 根据选择的口音调整提示词和音色
      const accentPrompt = accent === 'US' ? 'American English' : 'British English';
      const voiceName = accent === 'US' ? 'Puck' : 'Kore'; 

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this PTE sentence clearly in a standard ${accentPrompt} accent: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        
        const audioData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const renderFeedback = () => {
    const originalWords = currentSentence.english.split(/\s+/);
    const inputWords = userInput.trim().split(/\s+/);

    return (
      <div className="flex flex-wrap gap-1 text-lg leading-relaxed">
        {originalWords.map((word, idx) => {
          const cleanOriginal = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
          const cleanInput = (inputWords[idx] || "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
          const isCorrect = cleanOriginal === cleanInput;
          
          return (
            <span key={idx} className={isCorrect ? "text-green-600 font-medium" : "text-red-500 font-bold underline"}>
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-12">
      <header className="w-full bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">WFD 高频带练</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Accent Selector */}
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setAccent('US')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${accent === 'US' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                美式 (US)
              </button>
              <button 
                onClick={() => setAccent('UK')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${accent === 'UK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                英式 (UK)
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-full">
              <button 
                onClick={() => setMode(AppMode.LEARN)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === AppMode.LEARN ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
              >
                学习
              </button>
              <button 
                onClick={() => setMode(AppMode.PRACTICE)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === AppMode.PRACTICE ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
              >
                练习
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full px-4 mt-8 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden mr-4">
            <div 
              className="bg-indigo-500 h-full transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / WFD_DATA.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-indigo-600 whitespace-nowrap">{currentIndex + 1} / {WFD_DATA.length}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">ID: {currentSentence.id}</span>
                <div className="sm:hidden flex bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px]">
                   <button onClick={() => setAccent('US')} className={`px-1.5 py-0.5 rounded ${accent === 'US' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>US</button>
                   <button onClick={() => setAccent('UK')} className={`px-1.5 py-0.5 rounded ${accent === 'UK' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>UK</button>
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < currentSentence.difficulty ? 'bg-amber-400' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>

            {mode === AppMode.LEARN ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => speak(currentSentence.english)}
                      className="flex items-center gap-2 text-indigo-500 cursor-pointer group w-fit"
                    >
                      {isSpeaking ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider group-hover:underline">播放读音 ({accent})</span>
                    </div>
                    
                    <button 
                      onClick={() => setIsEnglishVisible(!isEnglishVisible)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 text-xs font-bold transition-colors"
                    >
                      {isEnglishVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {isEnglishVisible ? '隐藏原句' : '显示原句'}
                    </button>
                  </div>

                  <div className={`text-2xl md:text-3xl font-bold leading-snug transition-all duration-300 ${isEnglishVisible ? 'text-slate-800' : 'text-transparent bg-slate-100 rounded-lg select-none'}`}>
                    {currentSentence.segments.map((seg, i) => (
                      <span key={i} className={`inline-block mr-2 ${isEnglishVisible ? 'hover:text-indigo-600' : ''}`}>
                        {seg}{i < currentSentence.segments.length - 1 ? " /" : ""}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">中文翻译</div>
                    <button 
                      onClick={() => setIsChineseVisible(!isChineseVisible)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 text-xs font-bold transition-colors"
                    >
                      {isChineseVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {isChineseVisible ? '隐藏中文' : '显示中文'}
                    </button>
                  </div>
                  <p className={`text-xl font-medium transition-all duration-300 ${isChineseVisible ? 'text-slate-600' : 'text-transparent bg-slate-100 rounded-lg select-none'}`}>
                    {currentSentence.chinese}
                  </p>
                </div>

                {showTips ? (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
                    <div className="flex items-start gap-2">
                      <Info className="text-indigo-500 w-5 h-5 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-indigo-900 mb-1">精讲点拨</p>
                        <p className="text-indigo-800 leading-relaxed text-sm">{currentSentence.tips}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowTips(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                  >
                    查看学习笔记与陷阱提示
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">中文提示</span>
                       <button onClick={() => setIsChineseVisible(!isChineseVisible)} className="text-slate-400 hover:text-indigo-500">
                          {isChineseVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                       </button>
                    </div>
                    <p className={`text-lg italic font-medium transition-all ${isChineseVisible ? 'text-slate-600' : 'text-transparent bg-slate-200 rounded select-none'}`}>
                      "{currentSentence.chinese}"
                    </p>
                  </div>
                  <button 
                    onClick={() => speak(currentSentence.english)}
                    className="ml-4 p-3 text-indigo-500 hover:bg-white rounded-full transition-all shadow-sm border border-slate-200"
                    title={`播放${accent}读音`}
                  >
                    {isSpeaking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                <textarea
                  className="w-full min-h-[120px] p-4 text-xl border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none resize-none font-medium"
                  placeholder="在此输入你听到的句子..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={showResult}
                />

                {showResult && (
                  <div className="p-6 rounded-xl border-2 border-green-100 bg-green-50/30 animate-in zoom-in-95">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">批改结果</div>
                      <button onClick={() => setIsEnglishVisible(!isEnglishVisible)} className="text-slate-400 hover:text-indigo-500 text-xs font-bold">
                         {isEnglishVisible ? '查看原文' : '隐藏原文'}
                      </button>
                    </div>
                    {isEnglishVisible ? renderFeedback() : <div className="h-6 w-full bg-slate-200 rounded animate-pulse"></div>}
                    <div className="mt-4 pt-4 border-t border-green-100 text-sm text-slate-500">
                      提示：PTE WFD评分按词得分，不区分大小写。
                    </div>
                  </div>
                )}

                {!showResult ? (
                  <button 
                    onClick={checkAnswer}
                    disabled={!userInput.trim()}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> 检查答案
                  </button>
                ) : (
                  <button 
                    onClick={resetState}
                    className="w-full py-4 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" /> 重新练习
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border-t flex">
            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex-1 py-4 flex items-center justify-center gap-2 text-slate-600 font-bold hover:bg-slate-100 disabled:opacity-30 border-r border-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" /> 上一句
            </button>
            <button 
              onClick={handleNext}
              disabled={currentIndex === WFD_DATA.length - 1}
              className="flex-1 py-4 flex items-center justify-center gap-2 text-indigo-600 font-bold hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              下一句 <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <Globe className="w-4 h-4" />
              <h3 className="text-sm font-bold">口音切换</h3>
            </div>
            <p className="text-xs text-slate-500">PTE考试中会有美式、英式甚至澳洲口音，建议切换练习以适应。{accent === 'US' ? '当前：美音' : '当前：英音'}</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <EyeOff className="w-4 h-4" />
              <h3 className="text-sm font-bold">隐形训练</h3>
            </div>
            <p className="text-xs text-slate-500">尝试隐藏原文，仅凭听力复述句子，这是提升记忆力最快的方法。</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <Edit3 className="w-4 h-4" />
              <h3 className="text-sm font-bold">听写实战</h3>
            </div>
            <p className="text-xs text-slate-500">在练习模式中隐藏中文提示，完全模拟考场“盲听”环境。</p>
          </div>
        </div>
      </main>
      
      <footer className="mt-12 text-slate-400 text-xs text-center">
        <p>© 2024 PTE WFD Master. 多维度学习助手.</p>
        <p className="mt-1">Powered by Gemini 2.5 TTS & High Frequency Items.</p>
      </footer>
    </div>
  );
};

export default App;
