(function($) {
    $.ui.ContactImporterLogoSetter = {
        setLogo: function(logoClass) {
            var logoDiv = $('.bsd-contactImporter-logo', this.element);
            var logoDivClasses = logoDiv.get(0).className.split(/\s+/);

            if(logoDivClasses.length > 1){
                logoDiv.removeClass(logoDivClasses[1]);
            }

            logoDiv.addClass(logoClass);
        }
    };
})(window.bQuery || window.jQuery);
