<?php

namespace App\Http\Requests\ShipmentRecord;

use App\Enums\GradeScopeEnum;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpsertDirectSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'record_date' => ['required', 'date_format:Y-m-d'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'direct_sale_items' => ['present', 'array'],
            'direct_sale_items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'direct_sale_items.*.fruit_quantity' => ['required', 'integer', 'min:0'],
            'direct_sale_items.*.box_quantity' => ['required', 'integer', 'min:0'],
            'manual_grade_entries' => ['present', 'array'],
            'manual_grade_entries.*.variety_id' => ['required', 'integer', 'exists:varieties,id'],
            'manual_grade_entries.*.grade_id' => [
                'required',
                'integer',
                Rule::exists('grades', 'id')->whereIn('shipment_scope', [
                    GradeScopeEnum::Both->value,
                    GradeScopeEnum::DirectOnly->value,
                ]),
            ],
            'manual_grade_entries.*.quantity' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'record_date.required' => '記録日は必須です。',
            'record_date.date_format' => '記録日の形式が正しくありません。',
            'direct_sale_items.present' => '商品明細を送信してください。',
            'direct_sale_items.*.product_id.required' => '商品を選択してください。',
            'direct_sale_items.*.product_id.exists' => '選択された商品は存在しません。',
            'direct_sale_items.*.fruit_quantity.min' => '玉数は0以上で入力してください。',
            'direct_sale_items.*.box_quantity.min' => '箱/袋数は0以上で入力してください。',
            'manual_grade_entries.present' => '商品外数量を送信してください。',
            'manual_grade_entries.*.variety_id.required' => '商品外数量の品種を選択してください。',
            'manual_grade_entries.*.variety_id.exists' => '商品外数量の品種は存在しません。',
            'manual_grade_entries.*.grade_id.required' => '商品外数量の等級を選択してください。',
            'manual_grade_entries.*.grade_id.exists' => '選択された等級は直売では使用できません。',
            'manual_grade_entries.*.quantity.min' => '商品外数量は0以上で入力してください。',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $productQuantity = collect($this->input('direct_sale_items', []))
                ->sum(fn (array $item): int => (int) ($item['box_quantity'] ?? 0));
            $manualQuantity = collect($this->input('manual_grade_entries', []))
                ->sum(fn (array $entry): int => (int) ($entry['quantity'] ?? 0));

            if ($productQuantity + $manualQuantity <= 0) {
                $validator->errors()->add(
                    'direct_sale_items',
                    '商品明細または商品外数量を1件以上入力してください。'
                );
            }
        });
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
