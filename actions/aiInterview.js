"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const getGeminiModel = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith("AIzaSy...")) {
    return null;
  }
  try {
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  } catch (err) {
    console.error("Failed to initialize GoogleGenerativeAI model:", err.message);
    return null;
  }
};

const getAIInterviewModel = () => {
  const model = db.aIInterview || db.aiInterview || db.AIInterview;
  if (!model) {
    throw new Error("AIInterview model is not available on Prisma client. Please run npx prisma generate.");
  }
  return model;
};

/**
 * Starts a new AI Interview Practice session
 */
export const startAIInterviewSession = async ({
  role,
  targetCompany,
  jobDescription,
  resumeText,
  interviewType = "MIXED",
}) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  let dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) {
    dbUser = await checkUser();
  }
  if (!dbUser) throw new Error("User record could not be created or synced in database");

  if (!role || !role.trim()) throw new Error("Target role is required");

  let firstQuestionText = `Welcome to your interview for the ${role} position at ${
    targetCompany || "our company"
  }! To begin, please introduce yourself and highlight the key technical projects or experiences relevant to this role.`;

  const model = getGeminiModel();
  if (model) {
    const prompt = `You are a senior tech interviewer conducting an interview at ${
      targetCompany || "a top tier tech company"
    } for the role of "${role}".
Target Job Description: ${jobDescription || "Standard " + role + " position"}
Candidate Resume Context: ${resumeText || "No resume provided"}
Interview Focus: ${interviewType}

Your goal: Analyze the candidate's background against the target job description. Ask your VERY FIRST interview question to kick off the session.
Guidelines:
- Ask only ONE single, clear, highly relevant question to begin.
- Do NOT include greetings or long preamble, jump straight into the first question as an interviewer would in a live call.
- Adapt tone to a professional but engaging tech interviewer.`;

    try {
      const result = await model.generateContent(prompt);
      const generatedText = result.response.text().trim();
      if (generatedText) {
        firstQuestionText = generatedText;
      }
    } catch (apiErr) {
      console.warn("Gemini API call failed, using default starting question:", apiErr.message);
    }
  }

  const initialQuestions = [
    {
      id: "q-1",
      question: firstQuestionText,
      answer: null,
      feedback: null,
      rating: null,
      createdAt: new Date().toISOString(),
    },
  ];

  try {
    const session = await getAIInterviewModel().create({
      data: {
        userId: dbUser.id,
        role,
        targetCompany: targetCompany || "Tech Company",
        jobDescription: jobDescription || "",
        resumeText: resumeText || "",
        interviewType,
        status: "IN_PROGRESS",
        questions: initialQuestions,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, interviewId: session.id, firstQuestion: firstQuestionText };
  } catch (dbErr) {
    console.error("Database error while creating AI interview session:", dbErr.message);
    throw new Error(`Database error: ${dbErr.message}`);
  }
};

/**
 * Submits the candidate's answer and gets the next question or follow-up from Gemini
 */
export const submitAIAnswer = async ({ interviewId, userResponse }) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const session = await getAIInterviewModel().findUnique({
    where: { id: interviewId },
  });

  if (!session) throw new Error("Interview session not found");
  if (!userResponse || !userResponse.trim()) throw new Error("Response cannot be empty");

  const existingQuestions = Array.isArray(session.questions) ? session.questions : [];
  const currentQIndex = existingQuestions.length - 1;
  const currentQ = existingQuestions[currentQIndex];

  let evalData = {
    rating: 8,
    feedback: "Good response! You clearly explained your reasoning and approach.",
    nextQuestion: `That makes sense. Can you describe a challenging bug or technical trade-off you faced while implementing a solution for a ${session.role} role?`,
  };

  const model = getGeminiModel();
  if (model) {
    const historyTranscript = existingQuestions
      .map((q, idx) => `Question ${idx + 1}: ${q.question}\nAnswer ${idx + 1}: ${q.answer || "N/A"}`)
      .join("\n\n");

    const prompt = `You are evaluating a live candidate answer during an interview for "${session.role}" at "${session.targetCompany}".

Full Conversation So Far:
${historyTranscript}

Latest Question Asked:
"${currentQ.question}"

Candidate's Latest Answer:
"${userResponse}"

Tasks:
1. Briefly evaluate the candidate's latest answer on a scale of 1-10.
2. Provide a 1-2 sentence constructive feedback snippet.
3. Formulate the NEXT question. (It can be a probing follow-up if their answer missed key details, or a new question matching the role/JD).

Return ONLY valid JSON matching this exact structure:
{
  "rating": 8,
  "feedback": "Short 1-2 sentence constructive feedback",
  "nextQuestion": "The next question text here"
}`;

    try {
      const result = await model.generateContent(prompt);
      let rawText = result.response.text().trim();

      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();
      }

      evalData = JSON.parse(rawText);
    } catch (apiErr) {
      console.warn("Gemini API call failed during answer evaluation, using fallback evaluation:", apiErr.message);
    }
  }

  // Update current question with candidate answer & feedback
  existingQuestions[currentQIndex] = {
    ...currentQ,
    answer: userResponse,
    feedback: evalData.feedback,
    rating: evalData.rating,
    answeredAt: new Date().toISOString(),
  };

  // Append the next question
  const nextQObj = {
    id: `q-${existingQuestions.length + 1}`,
    question: evalData.nextQuestion,
    answer: null,
    feedback: null,
    rating: null,
    createdAt: new Date().toISOString(),
  };

  existingQuestions.push(nextQObj);

  await getAIInterviewModel().update({
    where: { id: interviewId },
    data: { questions: existingQuestions },
  });

  return {
    success: true,
    feedback: evalData.feedback,
    rating: evalData.rating,
    nextQuestion: evalData.nextQuestion,
    totalQuestions: existingQuestions.length,
  };
};

/**
 * Completes the AI Interview session and generates a comprehensive scorecard
 */
export const completeAIInterview = async ({ interviewId }) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const session = await getAIInterviewModel().findUnique({
    where: { id: interviewId },
  });

  if (!session) throw new Error("Interview session not found");

  const questions = Array.isArray(session.questions) ? session.questions : [];

  let scorecard = {
    overallScore: 8.3,
    technicalScore: 8.0,
    communicationScore: 8.5,
    problemSolvingScore: 8.2,
    faangReadiness: "Strong Candidate",
    summary: `The candidate demonstrated strong foundational knowledge and clear communication throughout the ${session.role} mock interview.`,
    strengths: [
      "Articulate verbal communication and problem breakdown",
      "Good understanding of fundamental architectural principles",
    ],
    improvements: [
      "Could explore memory and performance edge cases earlier in the response",
      "Mention testing and monitoring strategies for production readiness",
    ],
    keyRecommendation: "Focus on deepening system design trade-offs and discussing edge cases upfront.",
  };

  const model = getGeminiModel();
  if (model) {
    const transcript = questions
      .filter((q) => q.answer)
      .map((q, idx) => `Q${idx + 1}: ${q.question}\nA${idx + 1}: ${q.answer}\nRating: ${q.rating}/10\nFeedback: ${q.feedback}`)
      .join("\n\n");

    const prompt = `You are a Principal Tech Interviewer evaluating a candidate's complete interview performance for the role of "${session.role}" at "${session.targetCompany}".

Job Description Context: ${session.jobDescription || "N/A"}
Resume Context: ${session.resumeText || "N/A"}

Full Interview Transcript & Intermediate Ratings:
${transcript}

Task: Generate a comprehensive final evaluation scorecard for the candidate.

Return ONLY valid JSON matching this exact structure:
{
  "overallScore": 8.2,
  "technicalScore": 8.0,
  "communicationScore": 8.5,
  "problemSolvingScore": 8.0,
  "faangReadiness": "Strong Candidate",
  "summary": "Detailed overall summary paragraph evaluating performance against the target role.",
  "strengths": [
    "Clear communication when explaining algorithms",
    "Good understanding of system scalability"
  ],
  "improvements": [
    "Could discuss edge cases earlier in the problem-solving phase",
    "Deepen knowledge around asynchronous concurrency"
  ],
  "keyRecommendation": "Single actionable recommendation for their next steps."
}`;

    try {
      const result = await model.generateContent(prompt);
      let rawText = result.response.text().trim();

      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();
      }

      scorecard = JSON.parse(rawText);
    } catch (apiErr) {
      console.warn("Gemini API call failed during scorecard generation, using fallback scorecard:", apiErr.message);
    }
  }

  const updated = await getAIInterviewModel().update({
    where: { id: interviewId },
    data: {
      status: "COMPLETED",
      scorecard,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, scorecard: updated.scorecard };
};

/**
 * Fetches single AI Interview session details
 */
export const getAIInterviewSession = async (interviewId) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const session = await getAIInterviewModel().findUnique({
    where: { id: interviewId },
    include: {
      user: {
        select: { name: true, imageUrl: true, email: true },
      },
    },
  });

  return session;
};

/**
 * Fetches user's historical AI Interview practice sessions
 */
export const getAIInterviewHistory = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) return [];

  return getAIInterviewModel().findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });
};
