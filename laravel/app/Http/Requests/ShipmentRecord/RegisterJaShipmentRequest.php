<?php

namespace App\Http\Requests\ShipmentRecord;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class RegisterJaShipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'variety_id' => ['required', 'integer', 'exists:varieties,id'],
            'entries' => ['required', 'array', 'min:1'],
            'entries.*.record_date' => ['required', 'date_format:Y-m-d'],
            'entries.*.grades' => ['required', 'array', 'min:1'],
            'entries.*.grades.*.grade_id' => ['required', 'integer', 'exists:grades,id'],
            'entries.*.grades.*.quantity' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'variety_id.required' => '品種を選択してください。',
            'variety_id.exists' => '選択された品種は存在しません。',
            'entries.required' => '出荷データを入力してください。',
            'entries.min' => '少なくとも1日分のデータを入力してください。',
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
