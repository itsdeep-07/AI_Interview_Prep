"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  getAIInterviewSession,
  submitAIAnswer,
  completeAIInterview,
} from "@/actions/aiInterview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Loader2,
  Award,
  AlertCircle,
  MessageSquare,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function AIInterviewRoomPage({ params }) {
  const unwrappedParams = use(params);
  const interviewId = unwrappedParams.id;
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [userAnswer, setUserAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Fetch initial session details
  useEffect(() => {
    async function loadSession() {
      try {
        const data = await getAIInterviewSession(interviewId);
        if (!data) {
          toast.error("Session not found");
          router.push("/ai-interview/setup");
          return;
        }
        setSession(data);
        setLoading(false);

        // Auto-speak the first question if unmuted
        const questions = Array.isArray(data.questions) ? data.questions : [];
        if (questions.length > 0 && !muted) {
          speakQuestion(questions[questions.length - 1].question);
        }
      } catch (err) {
        toast.error("Failed to load interview session");
        setLoading(false);
      }
    }

    loadSession();
  }, [interviewId]);

  // Setup Web Speech Recognition (STT) with clean transcript handling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
      } else {
        setSpeechSupported(true);
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            let finalTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcriptText = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcriptText;
              }
            }
            if (finalTranscript) {
              setUserAnswer((prev) =>
                prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()
              );
            }
          };

          recognition.onerror = (event) => {
            console.warn("Speech recognition notice/error:", event.error);
            if (event.error === "not-allowed") {
              toast.error("Microphone access was denied. Please check your browser permissions.");
            }
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("Failed to initialize SpeechRecognition:", e.message);
          setSpeechSupported(false);
        }
      }
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.questions, submitting]);

  // Speech Synthesis (TTS - AI Speaking)
  const speakQuestion = (text) => {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // stop previous speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e.message);
    }
  };

  const toggleMute = () => {
    if (!muted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setMuted(!muted);
  };

  const toggleMic = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast.error(
        "Speech recognition is not supported in your current browser. You can type your response in the text box!"
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Microphone listening... Speak your answer now.");
      } catch (e) {
        console.warn("Mic start error:", e.message);
        toast.error("Could not start microphone. Please check permissions.");
      }
    }
  };

  const handleAnswerSubmit = async (e) => {
    e?.preventDefault();
    if (!userAnswer.trim()) {
      toast.error("Please enter or speak your answer before submitting.");
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    setSubmitting(true);
    const answerText = userAnswer;
    setUserAnswer("");

    try {
      const res = await submitAIAnswer({
        interviewId,
        userResponse: answerText,
      });

      if (res.success) {
        // Refresh session state
        const updated = await getAIInterviewSession(interviewId);
        setSession(updated);

        // Speak the new question
        if (!muted) {
          speakQuestion(res.nextQuestion);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleAnswerSubmit(e);
    }
  };

  const handleFinishInterview = async () => {
    setCompleting(true);
    try {
      const res = await completeAIInterview({ interviewId });
      if (res.success) {
        toast.success("Scorecard generated!");
        router.push(`/ai-interview/${interviewId}/feedback`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to generate scorecard");
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <Loader2 className="animate-spin text-amber-400 mb-4" size={36} />
        <p className="text-stone-400 text-sm font-light">Loading AI Interview Room...</p>
      </div>
    );
  }

  const questions = Array.isArray(session?.questions) ? session.questions : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pt-24 min-h-screen flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-white font-medium text-lg leading-snug">
              {session.role} <span className="text-stone-500 font-light">@ {session.targetCompany}</span>
            </h1>
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 font-mono text-[10px]">
                {session.interviewType}
              </span>
              <span>•</span>
              <span>Question {questions.length}</span>
            </div>
          </div>
        </div>

        {/* Controls: Mute TTS & Finish Interview */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className={`text-xs flex items-center gap-1.5 ${
              muted ? "text-red-400 hover:text-red-300" : "text-stone-300 hover:text-amber-400"
            }`}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{muted ? "Voice Muted" : "Voice On"}</span>
          </Button>

          <Button
            variant="gold"
            size="sm"
            disabled={completing || (questions.length === 1 && !questions[0]?.answer)}
            onClick={handleFinishInterview}
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            {completing ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Award size={14} />
            )}
            <span>End & View Scorecard</span>
          </Button>
        </div>
      </div>

      {/* AI Visualizer Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/20 to-stone-900 border border-amber-500/20 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(251,191,36,0.05)]">
        <div className="flex items-center gap-4">
          {/* Animated Avatar */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/40 text-amber-400">
            <Bot size={28} className={isSpeaking ? "animate-bounce" : ""} />
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                AI Interviewer Avatar
              </span>
              {isSpeaking && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                  Speaking Question...
                </span>
              )}
            </div>
            <p className="text-stone-300 text-sm font-light mt-1">
              Listen to the AI's question, then use your microphone or text editor to answer.
            </p>
          </div>
        </div>
      </div>

      {/* Browser Support Notice */}
      {!speechSupported && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-6 flex items-center gap-3 text-amber-300 text-xs">
          <Info size={18} className="shrink-0 text-amber-400" />
          <span>
            <strong>Browser Notice:</strong> Speech-to-Text microphone recording is native in Chrome, Edge, and Safari. In your current browser, you can type your answers directly in the response box below!
          </span>
        </div>
      )}

      {/* Main Conversation Feed */}
      <div className="flex-1 space-y-6 mb-6 overflow-y-auto max-h-[500px] pr-2">
        {questions.map((q, idx) => (
          <div key={q.id || idx} className="space-y-4">
            {/* Question Bubble */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                <Bot size={16} />
              </div>
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 max-w-3xl text-stone-100 space-y-2 shadow-lg">
                <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                  Question {idx + 1}
                </div>
                <p className="text-base font-normal leading-relaxed text-amber-100/90">
                  {q.question}
                </p>
              </div>
            </div>

            {/* Candidate Answer Bubble (if already answered) */}
            {q.answer && (
              <div className="flex items-start justify-end gap-3">
                <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-5 max-w-3xl text-stone-200 space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400/80">
                    <span>Your Answer</span>
                    {q.rating && (
                      <span className="bg-amber-400/20 px-2 py-0.5 rounded text-amber-300 font-bold">
                        Score: {q.rating}/10
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-light text-stone-200 whitespace-pre-wrap">
                    {q.answer}
                  </p>
                  {q.feedback && (
                    <div className="pt-2 border-t border-amber-500/10 text-xs text-amber-300/80 flex items-start gap-2 italic">
                      <Sparkles size={14} className="shrink-0 mt-0.5 text-amber-400" />
                      <span>{q.feedback}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Answer Input Area */}
      {session.status === "IN_PROGRESS" && (
        <form onSubmit={handleAnswerSubmit} className="bg-[#0f0f11] border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between text-xs text-stone-400 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare size={14} className="text-amber-400" />
              Your Answer (Voice or Text)
            </span>
            <span className="text-[11px] text-stone-500 font-mono hidden sm:inline">
              Tip: Press Ctrl + Enter to submit
            </span>
          </div>

          <Textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or click the microphone to speak your response..."
            rows={3}
            className="bg-stone-900/60 border-white/10 text-white placeholder:text-stone-600 focus:border-amber-400/50 resize-none text-sm"
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Mic Toggle Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleMic}
              className={`flex items-center gap-2 text-xs transition-all ${
                isListening
                  ? "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse"
                  : "text-stone-300 border-white/10 hover:border-amber-400/40 hover:text-amber-400"
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              <span>
                {isListening
                  ? "Listening... (Click to Stop)"
                  : speechSupported
                  ? "Record Voice Answer"
                  : "Mic Unsupported in Browser"}
              </span>
            </Button>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gold"
              disabled={submitting || !userAnswer.trim()}
              className="flex items-center gap-2 text-xs font-semibold px-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Answer →</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
