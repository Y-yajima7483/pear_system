<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // 基本情報
            'customer_name' => ['required', 'string', 'max:191'],
            'notes' => ['nullable', 'string', 'max:300'],
            'pickup_date' => ['nullable', 'date_format:Y-m-d'],
            'pickup_time' => ['nullable', 'regex:/^(\d{2}):(\d{2})$/'],
            'status' => ['required', 'integer', 'in:1,2,3'],
            // 注文商品
            'items' => ['required', 'array', 'min:1'],
            'items.*.variety_id' => ['required', 'integer', 'exists:varieties,id'],
            'items.*.items' => ['required', 'array', 'min:1'],
            'items.*.items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'お客様名は必須です。',
            'customer_name.max' => 'お客様名は191文字以内で入力してください。',
            'notes.max' => '備考は300文字以内で入力してください。',
            'pickup_date.date_format' => '受取日の形式が正しくありません。',
            'pickup_time.regex' => '受取時間の形式が正しくありません。',
            'items.required' => '商品を選択してください。',
            'items.array' => '商品の形式が正しくありません。',
            'items.min' => '少なくとも1つの品種を追加してください。',
            'items.*.variety_id.required' => '品種を選択してください。',
            'items.*.variety_id.exists' => '選択された品種は存在しません。',
            'items.*.items.required' => '商品と数量を入力してください。',
            'items.*.items.array' => '商品の形式が正しくありません。',
            'items.*.items.min' => '少なくとも1つの商品を追加してください。',
            'items.*.items.*.product_id.required' => '商品を選択してください。',
            'items.*.items.*.product_id.exists' => '選択された商品は存在しません。',
            'items.*.items.*.quantity.required' => '数量を入力してください。',
            'items.*.items.*.quantity.integer' => '数量は整数で入力してください。',
            'items.*.items.*.quantity.min' => '数量は1以上の数値を入力してください。',
            'status.required' => 'ステータスは必須です。',
            'status.in' => 'ステータスの値が不正です。',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
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
