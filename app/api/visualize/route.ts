import { NextRequest, NextResponse } from "next/server"

type Mode = "manga" | "coloring";

function promptsFromRag(
    answer: string,
    mode: Mode,
    imageCount: number
): string[] {
    const base = answer.slice(0, 1500);
    const prompts: string[] = [];

    for (let i = 1; i <= imageCount; i++) {
        if (mode === "manga") {
            prompts.push(
                [
                    "Create a black-and-white MANGA panel that explains this biology concept accurately.",
                    `Panel ${i}: Use speech bubbles and 2–4 small labels on key parts.`,
                    "Style: clean inked linework, halftone shading, dynamic manga composition.",
                    "Audience: high-school level; avoid gore or real-person likeness.",
                    "Subject to illustrate (science content):",
                    base,
                    "Constraints: be scientifically accurate; keep text minimal and readable.",
                    "Output: a single square panel suitable for web.",
                ].join("\n")
            );
        } else {
            // coloring
            prompts.push(
                [
                    "Create a COLORING-BOOK style educational page (line art only, no shading) that teaches the biology concept.",
                    `Page ${i}: Thick outlines, large whitespace for coloring, 3–5 small labels (blank lines/boxes).`,
                    "Audience: middle-school level; avoid long paragraphs.",
                    "Subject to illustrate (science content):",
                    base,
                    "Constraints: scientifically accurate; no shading/halftones; simple shapes.",
                    "Output: a single square page suitable for web.",
                ].join("\n")
            );
        }
    }
    return prompts;
}



export async function POST(req: NextRequest) {
    try {
        // Check if API key is configured
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL;

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY environment variable is not set")
            return NextResponse.json({
                error: "API key not configured",
                message: "The GEMINI_API_KEY environment variable is not set on this deployment. Please contact the administrator to configure the API key."
            }, { status: 500 })
        }

        const { question, mode = "manga", imageCount = 1 } = await req.json()

        if (!question) {
            return NextResponse.json({ error: "Question input is required" }, { status: 400 })
        }

        // Validate image
        if (!["manga", "coloring"].includes(mode)) {
            return NextResponse.json(
                { error: "mod must be 'manga' or 'coloring'" },
                { status: 400 }
            );
        }


        if (imageCount < 1 || imageCount > 20) {
            return NextResponse.json(
                { error: "Image count must be between 1 and 10" },
                { status: 400 }
            );
        }


        const ragResponse = await fetch(`${RAG_BACKEND_URL}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ question }),
        });

        if (!ragResponse.ok) {
            const text = await ragResponse.text();
            console.error("RAG /ask failed:", text);
            return NextResponse.json(
                { error: "RAG /ask failed:", text },
                { status: 502 },
            );
        }

        const ragData = await ragResponse.json();
        const answer: string = ragData?.answer || "";
        const sources: any[] = ragData?.sources || [];

        if (!answer) {
            return NextResponse.json({ error: "Empty RAG answer" }, { status: 502 });
        }

        const prompts = promptsFromRag(answer, mode as Mode, imageCount);


        // Function to make a single API call with specific prompt
        const callGemini = async (promptText: string) => {

            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": GEMINI_API_KEY,
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                    }),
                }
            );

            const data = await response.json()

            if (!response.ok) {
                throw new Error(`API call failed: ${JSON.stringify(data)}`)
            }

            const parts = data?.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
                const b64 = part?.inline_data?.data || part?.inlineData?.data;
                if (typeof b64 === "string" && b64.length > 0) return b64;
            }
            throw new Error("No image data in Gemini response");
        };

        let images: string[] = [];
        try {
            images = await Promise.all(prompts.map(callGemini));
        } catch (err) {
            console.error("Gemini API Error:", err);
            return NextResponse.json(
                { error: "Failed to generate content", details: (err as Error).message },
                { status: 500 }
            );
        }


        // Return images, answer, citation back to client
        return NextResponse.json({
            success: true,
            mode,
            imageCount,
            answer,
            sources,
            images
        });
    } catch (error: any) {
        console.error("visualize route error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" }, 
            { status: 500 }
        );
    }
} 