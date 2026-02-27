<?php

namespace App\Http\Requests\ShipmentRecord;

use Illuminate\Foundation\Http\FormRequest;

class GetShipmentRecordListRequest extends FormRequest
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
            'year' => ['required', 'integer', 'between:2000,2100'],
            'month' => ['nullable', 'integer', 'between:1,12'],
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
            'year.required' => '年は必須です。',
            'year.integer' => '年は整数で入力してください。',
            'year.between' => '年は2000〜2100の範囲で入力してください。',
            'month.integer' => '月は整数で入力してください。',
            'month.between' => '月は1〜12の範囲で入力してください。',
        ];
    }
}
