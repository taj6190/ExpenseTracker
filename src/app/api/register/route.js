import { getMongoDb } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    console.log("Starting registration process...");
    const { name, email, password } = await request.json();
    console.log("Received registration data:", { name, email });

    // Validate input
    if (!name || !email || !password) {
      console.log("Missing required fields:", { name: !!name, email: !!email, password: !!password });
      return new Response(
        JSON.stringify({ error: "Name, email, and password are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Connecting to database...");
    const db = await getMongoDb();
    console.log("Database connection successful");

    // Check if user already exists
    console.log("Checking for existing user...");
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      console.log("User already exists with email:", email);
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log("Creating new user...");
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("User created successfully with ID:", result.insertedId);

    // Create default categories for the user
    console.log("Creating default categories...");
    const defaultCategories = [
      { name: "Food", type: "expense", color: "#FF5733", userId: result.insertedId.toString() },
      { name: "Transport", type: "expense", color: "#33FF57", userId: result.insertedId.toString() },
      { name: "Entertainment", type: "expense", color: "#3357FF", userId: result.insertedId.toString() },
      { name: "Salary", type: "income", color: "#57FF33", userId: result.insertedId.toString() },
      { name: "Freelance", type: "income", color: "#FF33F6", userId: result.insertedId.toString() },
    ];

    await db.collection("categories").insertMany(
      defaultCategories.map(category => ({
        ...category,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    console.log("Default categories created successfully");

    return new Response(
      JSON.stringify({
        message: "User registered successfully",
        userId: result.insertedId,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Registration error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ 
        error: "Failed to register user",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 