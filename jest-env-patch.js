// Custom JSDOM environment that patches the virtualConsole.sendTo incompatibility
// between jsdom v24+ and jest-environment-jsdom v29
const { JSDOM, VirtualConsole } = require('jsdom');

// Polyfill sendTo if missing (jsdom v24+ removed it)
if (!VirtualConsole.prototype.sendTo) {
    VirtualConsole.prototype.sendTo = function(console, options) {
        const { omitJSDOMErrors = false } = options || {};
        this.on('jsdomError', (e) => {
            if (!omitJSDOMErrors) console.error(e);
        });
        ['log', 'info', 'warn', 'error', 'dir', 'debug', 'trace'].forEach(method => {
            this.on(method, (...args) => { if (console[method]) console[method](...args); });
        });
        return this;
    };
}

// Now load the original environment
const JSDOMEnvironment = require('jest-environment-jsdom').default || require('jest-environment-jsdom');

module.exports = JSDOMEnvironment;
