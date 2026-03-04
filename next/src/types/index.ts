// Selectオプションの共通型
export type OptionType<T = string> = {
	label: string;
	value: T;
};

// Selectオプション型（valueがnumber）
export type ApiOptionType = OptionType<number>;
// 商品用Selectオプション型
export type ProductApiOptionType = {
	variety: number;
	is_main: boolean;
	is_shipping: boolean;
	sku_suffix: string;
} & ApiOptionType;
// 出荷種別用Selectオプション型（直売フラグ付き）
export type ShipmentTypeApiOptionType = {
	has_direct_sale_items: boolean;
} & ApiOptionType;
// 等級用Selectオプション型（販売/非販売区分付き）
export type GradeApiOptionType = {
	type: 'sales' | 'non_sales';
	shipment_scope: 'both' | 'direct_only' | 'ja_only';
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