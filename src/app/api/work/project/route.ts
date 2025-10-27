import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accessToken = authHeader.split(" ")[1];
    const res = await fetch("https://chat.swiftandgo.in/api/projects/AllProject", {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ message: "Failed to fetch projects" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const accessToken = authHeader.split(" ")[1];
      const formData = await request.formData();
  
      const res = await fetch("https://chat.swiftandgo.in/api/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
   
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        return NextResponse.json({ error: data || "Failed to create project" }, { status: res.status });
      }
  
      return NextResponse.json(data);
  
    } catch (error) {
      console.error("Error creating project:", error);
      return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
  }