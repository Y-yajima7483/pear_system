<?php

namespace App\Http\Requests\ShipmentRecord;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class GetShipmentSummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'variety_id' => ['nullable', 'integer', 'exists:varieties,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'year.required' => '対象年は必須です。',
            'year.integer' => '対象年は数値で指定してください。',
            'month.integer' => '対象月は数値で指定してください。',
            'variety_id.exists' => '選択された品種は存在しません。',
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
