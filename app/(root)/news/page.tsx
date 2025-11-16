"use client"
import NewsGrid from "@/app/ui/news/NewsContainer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const NewsGridWrapper = () => {
	const [queryClient] = useState(() => new QueryClient())

	return (
		<QueryClientProvider client={queryClient}>
			<NewsGrid />
		</QueryClientProvider>
	);
};

export default NewsGridWrapper;
