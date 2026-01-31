<?php

namespace App\Http\Requests\PrepBoard;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderItemPreparedRequest extends FormRequest
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
            'is_prepared' => ['required', 'boolean'],
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
            'is_prepared.required' => '準備状態は必須です。',
            'is_prepared.boolean' => '準備状態は真偽値で指定してください。',
        ];
    }
}
