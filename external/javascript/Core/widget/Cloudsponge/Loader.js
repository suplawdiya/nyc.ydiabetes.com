(function($) {
    $.widget(
        'ui.ContactImporterLoader',
        $.extend(
            $.ui.ContactImporterLogoSetter,
            {
                setMessage: function(message) {
                    $('.loadingMessage a', this.element).html(message);
                },

                show: function() {
                    this.element.show();
                },

                hide: function() {
                    this.element.hide();
                }
            }
        )
    );
})(window.bQuery || window.jQuery);
