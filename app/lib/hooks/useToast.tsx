import { toastAtom } from "@/app/store";
import { useAtom } from "jotai";

export const useToast = () => {
	const [_, setToast] = useAtom(toastAtom);

	return ({ timer = 8000, ...toast }: Toast) => {
		const id = Date.now() + Math.random();

		setToast((state) => {
			state.list = [...state.list, { id, timer, ...toast }];
		});
	};
};


