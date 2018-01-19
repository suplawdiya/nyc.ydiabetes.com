window.bQuery = window.bQuery || jQuery.noConflict(true);

(function($) {
    $.widget(
        'ui.ContactImporterLoginForm',
        $.extend(
            $.ui.ContactImporterLogoSetter,
            {
                _init: function() {
                    $('.backLink', this.element).bind('click', {widget: this}, function(e) {
                        e.preventDefault();
                        var widget = e.data.widget;
                        widget.hide();
                        widget.element.trigger('cancel');
                    });

                    $('input[type=submit]', this.element).bind('click', {widget: this}, function(e) {
                        e.preventDefault();
                        var widget = e.data.widget;

                        if (widget._validateLogin()) {
                            widget.hide();
                            widget.element.trigger('login', [$('input', widget.element).serialize()]);
                        } else {
                            widget.showError('Email address and passwork are required');
                        }
                    });

                    this._hideError();
                },
                        
                show: function() {
                    this.element.show();
                },

                hide: function() {
                    this._hideError();
                    this.element.hide();
                },

                setService: function(service) {
                    $('input[name=contactImporter-service]', this.element).val(service);
                },

                setRequestType: function(requestType) {
                    $('input[name=contactImporter-requestType]', this.element).val(requestType);
                },

                showError: function(errorMessage) {
                    $('.loginForm-errors', this.element)
                        .html('<span>' + errorMessage + '</span>')
                        .show();
                },

                _validateLogin: function() {
                    return $('input[name=contactImporter-username]', this.element).val() && $('input[name=contactImporter-pw]', this.element).val();
                },

                _hideError: function() { 
                    $('.loginForm-errors', this.element).hide();
                }
            }
        )
    );
})(window.bQuery || window.jQuery);
