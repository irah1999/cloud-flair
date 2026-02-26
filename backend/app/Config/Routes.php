<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', function ($routes) {
    $routes->post('join', 'InterviewController::join');
    $routes->post('submit', 'InterviewController::submit');
    $routes->get('details/(:any)', 'InterviewController::getDetails/$1');
});
