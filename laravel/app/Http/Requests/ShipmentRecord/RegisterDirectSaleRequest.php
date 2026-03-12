<?php

namespace App\Http\Requests\ShipmentRecord;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class RegisterDirectSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'record_date' => ['required', 'date_format:Y-m-d', 'unique:shipment_records,record_date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'shipment_entries' => ['required', 'array', 'min:1'],
            'shipment_entries.*.variety_id' => ['required', 'integer', 'exists:varieties,id'],
            'shipment_entries.*.grades' => ['required', 'array', 'min:1'],
            'shipment_entries.*.grades.*.grade_id' => ['required', 'integer', 'exists:grades,id'],
            'shipment_entries.*.grades.*.quantity' => ['required', 'integer', 'min:0'],
            'direct_sale_items' => ['nullable', 'array'],
            'direct_sale_items.*.variety_id' => ['required_with:direct_sale_items', 'integer', 'exists:varieties,id'],
            'direct_sale_items.*.product_id' => ['required_with:direct_sale_items', 'integer', 'exists:products,id'],
            'direct_sale_items.*.fruit_quantity' => ['required_with:direct_sale_items', 'integer', 'min:0'],
            'direct_sale_items.*.box_quantity' => ['required_with:direct_sale_items', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'record_date.required' => '記録日は必須です。',
            'record_date.date_format' => '記録日の形式が正しくありません。',
            'record_date.unique' => 'この日付の出荷記録はすでに登録されています。',
            'shipment_entries.required' => '出荷データを入力してください。',
            'shipment_entries.min' => '少なくとも1つの品種を追加してください。',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'バリデーションエラーが発生しました。',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
