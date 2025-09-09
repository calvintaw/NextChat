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


// temporary mock for testing

// "use client"
// import { fetchNews, mockFetchNews } from "@/app/lib/actions";
// import { NewsArticle } from "@/app/lib/definitions";
// import { newsData } from "@/app/lib/news";
// import NewsGrid from "@/app/ui/NewsGrid";

// export default function NewsPage() {

// 	return <NewsGrid query={"home"} articles={newsData.articles} error={""}></NewsGrid>;
// }
