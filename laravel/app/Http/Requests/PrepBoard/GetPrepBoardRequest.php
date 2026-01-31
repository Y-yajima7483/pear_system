<?php

namespace App\Http\Requests\PrepBoard;

use Illuminate\Foundation\Http\FormRequest;

class GetPrepBoardRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'target_date' => ['required', 'date', 'date_format:Y-m-d'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'target_date.required' => '対象日付は必須です。',
            'target_date.date' => '対象日付は正しい日付形式で入力してください。',
            'target_date.date_format' => '対象日付はY-m-d形式で入力してください。',
        ];
    }
}
