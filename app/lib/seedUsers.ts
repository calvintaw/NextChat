// utils/seedRegister.ts

import { registerUser } from "./actions";

interface SeedUser {
	email: string;
	password: string;
	username: string;
	displayName: string;
	image?: string | null;
}

export async function seedRegisterUsers(users: SeedUser[]) {
	for (const user of users) {
		try {
			// pick random placeholder avatar if none provided
			const image =
				user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`;

			// prepare FormData exactly like a signup form
			const formData = new FormData();
			formData.set("email", user.email);
			formData.set("password", user.password);
			formData.set("username", user.username);
			formData.set("displayName", user.displayName);
			formData.set("image", image);

			const result = await registerUser(formData);

			if (result.errors && Object.keys(result.errors).length > 0) {
				console.error(`Failed to register user ${user.username}:`, result.errors, result.message);
			} else {
				console.log(`User ${user.username} registered successfully`);
			}
		} catch (err) {
			console.error(`Error while registering ${user.username}:`, err);
		}
	}
}
