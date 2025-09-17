// app/api/vapi/generate/route.ts
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json();

  // 1) Handle Vapi workflow function calls (generateQuestions)
  if (body.functionCall) {
    const { name, parameters } = body.functionCall;

    if (name === "generateQuestions") {
      const { role, level, techstack, amount = 5, userid } = parameters;

      try {
        const { text: questions } = await generateText({
          model: google("gemini-2.0-flash-001"),
          prompt: `Prepare questions for a job interview.
            Role: ${role}
            Level: ${level}
            Tech stack: ${techstack}
            Amount: ${amount}
            Focus: technical
            Format: ["Question 1", "Question 2"]`,
        });

        const interview = {
          role,
          type: "Technical",
          level,
          techstack: techstack.split(","),
          questions: JSON.parse(questions),
          userId: userid,
          finalized: true,
          coverImage: getRandomInterviewCover(),
          createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection("interviews").add(interview);

        return NextResponse.json(
          { success: true, questions: JSON.parse(questions), interviewId: docRef.id },
          { status: 200 }
        );
      } catch (error) {
        console.error("Error generating questions:", error);
        return NextResponse.json(
          { success: false, error: "Failed to generate questions" },
          { status: 500 }
        );
      }
    }
  }

  // 2) Forward requests to Vapi with Authorization header
  try {
    const vapiResponse = await fetch("https://api.vapi.ai/call/web", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`, // ✅ secure key
      },
      body: JSON.stringify(body),
    });

    const data = await vapiResponse.json();
    return NextResponse.json(data, { status: vapiResponse.status });
  } catch (error) {
    console.error("Error calling Vapi:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reach Vapi" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: "Thank you!" }, { status: 200 });
}
