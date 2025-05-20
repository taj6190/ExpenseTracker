import { authOptions } from "@/lib/auth";
import { getMongoDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";

// GET all income entries
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
    const income = await db
      .collection("income")
      .find({ userId: session.user.id })
      .toArray();

    return new Response(JSON.stringify(income), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching income:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch income" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// POST new income entry
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
    const { amount, description, date, category, name } = data;

    if (!amount || !name || !date) {
      return new Response(
        JSON.stringify({ error: "Amount, name, and date are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const db = await getMongoDb();
    const result = await db.collection("income").insertOne({
      name,
      amount: parseFloat(amount),
      description,
      date: new Date(date),
      category: category || "Other",
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating income:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create income" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 