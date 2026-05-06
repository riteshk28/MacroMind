import { useState, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { Mic, Square, Loader2, Save, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function VoiceLogger() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { addLog } = useAppStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (blob: Blob) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const textResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!textResponse.ok) {
        const err = await textResponse.json();
        throw new Error(err.error || "Transcription failed");
      }

      const { text } = await textResponse.json();
      setTranscript(text);
      if (text) {
        await processTextToLog(text);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to process audio.");
      setIsProcessing(false);
    }
  };

  const processTextToLog = async (text: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!parseRes.ok) {
        const err = await parseRes.json();
        throw new Error(err.error || "Parsing failed");
      }

      const result = await parseRes.json();
      const totalCalories = result.items.reduce((sum: number, item: any) => sum + item.calories, 0);

      // Save to database
      const saveRes = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: result.mealType || 'Snack',
          items: result.items || [],
          totalCalories,
          rawText: text
        })
      });

      if (!saveRes.ok) throw new Error("Failed to save to database");

      const savedLog = await saveRes.json();
      addLog(savedLog); // Update local store state

      setTranscript('');
      setErrorMsg("Successfully logged!");
      setTimeout(() => setErrorMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process nutrition data.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 max-w-lg mx-auto w-full font-sans">
       <div className="text-center mb-10 mt-6">
         <h1 className="text-3xl font-bold text-zinc-900">Log your meal</h1>
         <p className="text-zinc-500 font-medium mt-2 text-sm leading-relaxed max-w-xs mx-auto">
           Speak naturally. Our AI tracks state (raw vs cooked) automatically. e.g. "I had 150g cooked chicken breast."
         </p>
       </div>

       {/* Big Mic Button */}
       <div className="relative flex items-center justify-center mb-12">
          {isRecording && (
            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={cn(
              "relative z-10 w-28 h-28 rounded-[2rem] flex items-center justify-center transition-all duration-300 shadow-xl disabled:opacity-50",
              isRecording 
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
            )}
          >
            {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-10 h-10" />}
          </button>
       </div>

       {/* Transcript Box */}
       <div className="w-full bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100 transition-all">
         <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your spoken text will appear here. You can also type manually."
            className="w-full bg-zinc-50 p-4 border border-zinc-100 rounded-2xl outline-none resize-none text-zinc-800 placeholder-zinc-400 min-h-[120px] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
         ></textarea>
         
         <div className="flex justify-between items-center mt-4">
            <button 
              onClick={() => setTranscript('')} 
              disabled={!transcript || isProcessing}
              className="text-zinc-400 hover:text-rose-500 disabled:opacity-50 transition-colors p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => processTextToLog(transcript)}
              disabled={!transcript || isProcessing}
              className="flex items-center space-x-2 bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 hover:bg-zinc-800 transition-colors"
            >
               {isProcessing ? (
                 <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                 </>
               ) : (
                 <>
                   <Save className="w-4 h-4" />
                   <span>Log Meal</span>
                 </>
               )}
            </button>
         </div>
       </div>

       {errorMsg && (
         <div className={cn("mt-6 p-4 rounded-2xl text-sm max-w-sm text-center w-full shadow-sm font-bold border", errorMsg.includes("Success") ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
           {errorMsg}
         </div>
       )}
    </div>
  );
}
