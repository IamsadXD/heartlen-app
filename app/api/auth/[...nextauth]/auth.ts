import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		}),
	],
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async jwt({ token, profile }: { token: any; profile?: any }) {
			// Extract the user's email and create a unique userID
			if (profile) {
				const userEmail = profile.email;
				const userId = userEmail?.split("@")[0]; // Use the part before '@' as the userID

				// Add the userID and email to the token
				token.userId = userId;
				token.email = userEmail;
			}

			return token;
		},
		async session({ session, token }: { session: any; token: any }) {
			// Pass the userID and email to the session
			session.user = {
				...session.user, // Preserve existing properties (e.g., name, image)
				userId: token.userId, // Add custom property
				email: token.email, // Ensure email is included
			};

			return session;
		},
	},
};
