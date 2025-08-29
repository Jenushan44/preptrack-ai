export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL_NAME = "gpt-4o-mini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.uid;
    const goalId = body?.goalId;
    const goalTitle = body?.goalTitle;
    const goalConstraints = body?.constraints ?? "none";


    if (!userId || !goalId || !goalTitle) { // Sends error message if required information is missing
      return new Response("Missing uid, goalId, or goalTitle", { status: 400 });
    }


    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) { // returns an error if openai key is missing
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }


    const systemInstruction = "You are a planner. Return only JSON and nothing else."; // tells ai what role to play
    // Gives ai the actual goal and provides actual JSON structure 
    const userInstruction = `Goal: ${goalTitle} 
Constraints: ${goalConstraints}

Return JSON in this shape:
{
  "tasks": [
    {
      "name": "string",
      "category": "Study|Practice|Review|Project",
    
      "priority": "Low|Medium|High",
      "estMinutes": number
    
      }
  ]
}`;



    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userInstruction },
        ],
      }),
    });


    const data = await response.json();
    let text = data?.choices?.[0]?.message?.content ?? "";

    text = text.replace(/```json|```/g, "").trim(); // Cleans up the AI response

    let parsedInformation;
    try {
      parsedInformation = JSON.parse(text);
    } catch {
      return new Response("OpenAI didnn't return valid JSON", { status: 502 });

    }

    if (!parsedInformation || !Array.isArray(parsedInformation.tasks)) {
      return new Response("JSON did not contain tasks[]", { status: 502 }); //  return error if empty list
    }

    return Response.json({ goalId, tasks: parsedInformation.tasks });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    path: "/api/goals/llm-plan",
    hasApiKey: Boolean(process.env.OPENAI_API_KEY),
  });

}
