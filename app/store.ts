import { atomWithImmer } from "jotai-immer";

export const toastAtom = atomWithImmer<{ list: Array<Toast> }>({ list: [] });
