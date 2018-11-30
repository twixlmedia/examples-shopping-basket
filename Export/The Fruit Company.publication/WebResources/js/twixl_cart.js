/**
 *  (c) 2010-2013 Twixl media, http://twixlmedia.com.
 *  Created by Pieter Claerhout, pieter@twixlmedia.com
 */

var TwixlCart = {

    id: undefined,

    init: function(id, products) {
        TwixlLogger.init();
        TwixlCartDB.init(id, products);
        TwixlCart.initEventListeners();
        TwixlCart.initElements();
        TwixlCart.initRoutes();
    },

    initRoutes: function() {
        TwixlRouter.run({
            'add': TwixlCart.actionAddProduct,
            'addButton': TwixlCart.actionAddProductButton,
            'show': TwixlCart.actionShowCart,
            'confirm': TwixlCart.actionConfirmOrder,
            '': TwixlCart.actionShowCart,
        });
    },

    initElements: function() {
        $('.twixl-cart a.twixl-remove').live('click touch', TwixlCart.actionRemoveProduct);
        $('.twixl-cart a.twixl-confirm-order').live('click touch', TwixlCart.actionConfirmOrder);
        $('.twixl-cart a.twixl-show-cart').live('click touch', TwixlCart.actionShowCart);
        $('.twixl-cart a.twixl-place-order').live('click touch', TwixlCart.actionPlaceOrder);
        $('#twixl-form-confirm-order').submit(TwixlCart.actionPlaceOrder);
        $('#twixl-cart-product-button a').live('click touch', TwixlCart.actionAddProductFromButton);
    },

    initEventListeners: function() {
        TwixlLogger.info('Attaching event listeners');
        if (window.addEventListener) {
            window.addEventListener('offline', TwixlCart.eventOffline);
            window.addEventListener('online', TwixlCart.eventOnline);
        } else {
            document.body.attachEvent('onoffline', TwixlCart.eventOffline);
            document.body.attachEvent('ononline', TwixlCart.eventOnline);
        }
        if (TwixlURL.getParameter('do') == 'addButton') {
            window.setInterval(TwixlCart.eventStorage, 1000);
        }
    },

    eventOffline: function() {
        TwixlLogger.info('Device went offline');
        $('#twixl-cart .twixl-actions-online').hide();
        $('#twixl-cart .twixl-actions-offline').show();
    },

    eventOnline: function() {
        TwixlLogger.info('Device went online');
        $('#twixl-cart .twixl-actions-online').show();
        $('#twixl-cart .twixl-actions-offline').hide();
    },

    eventStorage: function() {
        TwixlCart.actionAddProductButton();
    },

    actionAddProduct: function() {
        var product = TwixlURL.getParameter('id');
        TwixlCartDB.add(product);
        TwixlCart.actionShowCart();
        return false;
    },

    actionAddProductFromButton: function() {
        var product = TwixlURL.getParameter('id');
        TwixlCartDB.add(product);
        TwixlCart.actionAddProductButton();
        return false;
    },

    actionAddProductButton: function() {
        $('body').css('margin', '4px');
        var product = TwixlURL.getParameter('id');
        var productData = TwixlCartDB.get(product);
        var html = 'Add one';
        if (productData) {
            html = productData['count'] + ' x ' + productData['product'];
        }
        $('#twixl-cart-product-button a').html(html);
        TwixlCart.showScreen('#twixl-cart-product-button');
        return false;
    },

    actionRemoveProduct: function() {
        if (!confirm('Are you sure you want to remove this from your shopping cart?')) {
            return false;
        }
        var product = $(this).parents('tr').attr('product_id');
        TwixlCartDB.remove(product);
        TwixlCart.actionShowCart();
        return false;
    },

    actionShowCart: function() {

        var products = TwixlCartDB.getAll();
        TwixlLogger.dump(products);

        if (navigator.onLine) {
            TwixlCart.eventOnline();
        } else {
            TwixlCart.eventOffline();
        }

        $('#twixl-cart table tbody').html('');
        $('#twixl-cart table tfoot').html('');

        var total = 0;
        for (var i = 0; i < products.length; i++) {
            var row = products[i];
            var template = $('<tr/>', {'product_id': row['id']});
            var remove   = $('<a/>', {'class': 'twixl-remove', 'text': 'remove', 'href': ''});
            var actions  = $('<td/>', {'class': 'actions'});
            template.append($('<td/>', {'class': 'product', 'text': row['product']}));
            template.append($('<td/>', {'class': 'count', 'text': row['count']}));
            template.append($('<td/>', {'class': 'price', 'text': '€ ' + (row['total'] / row['count']).toFixed(2)}));
            template.append($('<td/>', {'class': 'total', 'text': '€ ' + parseFloat(row['total']).toFixed(2)}));
            actions.append(remove);
            template.append(actions);
            $('#twixl-cart table tbody').append(template);
            total += (parseInt(row['count']) * parseFloat(row['price']));
        }

        var template = $('<tr/>');
        template.append($('<td/>', {'class': 'total', 'colspan': 4, 'text': '€ ' + total.toFixed(2)}));
        template.append($('<td/>', {'text': ''}));
        $('#twixl-cart table tfoot').append(template);

        if (products.length == 0) {
            TwixlCart.showScreen('#twixl-empty-cart');
        } else {
            TwixlCart.showScreen('#twixl-cart');
        }

        return false;

    },

    actionConfirmOrder: function() {
        TwixlCart.showScreen('#twixl-confirm-order');
        $('#twixl-order-email').val('').focus();
        $('#twixl-order-email').removeClass('error');
        return false;
    },

    actionPlaceOrder: function() {

        if ($('#twixl-order-email').val() == '') {
            $('#twixl-order-email').addClass('error');
            $('#twixl-order-email').focus();
            return false;
        }

        $('#twixl-order-email').removeClass('error');
        TwixlCart.showScreen('#twixl-place-order-progress');
        TwixlLogger.info('Placing order...');

        $.ajax({
            'url': 'https://services.twixlmedia.com/fruit-company/place_order',
            'type': 'POST',
            'contentType': 'application/json',
            'dataType': 'json',
            'data': JSON.stringify({
                'order': TwixlCartDB.getAll(),
                'from': $('#twixl-order-email').val(),
            }),
            'success': function(result) {
                $('#twixl-cart-order-id').html(result['order_id']);
                TwixlCartDB.removeAll();
                TwixlCart.showScreen('#twixl-order-finish');
            },
            'error': function(xhr, errorType, error) {
                TwixlLogger.error(error.message);
            },
        });

        return false;

    },

    showScreen: function(name) {
        $('.twixl-cart').hide();
        $(name).show();
    },

};

var TwixlCartDB = {

    id: undefined,
    products: {},

    init: function(id, products) {

        this.id = id;

        TwixlLogger.info('DB with ID: ' + id);
        if (products) {
            this.products = products;
            for (var product in this.products) {
                TwixlLogger.dump(TwixlCartDB.products[product], '   Product: ' + product + ' -> ');
            }
        }

    },

    add: function(product) {

        if (!TwixlCartDB._checkProduct(product)) {
            return;
        }

        TwixlLogger.info('Adding: ' + product);
        var data = TwixlCartDB._getAll();
        if (!data[product]) {
            data[product] = 0;
        }
        data[product] = data[product] + 1;
        TwixlCartDB._set(data);

    },

    get: function(product) {
        return TwixlCartDB._get(product);
    },

    getAll: function() {
        var data = TwixlCartDB._getAll();
        var result = [];
        for (var product in data) {
            var productData = TwixlCartDB._checkProduct(product);
            if (productData) {
                productData['id']    = product;
                productData['count'] = data[product];
                productData['total'] = productData['count'] * productData['price'];
                result.push(productData);
            }
        }
        return result;
    },

    remove: function(product) {
        var data = TwixlCartDB._getAll();
        if (data[product]) {
            data[product] = undefined;
        }
        TwixlCartDB._set(data);
    },

    removeAll: function() {
        TwixlCartDB._set({});
    },

    _checkProduct: function(product) {
        var productData = TwixlCartDB.products[product];
        if (!productData) {
            TwixlLogger.error('Unknown product: ' + product);
            return false;
        }
        return productData;
    },

    _getAll: function() {
        try {
            var data = localStorage.getItem(TwixlCartDB.id);
            return (data == undefined) ? {} : JSON.parse(data);
        } catch (e) {
            return {};
        }
    },

    _get: function(product) {
        var data = TwixlCartDB._getAll()[product];
        if (data) {
            var productData = TwixlCartDB._checkProduct(product);
            productData['id']    = product;
            productData['count'] = data;
            productData['total'] = productData['count'] * productData['price'];
            data = productData;
        }
        return data;
    },

    _set: function(data) {
        localStorage.setItem(TwixlCartDB.id, JSON.stringify(data));
    },

}
