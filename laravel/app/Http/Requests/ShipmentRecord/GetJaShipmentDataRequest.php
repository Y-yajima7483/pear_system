<?php

namespace App\Http\Requests\ShipmentRecord;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class GetJaShipmentDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'variety_id' => ['required', 'integer', 'exists:varieties,id'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'variety_id.required' => '品種を選択してください。',
            'variety_id.exists' => '選択された品種は存在しません。',
            'start_date.required' => '開始日は必須です。',
            'end_date.required' => '終了日は必須です。',
            'end_date.after_or_equal' => '終了日は開始日以降の日付を指定してください。',
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
