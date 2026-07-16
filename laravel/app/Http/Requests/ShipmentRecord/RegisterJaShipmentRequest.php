<?php

namespace App\Http\Requests\ShipmentRecord;

use App\Enums\GradeScopeEnum;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

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
            'entries.*.record_date' => ['required', 'date_format:Y-m-d', 'distinct:strict'],
            'entries.*.grades' => ['required', 'array', 'min:1'],
            'entries.*.grades.*.grade_id' => [
                'bail',
                'required',
                'integer',
                Rule::exists('grades', 'id')->whereIn('shipment_scope', [
                    GradeScopeEnum::Both->value,
                    GradeScopeEnum::JaOnly->value,
                ]),
            ],
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
            'entries.*.record_date.distinct' => '同じ記録日を重複して送信することはできません。',
            'entries.*.grades.*.grade_id.exists' => '選択された等級はJA出荷では使用できません。',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $entries = $this->input('entries', []);
            if (! is_array($entries)) {
                return;
            }

            foreach ($entries as $entryIndex => $entry) {
                if (! is_array($entry) || ! is_array($entry['grades'] ?? null)) {
                    continue;
                }

                $seenGradeIds = [];
                foreach ($entry['grades'] as $gradeIndex => $grade) {
                    if (! is_array($grade) || ! array_key_exists('grade_id', $grade)) {
                        continue;
                    }

                    $gradeId = (string) $grade['grade_id'];
                    if (isset($seenGradeIds[$gradeId])) {
                        $validator->errors()->add(
                            "entries.{$entryIndex}.grades.{$gradeIndex}.grade_id",
                            '同じ記録日の等級を重複して送信することはできません。'
                        );
                    }

                    $seenGradeIds[$gradeId] = true;
                }
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
