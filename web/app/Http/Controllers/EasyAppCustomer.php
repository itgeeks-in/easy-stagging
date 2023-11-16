<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class EasyAppCustomer extends Controller
{
    public function showData(Request $request)
    {
        // Fetch data from your Laravel application.

        // Example: $data = YourModel::all();

        // Return the data to the Shopify template.
        return view('shopify.template', ['data' => '']);
    }
}
