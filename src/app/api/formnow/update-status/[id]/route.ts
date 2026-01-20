import { NextRequest, NextResponse } from "next/server";

const FORMNOW_BASE_URL = "https://api.formlabs.com/form-now";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiKey = request.headers.get("x-publishable-api-key");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const response = await fetch(`${FORMNOW_BASE_URL}/api/v1/part-files/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `Failed to update status: ${errorData}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Form Now status update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
