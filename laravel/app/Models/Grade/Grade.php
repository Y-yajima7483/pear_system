<?php

namespace App\Models\Grade;

use App\Enums\GradeScopeEnum;
use App\Enums\GradeTypeEnum;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $table = 'grades';

    protected $fillable = [
        'name',
        'type',
        'shipment_scope',
        'sort_order',
    ];

    protected $casts = [
        'type' => GradeTypeEnum::class,
        'shipment_scope' => GradeScopeEnum::class,
    ];
}
