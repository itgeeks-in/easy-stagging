<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class EasyAppCustomer extends Controller
{
    public function showData(Request $request)
    {
        $allDataContent = $request->all();

        // Validate the incoming data or use request validation rules

        if (empty($allDataContent['logged_in_customer_id'])) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (isset($allDataContent['shop']) && isset($allDataContent['signature'])) {
            if ($this->validateSignature($allDataContent)) {
                $customerId = $allDataContent['logged_in_customer_id'];
                return view('shopify.template')->with('data', $allDataContent);
            } else {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
        }

        return response()->json(['error' => 'Unauthorized'], 401);
    }

    private function validateSignature(array $data): bool
    {
        $sharedSecret = env('SHOPIFY_API_SECRET');
        $signature = $data['signature'];

        unset($data['signature']);
        ksort($data);

        $dataString = implode('', array_map(
            function ($value, $key) {
                return $key . '=' . $value;
            },
            $data,
            array_keys($data)
        ));

        $calculatedSignature = hash_hmac('sha256', $dataString, $sharedSecret);

        return hash_equals($signature, $calculatedSignature);
    }
}
