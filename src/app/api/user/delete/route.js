import { authOptions } from "@/lib/auth";
import { getMongoDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getMongoDb();
    
    // Delete user's data
    await Promise.all([
      // Delete user
      db.collection("users").deleteOne({ email: session.user.email }),
      // Delete user's expenses
      db.collection("expenses").deleteMany({ userId: session.user.id }),
      // Delete user's income
      db.collection("income").deleteMany({ userId: session.user.id }),
      // Delete user's categories
      db.collection("categories").deleteMany({ userId: session.user.id }),
    ]);

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
} 