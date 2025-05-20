import { authOptions } from "@/lib/auth";
import { getMongoDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";

// GET all categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await getMongoDb();
    const categories = await db
      .collection("categories")
      .find({ userId: session.user.id })
      .toArray();

    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch categories" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// POST new category
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await request.json();
    const { name, type, color } = data;

    if (!name || !type) {
      return new Response(
        JSON.stringify({ error: "Name and type are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const db = await getMongoDb();
    
    // Check if category already exists for this user
    const existingCategory = await db.collection("categories").findOne({
      name,
      type,
      userId: session.user.id,
    });

    if (existingCategory) {
      return new Response(
        JSON.stringify({ error: "Category already exists" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await db.collection("categories").insertOne({
      name,
      type,
      color: color || "#000000",
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create category" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 