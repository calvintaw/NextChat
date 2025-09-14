import Loading from "@/app/(root)/chat/[room_id]/loading";
import { fetchNews } from "@/app/lib/actions";
import useEventListener from "@/app/lib/hooks/useEventListener";
import { useInfiniteQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { BiSolidCategory } from "react-icons/bi";
import { IoSearch } from "react-icons/io5";
import { MdOutlineArticle } from "react-icons/md";
import Masonry from "react-masonry-css";
import { Tooltip } from "react-tooltip";
import InputField from "../form/InputField";
import { IconWithSVG } from "../general/Buttons";
import NewsBlock from "./NewsCard";
import { Route } from "next";

const breakpointColumnsObj = { default: 2, 700: 1 };

export type CategoriesType =
	| "business"
	| "entertainment"
	| "general"
	| "health"
	| "science"
	| "sports"
	| "technology"
	| "lifestyle";

export const categories: CategoriesType[] = [
	"business",
	"entertainment",
	"general",
	"health",
	"science",
	"sports",
	"technology",
	"lifestyle",
];

const NewsGrid = () => {
	const searchParams = useSearchParams();
	const router = useRouter();

	const queryParam = searchParams?.get("q") || "home";
	const [filter, setFilter] = useState(queryParam);
	const [showCategories, setShowCategories] = useState(true);
	const [userToggled, setUserToggled] = useState(false);

	const formRef = useRef<HTMLFormElement>(null);
	const loadMoreRef = useRef<HTMLSpanElement>(null);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
		queryKey: ["news", filter],
		queryFn: ({ pageParam = 1 }) => fetchNews({ q: filter, page: pageParam, pageSize: 20 }),
		initialPageParam: 1,
		getNextPageParam: (lastPage, pages) => (lastPage.length < 20 ? undefined : pages.length + 1),
	});

	useEffect(() => {
		const handleScroll = () => {
			if (
				window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
				hasNextPage &&
				!isFetchingNextPage
			) {
				fetchNextPage();
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	const handleClick = (cat: CategoriesType) => {
		setFilter(cat);
		const params = new URLSearchParams(searchParams.toString());
		params.set("q", cat);
		router.push(`${window.location.pathname}?${params.toString()}` as Route);
	};

	console.log("news data: ", data);

	useEffect(() => {
		if (!loadMoreRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ rootMargin: "200px" }
		);

		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	const handleResize = () => {
		const isLargeScreen = window.innerWidth > 767;
		if (isLargeScreen) {
			setShowCategories(true);
			setUserToggled(false);
		} else if (!userToggled) {
			setShowCategories(false);
		}
	};

	const toggleCategories = () => {
		setShowCategories((prev) => !prev);
		setUserToggled(true);
	};

	useEffect(() => {
		handleResize();
	}, []);

	if (typeof window !== "undefined") {
		useEventListener("resize", handleResize);
	}

	return (
		<section
			className={clsx(
				"overflow-y-scroll overflow-x-clip gap-4 p-4 w-full max-h-[calc(100vh-4rem)] mb-4 fade-bg-bottom dark:bg-[#0A101C]/65 bg-[#f7f7f9]/65",
				!isLoading && "pb-[150px]"
			)}
		>
			<Tooltip className="my-tooltip" id="category-id" border={`var(--tooltip-border)`} />

			{/* Dashboard Header */}
			<div className="mb-5 flex flex-col gap-3">
				<div className="flex flex-col md:flex-row justify-between flex-1 gap-4 ">
					<h1 className="text-3xl font-bold text-text">Search Latest News</h1>

					{/* Search + Filter */}
					<div className="flex gap-2">
						<form ref={formRef} className="md:ml-auto w-full" method="GET">
							<InputField
								icon={
									<IconWithSVG type="submit" className="icon-small">
										<IoSearch />
									</IconWithSVG>
								}
								name="q"
								type="text"
								place="right"
								placeholder="Search news..."
								defaultValue={filter === "home" ? "" : filter}
								className="w-full flex-1"
								parentClassName="w-full min-h-0 h-10 px-1.5 "
							/>
						</form>
						<IconWithSVG
							type="button"
							data-tooltip-id="category-id"
							data-tooltip-content={showCategories ? "Hide Categories" : "Show Categories"}
							className="icon-square !px-0 w-10 h-10"
							onClick={toggleCategories}
						>
							<BiSolidCategory className="text-2xl" />
						</IconWithSVG>
					</div>
				</div>

				<input type="hidden" name="category" value={filter} />

				{showCategories && (
					<div className="flex w-full flex-wrap gap-2 mt-2 justify-center">
						<button
							onClick={() => {
								router.push("/news");
								setFilter("home");
							}}
							className={`btn px-3 py-1.5 text-base flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-30 ${
								filter === "home" ? "bg-foreground text-background" : ""
							}`}
						>
							Home
						</button>
						{categories.map((cat) => (
							<button
								key={cat}
								onClick={() => handleClick(cat)}
								className={`btn px-3 py-1.5 text-base flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-30 ${
									filter === cat ? "bg-foreground text-background" : ""
								}`}
							>
								{cat.charAt(0).toUpperCase() + cat.slice(1)}
							</button>
						))}
					</div>
				)}
			</div>

			<hr className="hr-separator mb-6 rounded-full" />

			{error && <p className="text-error mb-4">{(error as any)?.message}</p>}

			{isLoading && <Loading className="!max-h-75 !max-w-238" />}

			{!isLoading && !error && data && (
				<>
					{data?.pages[0].length === 0 ? (
						<div className="flex flex-col items-center justify-center mt-25">
							<MdOutlineArticle className="text-6xl text-muted mb-4" />
							<p className="text-muted text-lg font-medium">No news available.</p>
						</div>
					) : (
						<>
							<Masonry breakpointCols={breakpointColumnsObj} className="flex gap-3">
								{data.pages
									.flatMap((page) => page)
									.map((article, idx) => (
										<NewsBlock
											key={idx}
											title={article.title}
											source={article.source.name}
											timestamp={new Date(article.publishedAt).toLocaleString()}
											url={article.url}
											content={article.content}
											imageUrl={article.urlToImage ?? ""}
										/>
									))}
							</Masonry>
							{isFetchingNextPage && (
								<div className="w-full flex items-center justify-center gap-2 mt-20">
									<span className="text-2xl font-medium tracking-wide text-muted animate-pulse mr-2 relative -mt-1">
										Loading
									</span>
									<span className="bouncing-dot size-3 rounded-full bg-text" />
									<span className="bouncing-dot size-3 rounded-full bg-text" />
									<span className="bouncing-dot size-3 rounded-full bg-text" />
								</div>
							)}

							<span ref={loadMoreRef} className="block h-1" />
							{!hasNextPage && <p className="text-center text-muted mt-20 text-lg">End of page</p>}
						</>
					)}
				</>
			)}
		</section>
	);
};

export default NewsGrid;
