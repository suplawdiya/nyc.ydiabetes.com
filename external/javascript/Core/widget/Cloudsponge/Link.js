(function($) {
    $.widget(
        'ui.ContactImporterLink',
        $.extend($.ui.getVar, {
            _init: function() {
                $('a', this.element).bind('click', {widget: this}, function (e) {
                    e.preventDefault();
                    var widget = e.data.widget; 
                    var settings = widget._getJsonVar('link-settings');
                    widget.element.trigger('linkSelected', [settings.service, settings.requestType]);
                });
            }
        })
    );
})(window.bQuery || window.jQuery);
