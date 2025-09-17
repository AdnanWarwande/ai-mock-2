import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

const VAPI_WEB_TOKEN = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
const VAPI_WORKFLOW_ID = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

export async function POST(request: Request) {
  const { type, role, level, techstack, amount = 5, userid } = await request.json();

  if (!VAPI_WEB_TOKEN || !VAPI_WORKFLOW_ID) {
    console.error("Missing VAPI_WEB_TOKEN or VAPI_WORKFLOW_ID in environment variables");
    return Response.json({ success: false, error: "Vapi credentials not configured" }, { status: 500 });
  }

  try {
    // Call Vapi workflow
    const vapiResponse = await fetch("https://api.vapi.ai/call/web", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VAPI_WEB_TOKEN}`,
      },
      body: JSON.stringify({
        workflowId: VAPI_WORKFLOW_ID,
        input: { type, role, level, techstack, amount, userid },
      }),
    });

    const vapiData = await vapiResponse.json();

    if (!vapiResponse.ok) {
      console.error("Vapi error:", vapiData);
      return Response.json({ success: false, error: vapiData }, { status: vapiResponse.status });
    }

    // Store interview in Firebase
    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(","),
      questions: vapiData?.output?.questions || [], // adjust according to your workflow output
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);

    return Response.json({ success: true, interviewId: docRef.id, data: vapiData }, { status: 200 });
  } catch (error) {
    console.error("Error calling Vapi workflow:", error);
    return Response.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "API is working!" }, { status: 200 });
}
