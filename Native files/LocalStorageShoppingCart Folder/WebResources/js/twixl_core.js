/**
 *  (c) 2010-2013 Twixl media, http://twixlmedia.com.
 *  Created by Pieter Claerhout, pieter@twixlmedia.com
 */

var TwixlURL = {

    decodeParameter: function(value) {
        return decodeURIComponent(value.replace(/\+/g, " "));
    },

    encodeParameter: function(value) {
        if (value === true || value === 1) {
            return "1";
        }
        if (value === false || value === 0) {
            return "0";
        }
        return encodeURIComponent(value).replace(/ /g, "+");
    },

    getAllParameters: function() {
        var assoc       = {};
        var queryString = location.search.substring(1);
        var keyValues   = queryString.split('&');
        for (var i in keyValues) {
            var key = keyValues[i].toString().split('=');
            if (key.length > 1) {
                assoc[this.decodeParameter(key[0])] = this.decodeParameter(key[1]);
            } else if (key.length == 1 && key[0] && key[0].length > 0) {
                assoc[this.decodeParameter(key[0])] = true;
            }
        }
        return assoc;
    },

    getParameter: function(name, defaultValue) {
        var allParameters = this.getAllParameters();
        if (allParameters.hasOwnProperty(name) && allParameters[name] != "") {
            return allParameters[name];
        } else {
            return defaultValue;
        }
    },

    getIntParameter: function(name, defaultValue) {
        var value = this.getParameter(name, defaultValue);
        try {
            return parseInt(value);
        } catch (exception) {
            return defaultValue;
        }
    },


    getBoolParameter: function(name, defaultValue) {
        var value = this.getParameter(name, defaultValue);
        return (value == 1 || value == true || value == "y" || value == "yes" || value == "true");
    },

};

var TwixlRouter = {

    run: function(routes) {
        var action = TwixlURL.getParameter('do', '');
        if (routes[action]) {
            routes[action]();
        }
    },

};

var TwixlLogger = {

    logId: 'twixl-debug-log',

    init: function() {
        if (TwixlURL.getBoolParameter('debug')) {
            var log = $('<div/>', {'id': this.logId});
            log.css('padding', '8px');
            log.css('background-color', '#efefef');
            log.css('font-size', '12px');
            log.css('font-family', 'Menlo, monospace');
            log.css('line-height', '18px');
            log.html('<strong>TWIXL LOG CONSOLE</strong><br/>');
            $('body').append(log);
        }
    },

    dump: function(message, prefix) {
        message = JSON.stringify(message);
        if (prefix) {
            message = prefix + ' ' + message;
        }
        this.log('DUMP', message, 'gray');
    },

    info: function(message) {
        this.log('INFO', message, 'green');
    },

    error: function(message) {
        this.log('ERROR', message, 'red');
    },

    log: function(level, message, color) {
        if (message == undefined) {
            message = '[undefined]';
        }
        var log = $('#' + this.logId).html();
        if (color) { log += '<span style="color: ' + color + '">'; }
        log += level + ' ' + message.toString().replace(/ /g, '&nbsp;');
        if (color) { log += '</span>'; }
        log += '<br/>';
        $('#' + this.logId).html(log);
    },

}
