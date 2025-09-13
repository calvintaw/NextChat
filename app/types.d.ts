interface Toast {
	id?: number;
	open?: boolean;
	title: string;
	subtitle: string;
	timer?: number;
	infinite?: boolean;
	mode?: "info" | "positive" | "negative";
}

