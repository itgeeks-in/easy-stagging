<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array
     */
    protected $except = [
        '/api/graphql',
        '/api/webhooks',
        '/api/createsubgroup',
        '/api/getsubgroup',
        '/api/getsubscriptions',
        '/api/subscriptioncontracts',
        '/api/subscriptioncontracts/update',
        '/api/subscriptioncontracts/billingattempt',
        '/api/subscriptioncontracts/billingattempt/failure',
        '/api/easy-subscription/settings/subscription_mail_activation/update',
        '/api/easy-subscription/testmail',
        '/api/easy-subscription/previewmail',
        '/api/customerdata',
        '/api/easycustomerdatarequest',
        '/api/easycustomerdataerasure',
        '/api/easyshopdataerasure',
        '/ad/prod/sub/rem',
        '/ad/prod/sub/remtrig',
        '/ad/prod/sub/ed',
        '/ad/prod/sub/ls',
        '/ad/prod/sub/ep'
    ];
}
