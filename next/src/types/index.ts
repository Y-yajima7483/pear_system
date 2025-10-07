// Selectオプションの共通型
export type OptionType = {
	label: string;
	value: string;
};

// Selectオプション型（valueがnumber）
export type ApiOptionType = {
	label: string;
	value: number;
};
// 商品用Selectオプション型
export type ProductApiOptionType = {
	variety: number;
} & ApiOptionType;
// ログインユーザー情報
export type UserDataType = {
	id: number;
	name: string;
	email: string;
}

export type ApiHookResponseType<T> = {
	data: T;
	success: true;
} | {
	data: undefined;
	success: false;
}