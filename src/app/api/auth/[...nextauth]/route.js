import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

const handler = NextAuth({
  ...authOptions,
  debug: true, // Enable debug logs
  logger: {
    error(code, metadata) {
      console.error("NextAuth error:", { code, metadata });
    },
    warn(code) {
      console.warn("NextAuth warning:", code);
    },
    debug(code, metadata) {
      console.log("NextAuth debug:", { code, metadata });
    },
  },
});

export { handler as GET, handler as POST };

