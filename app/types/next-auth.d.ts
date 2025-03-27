// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
	interface Session {
		user: {
			userId: string; // Custom property
			email: string; // Keep existing properties
			name?: string;
			image?: string;
		};
	}

	interface JWT {
		userId: string; // Custom property
		email: string; // Keep existing properties
	}
}
