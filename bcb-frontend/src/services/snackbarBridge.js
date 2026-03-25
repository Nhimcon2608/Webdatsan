/**
 * Bridge module that allows code outside the React tree (e.g. api.jsx)
 * to trigger Snackbar notifications.
 *
 * SnackbarContext registers its showSnackbar function here on mount,
 * and api.jsx calls it through this module.
 */

let _showSnackbar = null;

export function registerSnackbar(fn) {
    _showSnackbar = fn;
}

export function showSnackbar(message, severity = 'info') {
    if (_showSnackbar) {
        _showSnackbar(message, severity);
    }
}
