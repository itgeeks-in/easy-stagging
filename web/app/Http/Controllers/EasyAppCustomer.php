<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class EasyAppCustomer extends Controller
{
    public function showData(Request $request)
    {
        // Fetch data from your Laravel application.

        // Example: $data = YourModel::all();
        $croninfo = DB::table('easylog')->insert([
            'data' => json_encode($request)
        ]);

        // Return the data to the Shopify template.
        return view('shopify.template', ['data' => '']);
    }
}
