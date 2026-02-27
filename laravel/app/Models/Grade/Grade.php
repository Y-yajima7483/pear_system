<?php

namespace App\Models\Grade;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $table = 'grades';

    protected $fillable = [
        'name',
        'type',
        'sort_order',
    ];
}
